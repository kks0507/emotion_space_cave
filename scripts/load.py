#!/usr/bin/env python3
"""AI Hub 158 문학작품 낭송 라벨 데이터 → Turso 적재 (다중행 INSERT, 멱등).
ERD: work / sentence / label / sentence_label (HANDOVER §7).
한 번의 네트워크 왕복에 수백 행을 INSERT → executemany 대비 수십~수백배 빠름.
임베딩 컬럼은 RAG 단계에서 ALTER로 추가.
"""
import json, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = dict(l.split('=', 1) for l in open(os.path.join(ROOT, '.env')).read().splitlines() if '=' in l)
DATA = os.path.join(ROOT, 'data_raw', 'extracted')
FILES = [os.path.join(DATA, 'train', '1.학습레이블.json'),
         os.path.join(DATA, 'val', '2.검증레이블.json')]

import libsql_experimental as libsql

DDL = """
CREATE TABLE IF NOT EXISTS work (
  work_id TEXT PRIMARY KEY, title TEXT, author TEXT, translator TEXT,
  genre TEXT, period_raw TEXT, period_norm TEXT, publish_year INTEGER
);
CREATE TABLE IF NOT EXISTS label (
  id INTEGER PRIMARY KEY, style TEXT NOT NULL, emotion TEXT NOT NULL,
  UNIQUE(style, emotion)
);
CREATE TABLE IF NOT EXISTS sentence (
  id TEXT PRIMARY KEY, work_id TEXT REFERENCES work(work_id),
  recitation_src_id TEXT, seq INTEGER, origin_text TEXT NOT NULL, ptr TEXT,
  vote_total INTEGER, vote_agree INTEGER, agree_ratio REAL
);
CREATE TABLE IF NOT EXISTS sentence_label (
  sentence_id TEXT REFERENCES sentence(id), label_id INTEGER REFERENCES label(id),
  PRIMARY KEY (sentence_id, label_id)
);
CREATE INDEX IF NOT EXISTS idx_sl_label ON sentence_label(label_id, sentence_id);
CREATE INDEX IF NOT EXISTS idx_sentence_work ON sentence(work_id);
CREATE INDEX IF NOT EXISTS idx_sentence_quality ON sentence(agree_ratio);
"""

ERA = {'현대': '현대', '근대': '근대', '고대': '고대', '중세': '중세',
       '근대/현대': '근대·현대', '고대/중세': '고대·중세', '중세/근대': '중세·근대',
       '현대스페인': '현대'}
def norm_period(p):
    return ERA.get((p or '').strip(), '미상')

def conn():
    return libsql.connect(database=ENV['TURSO_DATABASE_URL'], auth_token=ENV['TURSO_AUTH_TOKEN'])

def bulk_insert(c, table, cols, rows, batch_rows):
    """다중행 INSERT OR IGNORE. 한 statement에 batch_rows개씩."""
    ncol = len(cols)
    placeholder = "(" + ",".join(["?"] * ncol) + ")"
    head = f"INSERT OR IGNORE INTO {table}({','.join(cols)}) VALUES "
    done = 0
    for i in range(0, len(rows), batch_rows):
        chunk = rows[i:i+batch_rows]
        sql = head + ",".join([placeholder] * len(chunk))
        params = tuple(v for row in chunk for v in row)
        c.execute(sql, params)
        c.commit()
        done += len(chunk)
    return done

def main():
    t0 = time.time()
    c = conn()
    for stmt in DDL.strip().split(';'):
        if stmt.strip():
            c.execute(stmt)
    c.commit()
    print('[1/5] DDL 완료', flush=True)

    works, labels, sentences, sent_labels = {}, {}, [], set()
    for fp in FILES:
        data = json.load(open(fp))
        for it in data:
            rs = it.get('recite_src', {}); lit = rs.get('literature', {})
            wid = lit.get('id')
            if wid and wid not in works:
                works[wid] = (wid, lit.get('title'), lit.get('author'), lit.get('translator'),
                              lit.get('genre'), lit.get('period'), norm_period(lit.get('period')),
                              lit.get('publish_year'))
            rid = it.get('id')
            for idx, sen in enumerate(it.get('sentences', [])):
                sid = f"{rid}-{idx:03d}"
                votes = sen.get('votes', []) or []
                vt = len(votes); va = sum(1 for v in votes if v.get('agree'))
                ratio = (va / vt) if vt else None
                vp = sen.get('voice_piece', {}) or {}
                sentences.append((sid, wid, rid, idx, sen.get('origin_text'), vp.get('ptr'), vt, va, ratio))
                for st in sen.get('styles', []) or []:
                    key = (st.get('style'), st.get('emotion'))
                    labels.setdefault(key, None); sent_labels.add((sid, key))
        print(f'  파싱: {os.path.basename(fp)} (누적 문장 {len(sentences)})', flush=True)

    for i, k in enumerate(sorted(labels), start=1):
        labels[k] = i
    print(f'[2/5] 집계: work {len(works)}, label {len(labels)}, sentence {len(sentences)}, sentence_label {len(sent_labels)}', flush=True)

    bulk_insert(c, 'label', ['id', 'style', 'emotion'], [(i, k[0], k[1]) for k, i in labels.items()], 200)
    print('[3/5] label 적재 완료', flush=True)

    bulk_insert(c, 'work', ['work_id', 'title', 'author', 'translator', 'genre', 'period_raw', 'period_norm', 'publish_year'],
                list(works.values()), 300)
    print(f'[4/5] work {len(works)}건 적재 완료 ({time.time()-t0:.0f}s)', flush=True)

    n = bulk_insert(c, 'sentence', ['id', 'work_id', 'recitation_src_id', 'seq', 'origin_text', 'ptr', 'vote_total', 'vote_agree', 'agree_ratio'],
                    sentences, 300)
    print(f'[5a] sentence {n}건 적재 완료 ({time.time()-t0:.0f}s)', flush=True)

    slrows = [(sid, labels[key]) for (sid, key) in sent_labels]
    n = bulk_insert(c, 'sentence_label', ['sentence_id', 'label_id'], slrows, 400)
    print(f'[5b] sentence_label {n}건 적재 완료  (총 {time.time()-t0:.0f}s)', flush=True)

if __name__ == '__main__':
    main()
