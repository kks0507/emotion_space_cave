#!/usr/bin/env python3
"""데모 우선 적재 — 이미 적재된 sentence에 한해 sentence_label을 채운다(FK 충족).
나머지 미적재 sentence와 그 라벨은 이후 finish_load.py로 보충.
sentence_label은 정수 2컬럼이라 페이로드가 작아 큰 배치(8000) 가능."""
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
        if (i // batch) % 5 == 0:
            print(f'    {table}: {done}/{len(rows)}', flush=True)
    return done

def main():
    t0 = time.time()
    c = conn()
    labels = {(r[1], r[2]): r[0] for r in c.execute("select id,style,emotion from label").fetchall()}
    existing = {r[0] for r in c.execute("select id from sentence").fetchall()}
    print(f'label {len(labels)}, 적재된 sentence {len(existing)}', flush=True)

    sent_labels = set()
    for fp in FILES:
        for it in json.load(open(fp)):
            rid = it.get('id')
            for idx, sen in enumerate(it.get('sentences', [])):
                sid = f"{rid}-{idx:03d}"
                if sid not in existing:
                    continue  # FK: 부모 문장이 아직 없으면 건너뜀
                for st in sen.get('styles', []) or []:
                    key = (st.get('style'), st.get('emotion'))
                    if key in labels:
                        sent_labels.add((sid, labels[key]))
    print(f'대상 sentence_label {len(sent_labels)} ({time.time()-t0:.0f}s)', flush=True)

    n = bulk(c, 'sentence_label', ['sentence_id', 'label_id'], list(sent_labels), 8000)
    print(f'완료 sentence_label {n} ({time.time()-t0:.0f}s)', flush=True)
    for t in ['sentence', 'sentence_label']:
        print(f'  {t}:', c.execute(f'select count(*) from {t}').fetchone()[0], flush=True)

if __name__ == '__main__':
    main()
