import type { AudienceProfile } from "./types";

// 초등생 프로필 — 따뜻하고 쉬운 말, 짧은 문장, 안심 위주.
export const childProfile: AudienceProfile = {
  key: "child",
  label: "마음동굴 어린이",
  tagline: "여기는 너만의 동굴이야. 무슨 말이든 괜찮아.",
  ageRange: "초등학생",

  copy: {
    enterTitle: "마음동굴에 들어왔어",
    enterSubtitle: "오늘 마음이 어땠어? 여기엔 아무도 없으니 편하게 말해줘.",
    namePlaceholder: "이름 (별명도 좋아)",
    agePlaceholder: "나이",
    textPlaceholder: "오늘 있었던 일, 기분… 뭐든지 적어봐.",
    submitLabel: "동굴에 속삭이기",
    loadingLabel: "동굴이 네 마음을 듣고 있어…",
    letterHeading: "동굴이 너에게",
    againLabel: "다시 속삭이기",
  },

  theme: {
    bg: "#FDF6EC",
    cardBg: "#FFFFFF",
    accent: "#E8A87C",
    text: "#4A3F35",
    font: "'Gowun Dodum', system-ui, sans-serif",
  },

  persona: {
    voice:
      "너는 초등학생 아이의 비밀 이야기를 들어주는 다정한 동굴이야. 아이의 이름을 부르고, 아이를 절대 가르치려 들지 않아.",
    vocab:
      "쉽고 짧은 문장. 초등학생이 아는 낱말만. 어려운 한자어·추상어 금지. 반말로 따뜻하게.",
    avoid:
      "훈계, 평가, '~해야 해' 같은 지시, 무서운 표현, 어른스러운 충고는 쓰지 마.",
  },

  crisisNotice: (level) => {
    if (level >= 4)
      return "지금 많이 힘들면 꼭 어른에게 말해줘. 24시간 들어주는 곳도 있어 — 청소년 전화 1388 (전화·문자 모두 돼).";
    if (level >= 3)
      return "혼자 많이 힘들면 선생님이나 믿는 어른에게 말해도 괜찮아. 도와줄 사람들이 있어 (청소년 전화 1388).";
    return null;
  },

  directionHint: (dir) => {
    switch (dir) {
      case "공감":
        return "아이의 마음에 가만히 맞장구치며 '네 마음 알아' 하고 곁에 있어줘.";
      case "전환":
        return "아이가 너무 무겁지 않게, 작고 따뜻한 희망 한 줌을 살짝 건네줘.";
      case "축하":
        return "아이의 기쁜 일을 같이 신나서 축하해줘.";
      case "들어주기":
        return "아이의 자랑을 진심으로 들어주고 '우와' 하고 함께 즐거워해줘.";
    }
  },
};
