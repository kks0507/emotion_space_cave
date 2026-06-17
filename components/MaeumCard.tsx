"use client";

import { useRef, useState, type CSSProperties } from "react";
import { toPng } from "html-to-image";
import Spirit from "./Spirit";
import { TYPE, type CardMeta } from "@/lib/card/spirit";

export interface CardProps {
  phrase: string;
  source: { title: string | null; author: string | null; genre: string | null };
  meta: CardMeta;
  ownerName?: string;
  userText?: string; // 아이가 쓴 원문
  showDownload?: boolean; // 갤러리 전시용은 false
}

// 마음 카드 — 포켓몬 카드형 수집 카드. 다운로드(이미지) 지원.
export default function MaeumCard({ phrase, source, meta, ownerName, userText, showDownload = true }: CardProps) {
  const t = TYPE[meta.emotion] ?? TYPE.무감정;
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const vars = {
    "--c": t.color,
    "--deep": t.deep,
    "--soft": t.soft,
  } as CSSProperties;

  const fileName = `마음카드_${t.spirit}_No${meta.number}.png`;

  async function render(): Promise<string> {
    if ("fonts" in document) await (document as Document).fonts.ready;
    return toPng(cardRef.current!, { pixelRatio: 3, cacheBust: true, backgroundColor: "transparent" });
  }

  async function download() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const a = document.createElement("a");
      a.href = await render();
      a.download = fileName;
      a.click();
    } finally {
      setSaving(false);
    }
  }

  // 인스타 본질(예쁘게 → 자랑) — 원탭 공유. 미지원 시 다운로드로 폴백.
  async function share() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await render();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: "내 마음 카드", text: `오늘 내 마음 카드 — ${t.spirit} No.${meta.number} 자랑할래!` });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        a.click();
      }
    } catch {
      /* 사용자가 공유 취소 등 — 무시 */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mcard-wrap">
      <div
        ref={cardRef}
        className={`mcard rarity-${meta.rarity}`}
        style={vars}
        data-emotion={meta.emotion}
      >
        {/* 포일 광택 오버레이 */}
        <div className="mcard-foil" />

        {/* 상단 바 */}
        <div className="mcard-top">
          <div className="mcard-name">
            <span className="mcard-stage">기본</span>
            {t.spirit}
          </div>
          <div className="mcard-hp">
            <span>HP</span>
            {meta.hp}
            <i className="mcard-type">{t.icon}</i>
          </div>
        </div>

        {/* 아트 창 */}
        <div className="mcard-art">
          <div className="mcard-art-glow" />
          <Spirit t={t} size={210} />
          <span className="mcard-style-tag">{meta.style}</span>
        </div>

        {/* 정보 스트립 */}
        <div className="mcard-info">
          <span>{t.label} 타입 · No.{String(meta.number).padStart(3, "0")}/060</span>
          <span className={`mcard-rare rare-${meta.rarity}`}>{meta.rarityLabel}</span>
        </div>

        {/* 오늘 내 마음(원문) */}
        {userText && (
          <div className="mcard-mine">
            <div className="mcard-move-head">✏️ 오늘 내 마음</div>
            <p className="mcard-mine-text">{userText}</p>
          </div>
        )}

        {/* 한마디(문학 문구) */}
        <div className="mcard-move">
          <div className="mcard-move-head">
            <i>{t.icon}</i> 마음의 한마디
          </div>
          <p className="mcard-phrase">“{phrase}”</p>
          {(source.title || source.author) && (
            <p className="mcard-source">
              — {source.title}
              {source.author ? ` · ${source.author}` : ""}
            </p>
          )}
        </div>

        {/* 푸터 */}
        <div className="mcard-foot">
          <span>{ownerName ? `${ownerName}의 마음동굴` : "마음동굴"}</span>
          <span className="mcard-illus">illus. 마음동굴</span>
        </div>
      </div>

      {showDownload && (
        <div className="mcard-actions">
          <button className="mcard-dl primary" onClick={share} disabled={saving}>
            {saving ? "만드는 중…" : "🎁 친구에게 자랑하기"}
          </button>
          <button className="mcard-dl ghost-dl" onClick={download} disabled={saving}>
            ⬇ 저장 (배경화면)
          </button>
        </div>
      )}
    </div>
  );
}
