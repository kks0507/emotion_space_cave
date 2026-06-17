import Link from "next/link";
import CardGallery from "@/components/landing/CardGallery";
import SpiritDex from "@/components/landing/SpiritDex";

export default function Home() {
  return (
    <main className="home">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-orbs" aria-hidden>
          <span className="orb o1" />
          <span className="orb o2" />
          <span className="orb o3" />
        </div>
        <span className="hero-badge">🕳️ AI 이모션 스페이스 · 동굴</span>
        <h1>
          마음을 털어놓는 작은 동굴,
          <br />
          <span className="accent">마음동굴</span>
        </h1>
        <p className="hero-sub">
          위로도 · 축하도 · 자랑도 · 응원도. 무슨 마음이든 살짝 두고 가면,
          <br />
          문학 속 한 문장이 <b>나만의 마음 카드</b>가 되어 돌아와요.
        </p>
        <div className="hero-cta">
          <Link href="/child" className="cta primary">
            🧒 어린이 동굴 들어가기
          </Link>
          <Link href="/adult" className="cta">
            🎓 청년 동굴
          </Link>
        </div>
        <p className="hero-mini">로그인 없이 바로 · 24시간 열려 있어요</p>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="sect">
        <p className="sect-kicker">COLLECT YOUR HEART</p>
        <h2>
          모으고 싶은 <span className="accent">마음 카드</span>
        </h2>
        <p className="sect-sub">
          오늘의 마음이 한 장의 수집 카드로. 예쁘게 저장하고, 친구에게 자랑해요.
        </p>
        <CardGallery />
        <p className="rail-hint">← 옆으로 넘겨보세요 →</p>
      </section>

      {/* ===== SPIRIT DEX ===== */}
      <section className="sect tint">
        <p className="sect-kicker">EMOTION SPIRITS</p>
        <h2>감정 정령 7종, 다 모아봐!</h2>
        <p className="sect-sub">
          기쁨 반짝이부터 무감정 구름이까지. 오늘은 어떤 정령이 너를 찾아올까?
        </p>
        <SpiritDex />
      </section>

      {/* ===== STEPS ===== */}
      <section className="sect">
        <p className="sect-kicker">HOW IT WORKS</p>
        <h2>딱 세 걸음이면 끝!</h2>
        <ol className="steps">
          <li>
            <span className="step-n">1</span>
            <b>마음 털어놓기</b>
            <p>오늘 있었던 일, 지금 기분… 뭐든 적어요.</p>
          </li>
          <li>
            <span className="step-n">2</span>
            <b>AI가 마음 읽기</b>
            <p>네 마음을 가만히 살펴 꼭 맞는 문장을 찾아줘요.</p>
          </li>
          <li>
            <span className="step-n">3</span>
            <b>나만의 카드 받기</b>
            <p>정령과 문장이 담긴 카드를 저장하고 자랑해요!</p>
          </li>
        </ol>
      </section>

      {/* ===== ENTRANCES ===== */}
      <section className="sect tint">
        <p className="sect-kicker">CHOOSE YOUR CAVE</p>
        <h2>어느 동굴로 들어갈까요?</h2>
        <div className="doors home-doors">
          <Link href="/child" className="door door-child">
            <span className="door-emoji">🧒</span>
            <span className="door-label">어린이 동굴</span>
            <span className="door-sub">쉽고 다정한 말로 · 초등학생</span>
          </Link>
          <Link href="/adult" className="door door-adult">
            <span className="door-emoji">🎓</span>
            <span className="door-label">청년 동굴</span>
            <span className="door-sub">담백한 문장으로 · 대학생·청년</span>
          </Link>
        </div>
      </section>

      <footer className="home-foot">
        <b>마음동굴</b> · AI 이모션 스페이스
        <br />
        위로 · 축하 · 격려 · 들어주기 — 무슨 마음이든.
      </footer>
    </main>
  );
}
