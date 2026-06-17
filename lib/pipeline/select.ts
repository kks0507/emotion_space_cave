import type { CandidateSentence, EmotionAnalysis, MatchDirection } from "../types";
import { hasEmbeddingColumn } from "../db/queries";
import { isLLMAvailable, generateJSON } from "../llm/client";

// 방향(기능)별 선별 기준 — "확실히 위로/축하/응원되는" 시구를 고르게 한다.
const FUNCTION_GUIDE: Record<MatchDirection, string> = {
  축하: "이 아이의 기쁜 일을 환하게 축하하고 함께 기뻐하는, 밝고 빛나는 시구",
  들어주기: "이 아이의 자랑을 흐뭇하게 들어주고 맞장구치는, 따뜻하고 흐뭇한 시구",
  전환: "힘든 아이를 부드럽게 다독이고 작은 희망을 건네는, 따뜻한 시구",
  공감: "슬프거나 지친 아이를 따뜻하게 위로하고 다독여 주는, 포근하고 희망적인 시구",
};

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
  analysis: EmotionAnalysis,
  direction: MatchDirection
): Promise<{ selected: CandidateSentence | null; usedVector: boolean }> {
  if (candidates.length === 0) return { selected: null, usedVector: false };

  // 1) 벡터 경로 (임베딩 준비 시)
  if (await hasEmbeddingColumn()) {
    const byVec = candidates
      .filter((c) => typeof c.similarity === "number")
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    if (byVec.length) return { selected: byVec[0], usedVector: true };
  }

  // 2) 기능(톤) 기반 LLM 선별 — 상위 14개 후보 제시
  const top = candidates.slice(0, 14);
  if (isLLMAvailable()) {
    try {
      const list = top.map((c, i) => `${i}. ${c.text}`).join("\n");
      const pick = await generateJSON<{ index: number; reason: string }>({
        system:
          "너는 아이에게 건넬 시구 한 줄을 고르는 큐레이터다. 아래 후보 중 목적에 가장 잘 맞는, 그 자체로 완결되고 따뜻한 시구 하나를 고른다. " +
          "대사 파편·맥락 불명·우울하거나 절망적인 표현은 절대 고르지 마라. index만 정확히.",
        user: `목적: ${FUNCTION_GUIDE[direction]}\n아이가 쓴 글: ${input.text}\n\n시구 후보:\n${list}`,
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
