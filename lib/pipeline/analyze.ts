import type { EmotionAnalysis, Emotion, Intent, UserInput } from "../types";
import { ALL_EMOTIONS } from "../types";
import { scoreLexicon } from "../lexicon/negativity";
import { isLLMAvailable, generateJSON } from "../llm/client";

// 2단계 하이브리드 감정 분석 (D9):
//   1) 사전으로 1차 점수(재현·설명 가능, 위기 근거)
//   2) LLM이 맥락 보정(반어·비유·감정/의도) — 키 없으면 사전 결과만으로 동작
// 최종 점수 = max(사전, LLM) — 미탐 방지(루브릭 원칙).

const INTENTS: Intent[] = ["털어놓기", "자랑", "기쁜소식", "격려요청", "일상"];

const LLM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    emotions: {
      type: "array",
      items: { type: "string", enum: ALL_EMOTIONS },
    },
    styles: { type: "array", items: { type: "string" } },
    negativeIntensity: { type: "integer", enum: [0, 1, 2, 3, 4] },
    dropoutIntent: { type: "integer", enum: [0, 1, 2, 3, 4] },
    intent: { type: "string", enum: INTENTS },
    rationale: { type: "string" },
  },
  required: [
    "emotions",
    "styles",
    "negativeIntensity",
    "dropoutIntent",
    "intent",
    "rationale",
  ],
} as const;

const SYSTEM = `너는 학생이 털어놓은 글의 정서를 분석하는 엔진이다. 목적은 학업중단(자퇴·휴학) 예방을 위한 정서 조기경보다.
- emotions: 글에 담긴 감정을 7종(기쁨/슬픔/분노/불안/당황/상처/무감정)에서 고른다(복수 가능).
- negativeIntensity(0~4): 부정 정서의 강도. 0=없음, 4=압도적 고통.
- dropoutIntent(0~4): 학업 이탈/포기 의사의 구체성. 0=없음, 1=막연한 무기력, 2=학교에 대한 불만·거리감, 3="그만두고 싶다"는 의사 표현, 4=구체적 자퇴/휴학/자해 언급.
- intent: 발화 의도. 털어놓기/자랑/기쁜소식/격려요청/일상.
- 반어("좋겠다 정말~")·비유·돌려 말하기를 반드시 고려해 표면이 아닌 진짜 정서를 읽어라.
- rationale: 판단 근거를 한국어 한두 문장으로.`;

export async function analyzeEmotion(input: UserInput): Promise<EmotionAnalysis> {
  const lex = scoreLexicon(input.text);

  if (!isLLMAvailable()) {
    // 폴백: 사전만으로 구성
    const emotions = guessEmotionsFromLexicon(lex.axisA, lex.axisB);
    return {
      emotions,
      styles: [],
      negativeIntensity: lex.axisA,
      dropoutIntent: lex.axisB,
      intent: lex.axisA >= 1 || lex.axisB >= 1 ? "털어놓기" : "일상",
      lexiconHits: lex.hits,
      rationale: "사전 기반 1차 분석(LLM 미사용).",
    };
  }

  try {
    const llm = await generateJSON<{
      emotions: Emotion[];
      styles: string[];
      negativeIntensity: number;
      dropoutIntent: number;
      intent: Intent;
      rationale: string;
    }>({
      system: SYSTEM,
      user: `[나이 ${input.age}] ${input.text}`,
      schema: LLM_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 512,
    });

    // max(사전, LLM) — 위기 미탐 방지
    return {
      emotions: llm.emotions.length ? llm.emotions : guessEmotionsFromLexicon(lex.axisA, lex.axisB),
      styles: llm.styles ?? [],
      negativeIntensity: Math.max(lex.axisA, llm.negativeIntensity),
      dropoutIntent: Math.max(lex.axisB, llm.dropoutIntent),
      intent: llm.intent,
      lexiconHits: lex.hits,
      rationale: llm.rationale,
    };
  } catch {
    // LLM 실패 시에도 사전 결과로 안전하게 동작
    const emotions = guessEmotionsFromLexicon(lex.axisA, lex.axisB);
    return {
      emotions,
      styles: [],
      negativeIntensity: lex.axisA,
      dropoutIntent: lex.axisB,
      intent: lex.axisA >= 1 ? "털어놓기" : "일상",
      lexiconHits: lex.hits,
      rationale: "사전 기반 분석(LLM 오류 폴백).",
    };
  }
}

function guessEmotionsFromLexicon(axisA: number, axisB: number): Emotion[] {
  if (axisA >= 3 || axisB >= 3) return ["슬픔", "상처"];
  if (axisA >= 1) return ["불안"];
  return ["무감정"];
}
