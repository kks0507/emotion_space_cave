// 공유 도메인 타입 — 파이프라인 전 단계가 공통으로 사용. (audience 분기와 무관)

/** AI Hub 7 대분류 감정 */
export type Emotion =
  | "기쁨" | "슬픔" | "분노" | "불안" | "당황" | "상처" | "무감정";

export const ALL_EMOTIONS: Emotion[] = [
  "기쁨", "슬픔", "분노", "불안", "당황", "상처", "무감정",
];

/** 1단계 입력 */
export interface UserInput {
  name: string;
  age: number;
  text: string;
}

/** 발화 의도(축②) — 부정도 게이트 아래에서 '결'을 고른다 (D12) */
export type Intent =
  | "털어놓기"   // 속상함/힘듦을 토로
  | "자랑"       // 들어주고 맞장구
  | "기쁜소식"   // 축하
  | "격려요청"   // 응원이 필요
  | "일상";      // 특별한 정서 신호 약함

/** 2단계 감정 분석 결과 (하이브리드: 사전 + LLM) — D9 */
export interface EmotionAnalysis {
  emotions: Emotion[];          // 감지된 대분류 감정(복수 가능)
  styles: string[];             // 감지된 세부 스타일(있으면)
  negativeIntensity: number;    // 축A 부정 정서 강도 0~4
  dropoutIntent: number;        // 축B 학업 이탈 의사 구체성 0~4
  intent: Intent;               // 축② 발화 의도
  lexiconHits: string[];        // 사전에 걸린 부정/위기 단어(설명가능성)
  rationale: string;            // 판단 근거 요약
}

/** 루브릭 레벨 (D14, MTSS 차용) */
export type RubricLevel = 0 | 1 | 2 | 3 | 4;

/** 매칭 방향 (D13 C) — 레벨이 방향을 결정 */
export type MatchDirection = "공감" | "전환" | "축하" | "들어주기";

export interface RubricResult {
  level: RubricLevel;
  tier: 1 | 2 | 3;              // MTSS tier
  direction: MatchDirection;    // 어떤 결의 문장을 줄지
  careMode: boolean;            // 돌봄 모드(L3+)
  showCrisisNotice: boolean;    // 위기상담 안내 노출(L3+)
  adminFlag: "none" | "watch" | "candidate" | "alert"; // 내부 플래그(F3 대비)
}

/** 후보 문장 (3단계 추출) */
export interface CandidateSentence {
  id: string;
  text: string;          // origin_text
  ptr: string | null;
  emotions: Emotion[];
  styles: string[];
  agreeRatio: number | null;
  workTitle: string | null;
  workAuthor: string | null;
  genre: string | null;
  similarity?: number;   // 4단계 벡터 유사도(있으면)
}

/** 5단계 최종 산출 */
export interface CardLetter {
  phrase: string;        // 카드에 강조될 문구(선택된 문학 문장)
  source: {              // 출처 표기
    title: string | null;
    author: string | null;
    genre: string | null;
  };
  letter: string;        // 문구를 활용한 2문장 편지
}

/** 파이프라인 전체 결과 */
export interface PipelineResult {
  analysis: EmotionAnalysis;
  rubric: RubricResult;
  selected: CandidateSentence | null;
  output: CardLetter;
  meta: { candidateCount: number; usedVector: boolean; usedLLM: boolean };
}
