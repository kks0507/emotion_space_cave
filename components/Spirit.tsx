import type { FaceType, TypeStyle } from "@/lib/card/spirit";

// 감정 정령 — 귀여운 블롭 마스코트. 타입 색 + 표정으로 7종 구분.
export default function Spirit({ t, size = 200 }: { t: TypeStyle; size?: number }) {
  const { color, deep, face } = t;
  const gid = `glow-${t.emotion}`;
  return (
    <svg viewBox="0 0 200 220" width={size} height={(size * 220) / 200} aria-hidden>
      <defs>
        <radialGradient id={gid} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="55%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 인사이드 아웃식 빛나는 아우라 */}
      <ellipse cx="100" cy="104" rx="92" ry="98" fill={`url(#${gid})`} />
      {/* 그림자 */}
      <ellipse cx="100" cy="200" rx="58" ry="12" fill="rgba(0,0,0,0.10)" />
      {/* 발 */}
      <ellipse cx="74" cy="188" rx="16" ry="11" fill={deep} />
      <ellipse cx="126" cy="188" rx="16" ry="11" fill={deep} />
      {/* 몸 */}
      <path
        d="M100 24c-44 0-72 32-72 78 0 46 30 84 72 84s72-38 72-84c0-46-28-78-72-78z"
        fill={color}
        stroke={deep}
        strokeWidth="5"
      />
      {/* 배 하이라이트 */}
      <path
        d="M100 70c-30 0-48 22-48 52 0 30 20 52 48 52s48-22 48-52c0-30-18-52-48-52z"
        fill="#FFFFFF"
        opacity="0.28"
      />
      {/* 볼 */}
      <ellipse cx="62" cy="124" rx="13" ry="9" fill="#FF8FA3" opacity="0.55" />
      <ellipse cx="138" cy="124" rx="13" ry="9" fill="#FF8FA3" opacity="0.55" />
      <Face face={face} deep={deep} />
      <Accent face={face} deep={deep} />
    </svg>
  );
}

function Face({ face, deep }: { face: FaceType; deep: string }) {
  const eye = "#2B2B2B";
  switch (face) {
    case "happy":
      return (
        <g>
          <path d="M70 104c4-7 14-7 18 0" fill="none" stroke={eye} strokeWidth="6" strokeLinecap="round" />
          <path d="M112 104c4-7 14-7 18 0" fill="none" stroke={eye} strokeWidth="6" strokeLinecap="round" />
          <path d="M84 124c8 12 24 12 32 0" fill="none" stroke={eye} strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    case "teary":
      return (
        <g>
          <circle cx="78" cy="108" r="7" fill={eye} />
          <circle cx="122" cy="108" r="7" fill={eye} />
          <circle cx="80" cy="106" r="2.4" fill="#fff" />
          <circle cx="124" cy="106" r="2.4" fill="#fff" />
          <path d="M86 132c5-5 23-5 28 0" fill="none" stroke={eye} strokeWidth="5.5" strokeLinecap="round" />
        </g>
      );
    case "angry":
      return (
        <g>
          <path d="M66 96l22 8" stroke={eye} strokeWidth="6" strokeLinecap="round" />
          <path d="M134 96l-22 8" stroke={eye} strokeWidth="6" strokeLinecap="round" />
          <circle cx="80" cy="112" r="6.5" fill={eye} />
          <circle cx="120" cy="112" r="6.5" fill={eye} />
          <path d="M86 134c8-6 20-6 28 0" fill="none" stroke={eye} strokeWidth="5.5" strokeLinecap="round" />
        </g>
      );
    case "worried":
      return (
        <g>
          <ellipse cx="80" cy="110" rx="6.5" ry="7.5" fill={eye} />
          <ellipse cx="120" cy="110" rx="6.5" ry="7.5" fill={eye} />
          <circle cx="100" cy="132" r="5" fill="none" stroke={eye} strokeWidth="5" />
        </g>
      );
    case "shocked":
      return (
        <g>
          <circle cx="80" cy="108" r="9" fill="#fff" stroke={eye} strokeWidth="4" />
          <circle cx="120" cy="108" r="9" fill="#fff" stroke={eye} strokeWidth="4" />
          <circle cx="80" cy="108" r="3.5" fill={eye} />
          <circle cx="120" cy="108" r="3.5" fill={eye} />
          <ellipse cx="100" cy="134" rx="7" ry="9" fill={eye} />
        </g>
      );
    case "tender":
      return (
        <g>
          <path d="M72 110c4-5 14-5 18 0" fill="none" stroke={eye} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M110 110c4-5 14-5 18 0" fill="none" stroke={eye} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M88 130c6 6 18 6 24 0" fill="none" stroke={eye} strokeWidth="5.5" strokeLinecap="round" />
        </g>
      );
    case "sleepy":
    default:
      return (
        <g>
          <path d="M70 110h18" stroke={eye} strokeWidth="6" strokeLinecap="round" />
          <path d="M112 110h18" stroke={eye} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="100" cy="130" rx="6" ry="7" fill="none" stroke={eye} strokeWidth="4.5" />
        </g>
      );
  }
}

function Accent({ face, deep }: { face: FaceType; deep: string }) {
  switch (face) {
    case "teary":
      return <path d="M126 116c0 8-6 12-6 18 0 4 12 4 12 0 0-6-6-10-6-18z" fill="#7FB3FF" />;
    case "worried":
      return <path d="M138 96c0 7-5 10-5 15 0 3 10 3 10 0 0-5-5-8-5-15z" fill="#BFE0FF" opacity="0.9" />;
    case "shocked":
      return <path d="M150 70l-12 18h9l-8 16 22-24h-10l8-10z" fill="#FFD84D" stroke={deep} strokeWidth="2" />;
    case "sleepy":
      return (
        <g fill={deep} fontFamily="sans-serif" fontWeight="700">
          <text x="148" y="78" fontSize="16">z</text>
          <text x="160" y="64" fontSize="22">Z</text>
        </g>
      );
    default:
      return null;
  }
}
