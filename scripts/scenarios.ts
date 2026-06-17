// 시연용 입력 후보 탐색 — 초등 상황 10종을 실제 파이프라인으로 돌려 결과 비교.
// 실행: npx tsx scripts/scenarios.ts
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
import { buildCardMeta, TYPE } from "../lib/card/spirit";
import type { Emotion } from "../lib/types";

const CASES: Array<{ tag: string; name: string; age: number; text: string }> = [
  { tag: "자랑(기쁨)", name: "하준", age: 11, text: "나 오늘 줄넘기 2단뛰기 처음으로 성공했어! 너무 뿌듯해!" },
  { tag: "기쁜소식(기쁨)", name: "서윤", age: 10, text: "받아쓰기 시험에서 처음으로 100점 맞았어. 엄마한테 자랑해야지!" },
  { tag: "속상/슬픔", name: "지민", age: 10, text: "제일 친한 친구가 다른 친구랑만 놀아서 너무 외롭고 슬펐어." },
  { tag: "이별(슬픔)", name: "수아", age: 11, text: "키우던 강아지가 무지개다리를 건넜어. 자꾸 눈물이 나." },
  { tag: "억울(분노)", name: "도윤", age: 9, text: "동생이 내 장난감 망가뜨렸는데 엄마가 나만 혼냈어. 너무 억울하고 화나." },
  { tag: "불안(시험)", name: "예준", age: 12, text: "내일 학교에서 발표하는데 친구들이 비웃을까봐 너무 떨리고 무서워." },
  { tag: "당황", name: "하린", age: 10, text: "수업 시간에 발표하다가 갑자기 머리가 하얘져서 아무 말도 못 했어. 너무 창피해." },
  { tag: "상처(놀림)", name: "민서", age: 11, text: "친구들이 내 그림 보고 못 그렸다고 놀렸어. 마음이 아파." },
  { tag: "전학불안", name: "지호", age: 12, text: "다음 주에 전학 가는데 새 학교에서 친구를 못 사귈까봐 걱정돼." },
  { tag: "일상/무감정", name: "유나", age: 10, text: "오늘은 특별한 일 없이 그냥 평범한 하루였어." },
];

async function main() {
  const aud = getAudience("child");
  for (const c of CASES) {
    const r = await runPipeline({ name: c.name, age: c.age, text: c.text }, aud);
    // route.ts와 동일: 정령은 아이의 감정
    const emotion: Emotion = r.analysis.emotions[0] ?? r.selected?.emotions?.[0] ?? "무감정";
    const meta = buildCardMeta({ emotion, style: r.analysis.styles?.[0] ?? r.selected?.styles?.[0] ?? null, sentenceId: r.selected?.id ?? "x" });
    const t = TYPE[emotion];
    console.log(`\n━━━ [${c.tag}] ${c.name}(${c.age}) ━━━`);
    console.log(`입력: ${c.text}`);
    console.log(`분석: emo=${r.analysis.emotions.join(",")} negA=${r.analysis.negativeIntensity} dropB=${r.analysis.dropoutIntent} intent=${r.analysis.intent} | L${r.rubric.level}/${r.rubric.direction}`);
    console.log(`카드: ${t.icon}${emotion} ${meta.spirit} · ${meta.style} · No.${meta.number} · ${meta.rarityLabel} · HP${meta.hp}`);
    console.log(`📜 문구: "${r.output.phrase}"${r.output.source.title ? ` — ${r.output.source.title}` : ""}`);
    console.log(`✉️  편지: ${r.output.letter}`);
    const notice = aud.crisisNotice(r.rubric.level);
    if (notice) console.log(`⚠️  ${notice}`);
  }
}
main();
