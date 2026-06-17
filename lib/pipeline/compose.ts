import type {
  CandidateSentence,
  CardLetter,
  EmotionAnalysis,
  RubricResult,
  UserInput,
} from "../types";
import type { AudienceProfile } from "../audience/types";
import { isLLMAvailable, generateText } from "../llm/client";

// 5단계 — 카드 문구(선택된 문학 문장) + 그 문구를 활용한 2문장 편지.
// 편지 톤·어휘는 audience 페르소나로 분기(공통 로직은 공유).

export async function composeCardLetter(args: {
  input: UserInput;
  analysis: EmotionAnalysis;
  rubric: RubricResult;
  selected: CandidateSentence | null;
  audience: AudienceProfile;
}): Promise<CardLetter> {
  const { input, analysis, rubric, selected, audience } = args;
  const phrase = selected?.text ?? "";
  const source = {
    title: selected?.workTitle ?? null,
    author: selected?.workAuthor ?? null,
    genre: selected?.genre ?? null,
  };

  if (!phrase) {
    return { phrase: "", source, letter: fallbackLetter(audience) };
  }

  if (!isLLMAvailable()) {
    return { phrase, source, letter: fallbackLetter(audience) };
  }

  try {
    const system = `${audience.persona.voice}
어휘 가이드: ${audience.persona.vocab}
피할 것: ${audience.persona.avoid}
편지 결: ${audience.directionHint(rubric.direction)}
규칙: 정확히 2문장. 아래 '문학 문구'를 자연스럽게 녹여 인용·변주하되, 설교·분석·진단은 금지. ${input.name}님(을)를 부르되 과하지 않게. 사용자의 나이(${input.age})에 맞는 말투.`;

    const user = `사용자 글: ${input.text}
감지 정서: ${analysis.emotions.join(", ")} / 결: ${rubric.direction}
문학 문구: "${phrase}"

이 문구를 살려 2문장 편지를 써줘.`;

    const letter = await generateText({ system, user, maxTokens: 320 });
    return { phrase, source, letter: letter || fallbackLetter(audience) };
  } catch {
    return { phrase, source, letter: fallbackLetter(audience) };
  }
}

function fallbackLetter(audience: AudienceProfile): string {
  return audience.key === "child"
    ? "오늘 네 마음을 동굴에 잘 두고 갔어. 이 문장이 너랑 같이 있어 줄 거야."
    : "당신의 마음을 동굴이 가만히 받아 두었습니다. 이 한 문장이 곁에 머물기를.";
}
