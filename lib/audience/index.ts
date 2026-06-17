import type { AudienceKey, AudienceProfile } from "./types";
import { childProfile } from "./child";
import { adultProfile } from "./adult";

const REGISTRY: Record<AudienceKey, AudienceProfile> = {
  child: childProfile,
  adult: adultProfile,
};

export function getAudience(key: string): AudienceProfile {
  if (key === "child" || key === "adult") return REGISTRY[key];
  return adultProfile; // 기본값
}

// 클라이언트 컴포넌트로 넘길 직렬화 가능한 부분만 추출 (함수 제외).
export function toAudienceView(p: AudienceProfile) {
  return {
    key: p.key,
    label: p.label,
    tagline: p.tagline,
    copy: p.copy,
    theme: p.theme,
  };
}

export type { AudienceProfile, AudienceKey } from "./types";
