// 실제 앱 화면 캡처 — QA/QC 보고서용. 서버가 떠 있어야 함(localhost:3000).
// 실행: npx tsx scripts/capture.ts
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "docs", "qa", "shots");
mkdirSync(OUT, { recursive: true });
const BASE = process.env.QA_BASE ?? "http://localhost:3000";

async function fillAndCapture(
  page: import("playwright").Page,
  opts: { path: string; name: string; age: string; text: string; file: string }
) {
  await page.goto(`${BASE}${opts.path}`, { waitUntil: "networkidle" });
  await page.getByLabel("이름").fill(opts.name);
  await page.getByLabel("나이").fill(opts.age);
  await page.getByLabel("마음").fill(opts.text);
  await page.locator(".cave button").first().click();
  // LLM 응답 대기 — 카드 문구가 뜰 때까지
  await page.locator(".card .phrase").waitFor({ timeout: 60000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, opts.file), fullPage: true });
  console.log(`  📸 ${opts.file}`);
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 460, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // 1. 랜딩
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "01-landing.png"), fullPage: true });
  console.log("  📸 01-landing.png");

  // 2. 초등 입력 화면
  await page.goto(`${BASE}/child`, { waitUntil: "networkidle" });
  await page.getByLabel("이름").fill("지민");
  await page.getByLabel("나이").fill("10");
  await page.getByLabel("마음").fill("오늘 받아쓰기 다 틀려서 친구들이 놀렸어. 너무 창피하고 속상해.");
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, "02-child-input.png"), fullPage: true });
  console.log("  📸 02-child-input.png");

  // 3. 초등 결과(속상 → 공감)
  await fillAndCapture(page, {
    path: "/child", name: "지민", age: "10",
    text: "오늘 받아쓰기 다 틀려서 친구들이 놀렸어. 너무 창피하고 속상해.",
    file: "03-child-comfort.png",
  });

  // 4. 초등 결과(자랑 → 들어주기)
  await fillAndCapture(page, {
    path: "/child", name: "하준", age: "11",
    text: "나 오늘 수영 처음으로 25미터 완주했어! 진짜 뿌듯해!",
    file: "04-child-brag.png",
  });

  // 5. 대학 결과(위기 → 전환 + 위기안내)
  await fillAndCapture(page, {
    path: "/adult", name: "서연", age: "22",
    text: "요즘 학교 가는 게 너무 버겁다. 다 그만두고 싶고 의미가 없어. 사라지고 싶다.",
    file: "05-adult-crisis.png",
  });

  // 6. 대학 결과(자랑 → 들어주기)
  await fillAndCapture(page, {
    path: "/adult", name: "민호", age: "24",
    text: "교수님이 내 논문 아이디어 좋다고 하셨어. 오랜만에 좀 자랑하고 싶다.",
    file: "06-adult-brag.png",
  });

  await browser.close();
  console.log("완료 →", OUT);
}

main();
