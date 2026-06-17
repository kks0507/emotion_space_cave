import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { getAudience } from "@/lib/audience";
import type { UserInput } from "@/lib/types";

export const runtime = "nodejs";

// POST /api/respond — 두 서비스(초등/대학) 공통 진입점.
// body: { name, age, text, audience: "child" | "adult" }
export async function POST(req: NextRequest) {
  let body: Partial<UserInput> & { audience?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const name = (body.name ?? "").toString().trim();
  const age = Number(body.age);
  const text = (body.text ?? "").toString().trim();
  const audienceKey = body.audience ?? "adult";

  if (!text) {
    return NextResponse.json({ error: "마음을 한 줄이라도 적어주세요." }, { status: 400 });
  }
  if (!Number.isFinite(age) || age <= 0 || age > 120) {
    return NextResponse.json({ error: "나이를 확인해주세요." }, { status: 400 });
  }

  const audience = getAudience(audienceKey);

  try {
    const result = await runPipeline({ name: name || "익명", age, text }, audience);

    // 사용자에게 내려보낼 안전 안내(레벨별). 관리자 플래그/분석점수는 내부 보관용이라 노출 최소화.
    const crisisNotice = audience.crisisNotice(result.rubric.level);

    return NextResponse.json({
      card: {
        phrase: result.output.phrase,
        source: result.output.source,
        letter: result.output.letter,
        heading: audience.copy.letterHeading,
      },
      crisisNotice,
      theme: audience.theme,
      // 디버그/운영용 메타 (UI에선 숨김 가능)
      meta: {
        level: result.rubric.level,
        direction: result.rubric.direction,
        candidateCount: result.meta.candidateCount,
        usedLLM: result.meta.usedLLM,
        usedVector: result.meta.usedVector,
      },
    });
  } catch (e) {
    console.error("[respond] pipeline error", e);
    return NextResponse.json(
      { error: "동굴이 잠시 말을 잃었어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
