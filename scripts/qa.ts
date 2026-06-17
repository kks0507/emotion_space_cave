// QA Phase 1 — 순수 로직(사전·루브릭·매칭방향) + 실제 LLM 분류 검증.
// DB 불필요. 실행: npx tsx scripts/qa.ts
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// .env 수동 로드 (tsx는 자동 로드 안 함)
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

import { scoreLexicon } from "../lib/lexicon/negativity";
import { evaluateRubric, targetEmotionsFor } from "../lib/pipeline/rubric";
import { analyzeEmotion } from "../lib/pipeline/analyze";
import { getAudience } from "../lib/audience";
import type { EmotionAnalysis } from "../lib/types";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${detail}`);
  }
}

function synth(p: Partial<EmotionAnalysis>): EmotionAnalysis {
  return {
    emotions: ["무감정"],
    styles: [],
    negativeIntensity: 0,
    dropoutIntent: 0,
    intent: "일상",
    lexiconHits: [],
    rationale: "",
    ...p,
  };
}

console.log("\n=== [1] 사전(부정어/위기어) 점수 ===");
{
  const s0 = scoreLexicon("오늘 급식 맛있었고 친구랑 놀았다");
  check("일상 글 → 축A 0", s0.axisA === 0, `(got ${s0.axisA})`);

  const s1 = scoreLexicon("요즘 너무 우울하고 외롭고 불안해");
  check("부정어 다수 → 축A ≥3", s1.axisA >= 3, `(got ${s1.axisA}, hits=${s1.hits})`);

  const s2 = scoreLexicon("학교 그만두고 싶다 자퇴할까");
  check("자퇴 언급 → 축B = 3", s2.axisB === 3, `(got ${s2.axisB})`);

  const s3 = scoreLexicon("죽고 싶을 만큼 괴롭다");
  check("위기어 → 축A = 3", s3.axisA >= 3, `(got ${s3.axisA})`);
}

console.log("\n=== [2] 루브릭 레벨/티어/플래그 (D14) ===");
{
  const r0 = evaluateRubric(synth({}));
  check("부정 0 → L0, tier1, flag none", r0.level === 0 && r0.tier === 1 && r0.adminFlag === "none");

  const r2 = evaluateRubric(synth({ negativeIntensity: 2 }));
  check("부정 2 → L2, tier2, watch, 위기안내 X", r2.level === 2 && r2.tier === 2 && r2.adminFlag === "watch" && !r2.showCrisisNotice);

  const r3 = evaluateRubric(synth({ negativeIntensity: 3 }));
  check("부정 3 → L3, careMode, 위기안내 O, candidate", r3.level === 3 && r3.careMode && r3.showCrisisNotice && r3.adminFlag === "candidate");

  const r4 = evaluateRubric(synth({ dropoutIntent: 4 }));
  check("이탈의사 4 → L4, alert (max축 반영)", r4.level === 4 && r4.adminFlag === "alert");

  const rMax = evaluateRubric(synth({ negativeIntensity: 1, dropoutIntent: 3 }));
  check("max(1,3)=L3 (둘 중 높은 축)", rMax.level === 3);
}

console.log("\n=== [3] 매칭 방향 (D13 C) ===");
{
  check("기쁜소식 → 축하", evaluateRubric(synth({ intent: "기쁜소식", emotions: ["기쁨"] })).direction === "축하");
  check("자랑 → 들어주기", evaluateRubric(synth({ intent: "자랑", emotions: ["기쁨"] })).direction === "들어주기");
  check("털어놓기(경미) → 공감", evaluateRubric(synth({ intent: "털어놓기", negativeIntensity: 2, emotions: ["슬픔"] })).direction === "공감");
  check("위기(L4)면 의도 무관 → 전환(안전)", evaluateRubric(synth({ intent: "털어놓기", negativeIntensity: 4, emotions: ["슬픔"] })).direction === "전환");

  // target emotions
  const aSad = synth({ emotions: ["슬픔", "상처"], negativeIntensity: 2, intent: "털어놓기" });
  const dirSad = evaluateRubric(aSad).direction;
  check("공감 → 같은 결(슬픔/상처) 후보", targetEmotionsFor(dirSad, aSad).includes("슬픔"));

  const aJoy = synth({ emotions: ["기쁨"], intent: "기쁜소식" });
  check("축하 → 기쁨 후보", targetEmotionsFor("축하", aJoy).includes("기쁨"));

  const aCrisis = synth({ emotions: ["슬픔"], negativeIntensity: 4, intent: "털어놓기" });
  check("위기 전환 → 기쁨 계열(슬픈 문장 회피)", !targetEmotionsFor("전환", aCrisis).includes("슬픔"));
}

console.log("\n=== [4] audience 분기 ===");
{
  const child = getAudience("child");
  const adult = getAudience("adult");
  check("child/adult 프로필 분리", child.key === "child" && adult.key === "adult");
  check("위기 안내 L4 노출(둘 다)", !!child.crisisNotice(4) && !!adult.crisisNotice(4));
  check("위기 안내 L1 미노출", child.crisisNotice(1) === null && adult.crisisNotice(1) === null);
  check("초등 안내=1388, 대학 안내=109/정신건강", child.crisisNotice(4)!.includes("1388") && adult.crisisNotice(4)!.includes("109"));
}

async function main() {
console.log("\n=== [5] 실제 LLM 감정분석 (Haiku) ===");
{
  const cases: Array<{ text: string; age: number; expect: string }> = [
    { text: "오늘 시험 100점 맞았어! 너무 신나!", age: 11, expect: "기쁨/낮은 부정도" },
    { text: "요즘 학교 가기 싫고 다 의미 없어. 그냥 자퇴하고 싶다.", age: 21, expect: "높은 이탈의사" },
    { text: "친구가 내 그림 칭찬해줬어. 자랑하고 싶어서.", age: 10, expect: "자랑/긍정" },
    { text: "별일 없었어. 그냥 평범한 하루.", age: 22, expect: "일상/무감정" },
  ];
  for (const c of cases) {
    const a = await analyzeEmotion({ name: "QA", age: c.age, text: c.text });
    const r = evaluateRubric(a);
    console.log(
      `  • "${c.text.slice(0, 24)}…"\n     → emo=${a.emotions.join(",")} negA=${a.negativeIntensity} dropB=${a.dropoutIntent} intent=${a.intent} | L${r.level} dir=${r.direction} flag=${r.adminFlag}\n     기대: ${c.expect}`
    );
  }
  // 위기 케이스 안전성 핵심 검증
  const crisis = await analyzeEmotion({ name: "QA", age: 21, text: "다 그만두고 싶어. 학교도 인생도 의미 없어. 사라지고 싶다." });
  const cr = evaluateRubric(crisis);
  check("명백한 위기 글 → L≥3 (안전 게이트 작동)", cr.level >= 3, `(got L${cr.level})`);
  check("위기 글 → 전환 방향(슬픈 문장 회피)", cr.direction === "전환");
}

console.log(`\n=== 결과: ${pass} 통과 / ${fail} 실패 ===`);
process.exit(fail > 0 ? 1 : 0);
}

main();
