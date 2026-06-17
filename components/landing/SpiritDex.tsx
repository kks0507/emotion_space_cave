import Spirit from "@/components/Spirit";
import { TYPE } from "@/lib/card/spirit";
import type { Emotion } from "@/lib/types";

const ORDER: Emotion[] = ["기쁨", "슬픔", "분노", "불안", "당황", "상처", "무감정"];

// 감정 정령 7종 도감 — "다 모아보세요" 수집 욕구.
export default function SpiritDex() {
  return (
    <div className="dex-grid">
      {ORDER.map((e) => {
        const t = TYPE[e];
        return (
          <div className="dex-cell" key={e} style={{ ["--c" as string]: t.color }}>
            <div className="dex-orb">
              <Spirit t={t} size={84} />
            </div>
            <span className="dex-name">{t.spirit}</span>
            <span className="dex-type">{t.icon} {t.label}</span>
          </div>
        );
      })}
    </div>
  );
}
