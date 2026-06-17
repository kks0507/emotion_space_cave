import type { Emotion } from "../types";

// 마음 카드 — 감정을 "타입"으로, 타입마다 정령/색/장면을 부여(포켓몬 카드 차용).
export interface TypeStyle {
  emotion: Emotion;
  spirit: string;     // 정령 이름
  label: string;      // 타입 표기
  icon: string;       // 타입 아이콘(이모지)
  color: string;      // 메인 색
  deep: string;       // 진한 색(테두리/그라데)
  soft: string;       // 옅은 배경
  face: FaceType;     // 정령 표정
}

export type FaceType =
  | "happy" | "teary" | "angry" | "worried" | "shocked" | "tender" | "sleepy";

export const TYPE: Record<Emotion, TypeStyle> = {
  기쁨: { emotion: "기쁨", spirit: "반짝이", label: "기쁨", icon: "☀️", color: "#FFC93C", deep: "#E8A400", soft: "#FFF6DA", face: "happy" },
  슬픔: { emotion: "슬픔", spirit: "방울이", label: "슬픔", icon: "💧", color: "#5B8DEF", deep: "#3A66C4", soft: "#E7F0FF", face: "teary" },
  분노: { emotion: "분노", spirit: "이글이", label: "분노", icon: "🔥", color: "#FF6B5E", deep: "#D8412F", soft: "#FFE7E3", face: "angry" },
  불안: { emotion: "불안", spirit: "안개", label: "불안", icon: "🌫️", color: "#9B8CE8", deep: "#6B5BC0", soft: "#EFEBFF", face: "worried" },
  당황: { emotion: "당황", spirit: "번쩍이", label: "당황", icon: "⚡", color: "#FF9F45", deep: "#E07A1B", soft: "#FFEFDC", face: "shocked" },
  상처: { emotion: "상처", spirit: "보들이", label: "상처", icon: "🩹", color: "#F2789F", deep: "#CF4E7C", soft: "#FFE9F1", face: "tender" },
  무감정: { emotion: "무감정", spirit: "구름이", label: "무감정", icon: "🌙", color: "#9AA7B0", deep: "#6E7A83", soft: "#EEF2F4", face: "sleepy" },
};

export type Rarity = "common" | "rare" | "holo";

export interface CardMeta {
  emotion: Emotion;
  spirit: string;
  style: string;       // 세부 스타일(부제)
  hp: number;          // 마음 HP
  number: number;      // 도감 번호 1~60
  rarity: Rarity;
  rarityLabel: string;
}

// 문자열 → 안정 해시(시드)
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 카드 메타 산출.
 * - number/정령: 스타일·감정 기반(같은 스타일=항상 같은 번호 → 수집 일관성)
 * - hp: 문장 id 시드(카드마다 고정)
 * - rarity: 문장 id 시드 가중(노멀70·레어22·홀로8) → 뽑을 때마다 다른 설렘
 */
export function buildCardMeta(args: {
  emotion: Emotion;
  style: string | null;
  sentenceId: string;
}): CardMeta {
  const t = TYPE[args.emotion] ?? TYPE.무감정;
  const style = args.style ?? t.label;
  const number = (hash(style) % 60) + 1;
  const hp = 40 + (hash(args.sentenceId) % 9) * 10; // 40~120, 10단위
  const r = hash("r" + args.sentenceId) % 100;
  const rarity: Rarity = r < 8 ? "holo" : r < 30 ? "rare" : "common";
  const rarityLabel = rarity === "holo" ? "★ 홀로" : rarity === "rare" ? "◆ 레어" : "● 노멀";
  return { emotion: args.emotion, spirit: t.spirit, style, hp, number, rarity, rarityLabel };
}
