"use client";

import MaeumCard from "@/components/MaeumCard";
import { GALLERY } from "@/lib/card/samples";

// 카드 큐레이션 — "갖고 싶은 카드들의 피드"(인스타 explore 심리).
export default function CardGallery() {
  return (
    <div className="gallery-rail">
      {GALLERY.map((c, i) => (
        <div className="gallery-item" key={i} style={{ ["--i" as string]: i }}>
          <MaeumCard {...c} showDownload={false} />
        </div>
      ))}
    </div>
  );
}
