#!/usr/bin/env python3
"""적재 마무리 — sentence_label 먼저(QA 즉시 가능) → 남은 sentence 보충.
실측 최적 배치: sentence 1000행, sentence_label 4000행. 멱등(OR IGNORE).
이미 적재된 sentence는 DB에서 id를 받아 건너뛴다(재전송 낭비 제거)."""
import json, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = dict(l.split('=', 1) for l in open(os.path.join(ROOT, '.env')).read().splitlines() if '=' in l)
DATA = os.path.join(ROOT, 'data_raw', 'extracted')
FILES = [os.path.join(DATA, 'train', '1.학습레이블.json'),
         os.path.join(DATA, 'val', '2.검증레이블.json')]

import libsql_experimental as libsql

def conn():
    return libsql.connect(database=ENV['TURSO_DATABASE_URL'], auth_token=ENV['TURSO_AUTH_TOKEN'])

def bulk(c, table, cols, rows, batch):
    ph = "(" + ",".join(["?"] * len(cols)) + ")"
    head = f"INSERT OR IGNORE INTO {table}({','.join(cols)}) VALUES "
    done = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        c.execute(head + ",".join([ph] * len(chunk)), tuple(v for r in chunk for v in r))
        c.commit()
        done += len(chunk)
        if (i // batch) % 10 == 0:
            print(f'    {table}: {done}/{len(rows)}', flush=True)
    return done

def main():
    t0 = time.time()
    c = conn()

    # label id 맵을 DB에서 직접 (이미 적재됨)
    labels = {(r[1], r[2]): r[0] for r in c.execute("select id,style,emotion from label").fetchall()}
    print(f'label map: {len(labels)}', flush=True)

    # 파싱
    sentences, sent_labels = [], set()
    for fp in FILES:
        for it in json.load(open(fp)):
            wid = it.get('recite_src', {}).get('literature', {}).get('id')
            rid = it.get('id')
            for idx, sen in enumerate(it.get('sentences', [])):
                sid = f"{rid}-{idx:03d}"
                votes = sen.get('votes', []) or []
                vt = len(votes); va = sum(1 for v in votes if v.get('agree'))
                vp = sen.get('voice_piece', {}) or {}
                sentences.append((sid, wid, rid, idx, sen.get('origin_text'), vp.get('ptr'), vt, va, (va/vt) if vt else None))
                for st in sen.get('styles', []) or []:
                    sent_labels.add((sid, (st.get('style'), st.get('emotion'))))
    print(f'파싱: sentence {len(sentences)}, sentence_label {len(sent_labels)} ({time.time()-t0:.0f}s)', flush=True)

    # ⚠️ Turso는 FK 강제 → 부모(sentence) 먼저, 자식(sentence_label) 나중.
    # 1) 남은 sentence 보충 (이미 있는 id는 제외)
    existing = {r[0] for r in c.execute("select id from sentence").fetchall()}
    todo = [s for s in sentences if s[0] not in existing]
    print(f'sentence 잔여 {len(todo)} (기존 {len(existing)})', flush=True)
    bulk(c, 'sentence', ['id', 'work_id', 'recitation_src_id', 'seq', 'origin_text', 'ptr', 'vote_total', 'vote_agree', 'agree_ratio'], todo, 1000)
    print(f'[A] sentence 보충 완료 ({time.time()-t0:.0f}s)', flush=True)

    # 2) sentence_label (부모 모두 적재 후)
    slrows = [(sid, labels[key]) for (sid, key) in sent_labels if key in labels]
    bulk(c, 'sentence_label', ['sentence_id', 'label_id'], slrows, 4000)
    print(f'[B] sentence_label {len(slrows)} 완료 ({time.time()-t0:.0f}s)', flush=True)

    for t in ['work', 'label', 'sentence', 'sentence_label']:
        print(f'  {t}:', c.execute(f'select count(*) from {t}').fetchone()[0], flush=True)

if __name__ == '__main__':
    main()
