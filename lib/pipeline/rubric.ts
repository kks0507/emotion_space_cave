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
 * 매칭 방향 → 후보로 끌어올 target emotions = "기능(톤)" 기준.
 * 데이터 라벨은 '문장이 품은 감정'이라, 슬픔 라벨을 주면 위로가 아니라 슬픔의 파편이 됨.
 * 따라서 위로/응원은 슬픔을 미러링하지 않고 **따뜻·희망 시구**(기쁨/무감정)로 간다.
 * 어떤 결인지는 select.ts의 기능 프롬프트가 최종 선별한다.
 */
export function targetEmotionsFor(dir: MatchDirection, _a: EmotionAnalysis): Emotion[] {
  switch (dir) {
    case "축하":
    case "들어주기":
      // 밝고 빛나는 기쁨 시구
      return ["기쁨"];
    case "공감": // 위로 — 따뜻·희망 위주(슬픔 미러링 제거)
    case "전환": // 응원/안전 — 다독임·희망
      return ["기쁨", "무감정"];
  }
}
