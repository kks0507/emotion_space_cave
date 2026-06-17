import { db } from "./client";
import type { CandidateSentence, Emotion } from "../types";

const QUALITY_MIN = 0.8; // 교차검증 동의율 ≥0.8 문장만 사용 (docs/research/02)

/**
 * 3단계 — 감정 라벨로 후보 문장 추출.
 * target emotions(매칭 방향에 따라 결정) + 품질 필터 + 라벨 집계.
 * 4단계(벡터 정렬)에 넘길 후보 풀을 반환.
 */
export async function fetchCandidates(
  targetEmotions: Emotion[],
  opts: {
    limit?: number;
    minAgree?: number;
    genre?: string | null; // '시' 전용 풀(기본). null이면 전체 장르(폴백)
    lenMin?: number;
    lenMax?: number;
  } = {}
): Promise<CandidateSentence[]> {
  const limit = opts.limit ?? 200;
  const minAgree = opts.minAgree ?? QUALITY_MIN;
  const genre = opts.genre === undefined ? "시" : opts.genre; // 기본 시구 위주
  const lenMin = opts.lenMin ?? 12; // 자기완결적 한마디 길이
  const lenMax = opts.lenMax ?? 70;
  if (targetEmotions.length === 0) return [];

  const placeholders = targetEmotions.map(() => "?").join(",");
  const genreClause = genre ? "AND w.genre = ?" : "";
  // 대상 emotion 라벨이 붙은 문장 id를 먼저 좁히고, 메타/라벨을 조인.
  // 시(詩) 위주 + 자기완결 길이 필터 → 대사 파편 배제.
  const sql = `
    WITH matched AS (
      SELECT DISTINCT sl.sentence_id
      FROM sentence_label sl
      JOIN label l ON l.id = sl.label_id
      WHERE l.emotion IN (${placeholders})
    )
    SELECT s.id, s.origin_text, s.ptr, s.agree_ratio,
           w.title, w.author, w.genre,
           GROUP_CONCAT(DISTINCT l2.emotion) AS emotions,
           GROUP_CONCAT(DISTINCT l2.style)   AS styles
    FROM matched m
    JOIN sentence s ON s.id = m.sentence_id
    JOIN work w ON w.work_id = s.work_id
    LEFT JOIN sentence_label sl2 ON sl2.sentence_id = s.id
    LEFT JOIN label l2 ON l2.id = sl2.label_id
    WHERE s.agree_ratio >= ?
      AND LENGTH(s.origin_text) BETWEEN ? AND ?
      ${genreClause}
    GROUP BY s.id
    ORDER BY s.agree_ratio DESC, RANDOM()
    LIMIT ?
  `;
  const args: (string | number)[] = [...targetEmotions, minAgree, lenMin, lenMax];
  if (genre) args.push(genre);
  args.push(limit);
  const rs = await db().execute({ sql, args });

  return rs.rows.map((r) => ({
    id: String(r.id),
    text: String(r.origin_text ?? ""),
    ptr: (r.ptr as string) ?? null,
    emotions: splitList(r.emotions) as Emotion[],
    styles: splitList(r.styles),
    agreeRatio: r.agree_ratio == null ? null : Number(r.agree_ratio),
    workTitle: (r.title as string) ?? null,
    workAuthor: (r.author as string) ?? null,
    genre: (r.genre as string) ?? null,
  }));
}

function splitList(v: unknown): string[] {
  if (v == null) return [];
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

/** 벡터 컬럼(embedding) 존재 여부 — RAG 단계가 켜졌는지 판단 */
export async function hasEmbeddingColumn(): Promise<boolean> {
  try {
    const rs = await db().execute("PRAGMA table_info(sentence)");
    return rs.rows.some((r) => String(r.name) === "embedding");
  } catch {
    return false;
  }
}
