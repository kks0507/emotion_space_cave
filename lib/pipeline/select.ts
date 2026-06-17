import type { CandidateSentence, EmotionAnalysis } from "../types";
import { hasEmbeddingColumn } from "../db/queries";
import { isLLMAvailable, generateJSON } from "../llm/client";

// 4단계 — 후보 중 사용자 맥락에 가장 맞는 1문장 선별 (RAG).
// 우선순위:
//   1) embedding 컬럼이 있으면 벡터 유사도 정렬 (추후 RAG 단계에서 활성화)
//   2) LLM이 상위 후보 중 맥락 적합 1개 선택 (현재 기본)
//   3) 품질(agree_ratio) 최상위 (폴백)

const PICK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { index: { type: "integer" }, reason: { type: "string" } },
  required: ["index", "reason"],
} as const;

export async function selectBest(
  candidates: CandidateSentence[],
  input: { text: string },
  analysis: EmotionAnalysis
): Promise<{ selected: CandidateSentence | null; usedVector: boolean }> {
  if (candidates.length === 0) return { selected: null, usedVector: false };

  // 1) 벡터 경로 (임베딩 준비 시)
  if (await hasEmbeddingColumn()) {
    const byVec = candidates
      .filter((c) => typeof c.similarity === "number")
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    if (byVec.length) return { selected: byVec[0], usedVector: true };
  }

  // 2) LLM 맥락 선별 — 상위 8개만 후보로(토큰 절약)
  const top = candidates.slice(0, 8);
  if (isLLMAvailable()) {
    try {
      const list = top
        .map((c, i) => `${i}. ${c.text}${c.workTitle ? ` — ${c.workTitle}` : ""}`)
        .join("\n");
      const pick = await generateJSON<{ index: number; reason: string }>({
        system:
          "다음 문학 문장 후보 중, 사용자의 마음에 가장 잘 맞아 카드 문구로 건넬 한 문장을 고른다. 사용자를 가르치거나 평가하지 말고, 결이 맞는 문장을 고른다. index만 정확히.",
        user: `사용자 글: ${input.text}\n감지 정서: ${analysis.emotions.join(", ")}\n\n후보:\n${list}`,
        schema: PICK_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 128,
      });
      const idx = Number.isInteger(pick.index) ? pick.index : 0;
      const chosen = top[idx] ?? top[0];
      return { selected: chosen, usedVector: false };
    } catch {
      // 폴백으로 진행
    }
  }

  // 3) 품질 최상위 폴백
  return { selected: top[0], usedVector: false };
}
