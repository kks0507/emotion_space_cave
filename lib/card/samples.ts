import { TYPE, type CardMeta } from "./spirit";
import type { Emotion } from "../types";
import type { CardProps } from "@/components/MaeumCard";

// 홈페이지 큐레이션용 전시 카드(실데이터 아님, 쇼케이스).
function sample(
  emotion: Emotion,
  style: string,
  phrase: string,
  rarity: CardMeta["rarity"],
  hp: number,
  number: number
): Omit<CardProps, "showDownload"> {
  const t = TYPE[emotion];
  const rarityLabel = rarity === "holo" ? "★ 홀로" : rarity === "rare" ? "◆ 레어" : "● 노멀";
  return {
    phrase,
    source: { title: null, author: null, genre: null },
    meta: { emotion, spirit: t.spirit, style, hp, number, rarity, rarityLabel },
  };
}

export const GALLERY: Array<Omit<CardProps, "showDownload">> = [
  sample("기쁨", "신이 난", "오늘은 마음껏 웃어도 되는 날이야.", "holo", 120, 7),
  sample("슬픔", "눈물이 나는", "괜찮아, 눈물도 마음의 한 조각이란다.", "rare", 80, 23),
  sample("분노", "단단한", "화가 나는 건, 네가 소중한 걸 지키고 싶어서야.", "common", 90, 41),
  sample("상처", "보드라운", "다친 자리에 새 살이 돋듯, 마음도 그래.", "holo", 70, 52),
];
