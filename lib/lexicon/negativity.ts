// 부정어/위기어 사전 — 하이브리드 감정분석(D9)의 1차 점수 뼈대.
// 재현 가능·설명 가능. 추후 KNU 한국어 감성사전(14.8K, 5단계 극성) 연동 자리.
// 지금은 학업중단 조기경보(D14) 관점의 핵심 신호 위주 시드 사전.

export interface LexiconHit {
  word: string;
  weight: number; // 1=약, 2=중, 3=강(위기)
  axis: "A" | "B"; // A=부정 정서 강도, B=이탈 의사 구체성
}

// 축 A — 부정 정서 강도
const NEGATIVE_AFFECT: Array<[string, number]> = [
  ["짜증", 1], ["속상", 1], ["서운", 1], ["답답", 1], ["우울", 2], ["외롭", 2],
  ["불안", 2], ["두렵", 2], ["무섭", 2], ["힘들", 2], ["지치", 2], ["버겁", 2],
  ["괴롭", 3], ["비참", 3], ["절망", 3], ["고통", 3], ["견딜 수 없", 3], ["무너", 3],
  ["죽고 싶", 3], ["사라지고 싶", 3], ["없어지고 싶", 3],
];

// 축 B — 학업 이탈 의사 구체성 (드롭아웃 조기경보)
const DROPOUT_INTENT: Array<[string, number]> = [
  ["의미 없", 1], ["귀찮", 1], ["가기 싫", 1], ["흥미 없", 1],
  ["학교 싫", 2], ["다니기 싫", 2], ["그만두고 싶", 3], ["자퇴", 3],
  ["휴학", 3], ["학교 안 가", 3], ["때려치", 3], ["포기", 2],
];

export interface LexiconScore {
  axisA: number; // 0~4
  axisB: number; // 0~4
  hits: string[];
}

/** 텍스트에서 부정/위기 신호를 사전 매칭해 1차 점수 산출. */
export function scoreLexicon(text: string): LexiconScore {
  const hits: string[] = [];
  let maxA = 0;
  let maxB = 0;
  let countA = 0;

  for (const [word, weight] of NEGATIVE_AFFECT) {
    if (text.includes(word)) {
      hits.push(word);
      maxA = Math.max(maxA, weight);
      countA += 1;
    }
  }
  for (const [word, weight] of DROPOUT_INTENT) {
    if (text.includes(word)) {
      hits.push(word);
      maxB = Math.max(maxB, weight);
    }
  }

  // 강도(maxA) + 누적 밀도(countA)로 축A를 0~4로 확장 — "부정어가 얼마나 많은가" 척도 반영
  const axisA = Math.min(4, maxA + (countA >= 3 ? 1 : 0));
  const axisB = Math.min(4, maxB);
  return { axisA, axisB, hits };
}
