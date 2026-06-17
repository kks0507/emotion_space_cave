import type {
  EmotionAnalysis,
  Emotion,
  MatchDirection,
  RubricLevel,
  RubricResult,
} from "../types";

// D14 단계적 루브릭 — 위기 강도 = max(축A 부정정서강도, 축B 이탈의사구체성).
// MTSS 3계층 차용. 레벨이 매칭 방향(D13 C)까지 결정.

export function evaluateRubric(a: EmotionAnalysis): RubricResult {
  const level = Math.max(a.negativeIntensity, a.dropoutIntent) as RubricLevel;

  const tier: 1 | 2 | 3 = level <= 1 ? 1 : level === 2 ? 2 : 3;
  const careMode = level >= 3;
  const showCrisisNotice = level >= 3;

  const adminFlag: RubricResult["adminFlag"] =
    level >= 4 ? "alert" : level === 3 ? "candidate" : level === 2 ? "watch" : "none";

  const direction = decideDirection(level, a);

  return { level, tier, direction, careMode, showCrisisNotice, adminFlag };
}

/**
 * 매칭 방향 결정 (D13 C: 레벨별 분기).
 * - L0~L2: 의도 축(축②)으로 결 선택 — 공감/축하/들어주기
 * - L3~L4: 안전 우선 → 전환(밝은 결) + 위기 안내. 압도된 사람에게 슬픈 문장 금지.
 */
function decideDirection(level: RubricLevel, a: EmotionAnalysis): MatchDirection {
  if (level >= 3) return "전환";
  switch (a.intent) {
    case "기쁜소식":
      return "축하";
    case "자랑":
      return "들어주기";
    case "털어놓기":
    case "격려요청":
      return "공감";
    default:
      // 일상: 긍정 감정이면 들어주기, 아니면 공감
      return a.emotions.includes("기쁨") ? "들어주기" : "공감";
  }
}

/**
 * 매칭 방향 → 후보로 끌어올 target emotions.
 * 공감=같은 결(사용자 부정 감정), 전환·축하·들어주기=기쁨 계열.
 */
export function targetEmotionsFor(
  dir: MatchDirection,
  a: EmotionAnalysis
): Emotion[] {
  switch (dir) {
    case "공감": {
      // 사용자의 부정 감정과 같은 결. 없으면 슬픔/상처로 폴백.
      const neg = a.emotions.filter((e) =>
        (["슬픔", "분노", "불안", "당황", "상처"] as Emotion[]).includes(e)
      );
      return neg.length ? neg : ["슬픔", "상처"];
    }
    case "축하":
    case "들어주기":
      return ["기쁨"];
    case "전환":
      // 안전 모드: 밝되 과하지 않게. 기쁨 + 무감정(잔잔함)
      return ["기쁨", "무감정"];
  }
}
