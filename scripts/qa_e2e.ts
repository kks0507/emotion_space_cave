// QA Phase 2 — 풀 파이프라인 e2e (DB 검색 + LLM 선별 + 편지).
// 적재(sentence_label) 완료 후 실행: npx tsx scripts/qa_e2e.ts
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

import { runPipeline } from "../lib/pipeline";
import { getAudience } from "../lib/audience";

const SENT_END = /[.!?…”"]\s*$|[다요죠야해]\.?$/;

const cases = [
  { aud: "child", name: "지민", age: 10, text: "오늘 받아쓰기 다 틀려서 친구들이 놀렸어. 너무 창피하고 속상해." },
  { aud: "child", name: "하준", age: 11, text: "나 오늘 수영 처음으로 25미터 완주했어! 진짜 뿌듯해!" },
  { aud: "adult", name: "서연", age: 22, text: "요즘 학교 가는 게 너무 버겁다. 다 그만두고 싶고 의미가 없어." },
  { aud: "adult", name: "민호", age: 24, text: "교수님이 내 논문 아이디어 좋다고 하셨어. 오랜만에 좀 자랑하고 싶다." },
];

let pass = 0, fail = 0;
function check(n: string, c: boolean, d = "") { c ? (pass++, console.log(`  ✅ ${n}`)) : (fail++, console.log(`  ❌ ${n} ${d}`)); }

async function main() {
  for (const c of cases) {
    const aud = getAudience(c.aud);
    console.log(`\n── [${c.aud}] ${c.name}(${c.age}): "${c.text}"`);
    const r = await runPipeline({ name: c.name, age: c.age, text: c.text }, aud);
    console.log(`   분석: emo=${r.analysis.emotions.join(",")} negA=${r.analysis.negativeIntensity} dropB=${r.analysis.dropoutIntent} intent=${r.analysis.intent}`);
    console.log(`   루브릭: L${r.rubric.level} dir=${r.rubric.direction} flag=${r.rubric.adminFlag} 후보=${r.meta.candidateCount}`);
    console.log(`   📜 문구: "${r.output.phrase}"${r.output.source.title ? ` — ${r.output.source.title}` : ""}`);
    console.log(`   ✉️  편지: ${r.output.letter}`);
    const notice = aud.crisisNotice(r.rubric.level);
    if (notice) console.log(`   ⚠️  안내: ${notice}`);

    check(`${c.name}: 후보 추출됨(검색 동작)`, r.meta.candidateCount > 0, `(0개 — 적재 미완?)`);
    check(`${c.name}: 문구 선택됨`, !!r.output.phrase);
    check(`${c.name}: 편지 생성됨`, r.output.letter.length > 5);
    const sentences = r.output.letter.split(/(?<=[.!?…])\s+/).filter((s) => s.trim());
    check(`${c.name}: 편지 ≈2문장 (got ${sentences.length})`, sentences.length >= 1 && sentences.length <= 3);
  }

  // 위기 케이스: 안내 노출 + 전환 방향 + 슬픈 문장 회피
  const aud = getAudience("adult");
  const crisis = await runPipeline({ name: "위기", age: 21, text: "다 그만두고 싶어. 사라지고 싶다. 학교도 인생도 의미 없어." }, aud);
  console.log(`\n── [위기] L${crisis.rubric.level} dir=${crisis.rubric.direction} flag=${crisis.rubric.adminFlag}`);
  console.log(`   📜 "${crisis.output.phrase}"`);
  check("위기: L≥3", crisis.rubric.level >= 3, `(L${crisis.rubric.level})`);
  check("위기: 관리자 플래그(candidate/alert)", ["candidate", "alert"].includes(crisis.rubric.adminFlag));
  check("위기: 위기안내 노출", !!aud.crisisNotice(crisis.rubric.level));

  console.log(`\n=== 결과: ${pass} 통과 / ${fail} 실패 ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
