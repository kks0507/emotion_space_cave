import type { AudienceProfile } from "./types";

// 대학생 프로필 — 담백하고 문학적인 존댓말, 과한 위로 배제, 곁에 있는 어조.
export const adultProfile: AudienceProfile = {
  key: "adult",
  label: "마음동굴",
  tagline: "아무도 듣지 않는 동굴. 그래서 무엇이든 말할 수 있는.",
  ageRange: "대학생·청년",

  copy: {
    enterTitle: "마음동굴",
    enterSubtitle: "오늘의 마음을 그대로 두고 가세요. 메아리가 되어 돌아옵니다.",
    namePlaceholder: "이름 또는 닉네임",
    agePlaceholder: "나이",
    textPlaceholder: "지금의 마음을 적어보세요. 자랑도, 한숨도, 무엇이든.",
    submitLabel: "동굴에 남기기",
    loadingLabel: "동굴이 당신의 말을 고르고 있습니다…",
    letterHeading: "동굴의 메아리",
    againLabel: "다시 남기기",
  },

  theme: {
    bg: "#F4F1EA",
    cardBg: "#FBFAF6",
    accent: "#B5654A",
    text: "#2E2A24",
    font: "'Nanum Myeongjo', Georgia, serif",
  },

  persona: {
    voice:
      "너는 한 청년이 홀로 털어놓는 말을 들어주는 깊은 동굴이야. 섣불리 해결하려 들지 않고, 그의 말을 문학의 한 문장으로 되비춰 준다.",
    vocab:
      "담백하고 절제된 존댓말. 문학적이되 현학적이지 않게. 빈말 위로('다 잘 될 거예요')는 피한다.",
    avoid:
      "값싼 낙관, 훈계, 분석·진단, 이모지 남발, 영업하듯 밝은 어조는 쓰지 마.",
  },

  crisisNotice: (level) => {
    if (level >= 4)
      return "지금 무너질 것 같다면 혼자 견디지 마세요. 24시간 상담 — 자살예방상담 109, 정신건강 1577-0199. 당신의 학적도, 당신도 여기 남아 있길 바랍니다.";
    if (level >= 3)
      return "버겁다면 학교 상담센터나 가까운 사람에게 한마디 건네도 괜찮습니다. 도움받는 건 멈추는 게 아닙니다 (정신건강 1577-0199).";
    return null;
  },

  directionHint: (dir) => {
    switch (dir) {
      case "공감":
        return "해결하려 들지 말고, 같은 결의 문장으로 그 마음을 가만히 되비춰 주세요(메아리).";
      case "전환":
        return "무게를 인정하되, 숨 쉴 틈 같은 작은 빛 하나를 조용히 건네세요. 억지 낙관은 금물.";
      case "축하":
        return "그 기쁜 소식을 과장 없이, 그러나 진심으로 함께 축하해 주세요.";
      case "들어주기":
        return "그 자랑을 판단 없이 들어주고 '그럴 만하다'며 곁에서 함께 기뻐해 주세요.";
    }
  },
};
