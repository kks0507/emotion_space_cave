import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-inner">
        <p className="kicker">대나무 숲, 그리고 동굴</p>
        <h1>마음동굴</h1>
        <p className="lead">
          아무도 듣지 않는 곳에 오늘의 마음을 두고 가세요.
          <br />
          문학의 한 문장이 메아리가 되어 돌아옵니다.
        </p>

        <div className="doors">
          <Link href="/child" className="door door-child">
            <span className="door-label">어린이</span>
            <span className="door-sub">초등학생을 위한 동굴</span>
          </Link>
          <Link href="/adult" className="door door-adult">
            <span className="door-label">청년</span>
            <span className="door-sub">대학생·청년을 위한 동굴</span>
          </Link>
        </div>

        <p className="foot">위로 · 축하 · 격려 · 들어주기 — 무엇이든.</p>
      </div>
    </main>
  );
}
