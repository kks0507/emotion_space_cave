import type { PipelineResult, UserInput } from "../types";
import type { AudienceProfile } from "../audience/types";
import { analyzeEmotion } from "./analyze";
import { evaluateRubric, targetEmotionsFor } from "./rubric";
import { fetchCandidates } from "../db/queries";
import { selectBest } from "./select";
import { composeCardLetter } from "./compose";
import { isLLMAvailable } from "../llm/client";

// 5단계 파이프라인 오케스트레이터 — audience 프로필만 주입받아 공통 로직 전체를 실행.
// 입력 → 감정분석(2) → 루브릭(D14) → 후보추출(3) → 선별(4) → 카드+편지(5)
export async function runPipeline(
  input: UserInput,
  audience: AudienceProfile
): Promise<PipelineResult> {
  // 2단계
  const analysis = await analyzeEmotion(input);

  // 루브릭 + 매칭 방향 결정 (D14/D13)
  const rubric = evaluateRubric(analysis);
  const targetEmotions = targetEmotionsFor(rubric.direction, analysis);

  // 3단계 후보 추출 — 시(詩) 전용 풀 우선. 너무 적으면 전체 장르로 폴백.
  let candidates = await fetchCandidates(targetEmotions, { limit: 60 });
  if (candidates.length < 6) {
    candidates = await fetchCandidates(targetEmotions, { limit: 60, genre: null });
  }

  // 4단계 선별 (기능/톤 기반)
  const { selected, usedVector } = await selectBest(
    candidates,
    input,
    analysis,
    rubric.direction
  );

  // 5단계 카드 + 편지
  const output = await composeCardLetter({
    input,
    analysis,
    rubric,
    selected,
    audience,
  });

  return {
    analysis,
    rubric,
    selected,
    output,
    meta: {
      candidateCount: candidates.length,
      usedVector,
      usedLLM: isLLMAvailable(),
    },
  };
}
