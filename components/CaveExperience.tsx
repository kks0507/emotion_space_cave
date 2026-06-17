"use client";

import { useState, type CSSProperties } from "react";

// 클라이언트로 넘기는 직렬화 가능한 audience 뷰 (함수 제외)
export interface AudienceView {
  key: "child" | "adult";
  label: string;
  tagline: string;
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
  theme: { bg: string; cardBg: string; accent: string; text: string; font: string };
}

interface CardData {
  phrase: string;
  source: { title: string | null; author: string | null; genre: string | null };
  letter: string;
  heading: string;
}

// 공유 경험 — 입력 → 카드+편지. 톤/테마/카피는 audience로만 분기.
export default function CaveExperience({ audience }: { audience: AudienceView }) {
  const { copy, theme, key } = audience;
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [crisis, setCrisis] = useState<string | null>(null);

  const cssVars = {
    "--bg": theme.bg,
    "--card": theme.cardBg,
    "--accent": theme.accent,
    "--ink": theme.text,
    "--font": theme.font,
  } as CSSProperties;

  async function submit() {
    if (!text.trim()) {
      setError("마음을 한 줄이라도 적어주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    setCard(null);
    setCrisis(null);
    try {
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age: Number(age) || 0, text, audience: key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
      } else {
        setCard(data.card);
        setCrisis(data.crisisNotice ?? null);
      }
    } catch {
      setError("연결이 불안정해요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCard(null);
    setCrisis(null);
    setText("");
  }

  return (
    <main className="cave" style={cssVars} data-audience={key}>
      <div className="cave-inner">
        <header className="cave-head">
          <h1>{copy.enterTitle}</h1>
          <p>{card ? "" : copy.enterSubtitle}</p>
        </header>

        {!card && (
          <section className="cave-form">
            <div className="row">
              <input
                aria-label="이름"
                placeholder={copy.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                aria-label="나이"
                placeholder={copy.agePlaceholder}
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
            <textarea
              aria-label="마음"
              placeholder={copy.textPlaceholder}
              value={text}
              rows={6}
              onChange={(e) => setText(e.target.value)}
            />
            {error && <p className="err">{error}</p>}
            <button onClick={submit} disabled={loading}>
              {loading ? copy.loadingLabel : copy.submitLabel}
            </button>
          </section>
        )}

        {card && (
          <section className="cave-result">
            <article className="card">
              <p className="phrase">“{card.phrase}”</p>
              {(card.source.title || card.source.author) && (
                <p className="source">
                  — {card.source.title}
                  {card.source.author ? ` · ${card.source.author}` : ""}
                </p>
              )}
            </article>
            <div className="letter">
              <span className="letter-heading">{card.heading}</span>
              <p>{card.letter}</p>
            </div>
            {crisis && <div className="crisis">{crisis}</div>}
            <button className="ghost" onClick={reset}>
              {copy.againLabel}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
