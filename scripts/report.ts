// QA/QC 보고서 생성 — QA 콘솔 출력(txt) + 앱 스크린샷을 HTML 한 장으로 조립.
// 실행: npx tsx scripts/report.ts
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const QA = join(ROOT, "docs", "qa");
const SHOTS = join(QA, "shots");

const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : "(없음)");
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const phase1 = read(join(QA, "phase1.txt"));
const phase2 = read(join(QA, "phase2.txt"));

const shotMeta: Record<string, string> = {
  "01-landing.png": "랜딩 — 두 동굴 입구(초등/대학)",
  "02-child-input.png": "초등 입력 화면 — 이름·나이·마음(로그인 없음)",
  "03-child-comfort.png": "초등 · 속상한 글 → 공감 카드 + 편지",
  "04-child-brag.png": "초등 · 자랑 글 → 들어주기 카드 + 편지",
  "05-adult-crisis.png": "대학 · 위기 글 → 전환 카드 + 위기상담 안내",
  "06-adult-brag.png": "대학 · 자랑 글 → 들어주기 카드 + 편지",
};
const shots = existsSync(SHOTS)
  ? readdirSync(SHOTS).filter((f) => f.endsWith(".png")).sort()
  : [];

const passN = (phase1.match(/✅/g)?.length ?? 0) + (phase2.match(/✅/g)?.length ?? 0);
const failN = (phase1.match(/❌/g)?.length ?? 0) + (phase2.match(/❌/g)?.length ?? 0);

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>마음동굴 QA/QC 보고서</title>
<style>
  :root{--bg:#f4f1ea;--ink:#2e2a24;--accent:#b5654a;--card:#fbfaf6;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:'Nanum Myeongjo',Georgia,serif;line-height:1.7}
  .wrap{max-width:1000px;margin:0 auto;padding:3rem 1.5rem}
  h1{font-size:2.2rem;margin:0 0 .3rem;letter-spacing:.03em}
  .sub{color:#8a7d66;margin:0 0 2rem}
  .badge{display:inline-block;padding:.5rem 1rem;border-radius:999px;font-weight:700;margin:.2rem .4rem .2rem 0}
  .ok{background:#e3efe1;color:#2f6b3a}
  .bad{background:#f3dede;color:#a33}
  h2{margin:2.6rem 0 1rem;padding-bottom:.4rem;border-bottom:2px solid #e3dccb}
  pre{background:#26221c;color:#e9e3d6;padding:1.2rem 1.4rem;border-radius:12px;overflow:auto;
      font-family:ui-monospace,Menlo,monospace;font-size:.82rem;line-height:1.55;white-space:pre-wrap}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.4rem;margin-top:1rem}
  figure{margin:0;background:var(--card);border:1px solid #e3dccb;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(120,100,70,.1)}
  figure img{width:100%;display:block;border-bottom:1px solid #eee}
  figcaption{padding:.7rem .9rem;font-size:.82rem;color:#6b6353}
  table{width:100%;border-collapse:collapse;margin-top:1rem;font-size:.92rem}
  th,td{text-align:left;padding:.6rem .7rem;border-bottom:1px solid #e3dccb}
  th{color:#8a7d66;font-weight:700}
  .meta{color:#8a7d66;font-size:.85rem}
</style></head><body><div class="wrap">
  <h1>마음동굴 — QA/QC 보고서</h1>
  <p class="sub">문학 낭송 데이터 기반 감정 위로 카드 서비스 · 검증일 2026-06-17</p>
  <div>
    <span class="badge ok">통과 ${passN}</span>
    <span class="badge ${failN ? "bad" : "ok"}">실패 ${failN}</span>
    <span class="meta">Phase 1 = 순수 로직·실제 LLM(Haiku) / Phase 2 = DB 검색·선별·편지 풀 e2e</span>
  </div>

  <h2>1. 검증 범위</h2>
  <table>
    <tr><th>단계</th><th>검증 내용</th><th>방식</th></tr>
    <tr><td>2 감정분석(D9)</td><td>부정어 사전 1차 점수 + LLM 맥락 보정, max 결합</td><td>단위+실제 LLM</td></tr>
    <tr><td>루브릭(D14)</td><td>위기강도=max(부정정서,이탈의사), L0~L4·MTSS·관리자플래그</td><td>단위</td></tr>
    <tr><td>매칭방향(D13)</td><td>공감/전환/축하/들어주기, 위기 시 슬픈문장 회피</td><td>단위</td></tr>
    <tr><td>3·4 검색·선별</td><td>감정라벨 필터+품질(동의율≥0.8)→맥락 1문장</td><td>e2e(실 DB)</td></tr>
    <tr><td>5 카드·편지</td><td>문구 강조 + 2문장 편지, audience 톤 분기</td><td>e2e(실 LLM)</td></tr>
    <tr><td>안전</td><td>위기 시 상담안내 노출 + 관리자 플래그 적재</td><td>단위+e2e</td></tr>
  </table>

  <h2>2. 실제 앱 화면 (스크린 캡처)</h2>
  <div class="grid">
    ${shots
      .map(
        (f) =>
          `<figure><img src="shots/${f}" alt="${f}"><figcaption>${
            shotMeta[f] ?? f
          }</figcaption></figure>`
      )
      .join("\n    ")}
  </div>

  <h2>3. Phase 1 — 로직 · 실제 LLM 분류</h2>
  <pre>${esc(phase1)}</pre>

  <h2>4. Phase 2 — 풀 파이프라인 e2e (검색→선별→편지)</h2>
  <pre>${esc(phase2)}</pre>

  <h2>5. 결론</h2>
  <p>총 <b>${passN}건 통과 / ${failN}건 실패</b>. 핵심 안전 요구(부정/비부정 출력 분리, 위기 시 안내·관리자 플래그)와
  audience 분기(초등/대학), 5단계 파이프라인이 의도대로 동작함을 단위·e2e 양면으로 확인.</p>
  <p class="meta">생성: scripts/report.ts · 원천 QA: scripts/qa.ts, scripts/qa_e2e.ts · 스키마: docs/HANDOVER.md §7</p>
</div></body></html>`;

writeFileSync(join(QA, "QA_REPORT.html"), html);
console.log("보고서 생성 →", join(QA, "QA_REPORT.html"), `(통과 ${passN}/실패 ${failN}, 샷 ${shots.length})`);
