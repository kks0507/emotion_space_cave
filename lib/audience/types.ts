import type { MatchDirection, RubricLevel } from "../types";

// AudienceProfile = 초등생/대학생이 "반드시 갈라져야 하는" 부분만 담는 분기 단위.
// 파이프라인 로직은 이 프로필을 주입받아 동작 → 공통 로직은 100% 공유, 분기는 데이터로만.

export type AudienceKey = "child" | "adult";

export interface AudienceProfile {
  key: AudienceKey;
  label: string;            // 화면 표기명
  tagline: string;          // 한 줄 소개
  ageRange: string;         // 안내용 연령대

  /** UX 라이팅 (화면 카피) */
  copy: {
    enterTitle: string;
    enterSubtitle: string;
    namePlaceholder: string;
    agePlaceholder: string;
    textPlaceholder: string;
    submitLabel: string;
    loadingLabel: string;
    letterHeading: string;
    againLabel: string;
  };

  /** 카드 시각 테마 (CSS 변수로 주입) */
  theme: {
    bg: string;
    cardBg: string;
    accent: string;
    text: string;
    font: string;
  };

  /** LLM 페르소나 — 편지 톤·어휘를 가르는 핵심 분기 */
  persona: {
    /** 편지 작성 system 프롬프트의 청자 묘사 */
    voice: string;
    /** 연령·어휘 가이드 */
    vocab: string;
    /** 금지 사항 */
    avoid: string;
  };

  /** 위기 단계에서 노출할 안전 안내(레벨별). 로그인과 무관하게 살아있어야 함(D14). */
  crisisNotice: (level: RubricLevel) => string | null;

  /** 매칭 방향에 따른 편지 결 지시 (D13 C) */
  directionHint: (dir: MatchDirection) => string;
}
