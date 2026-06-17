import Anthropic from "@anthropic-ai/sdk";

// LLM 계층 — 기본 제공자 Claude. 인터페이스로 추상화해 교체 가능.
// API 키가 없으면 isLLMAvailable()=false → 호출부가 결정적 폴백으로 동작.

// 기본은 가장 저렴한 모델(Haiku 4.5). 필요 시 LLM_MODEL로 교체.
const MODEL = process.env.LLM_MODEL ?? "claude-haiku-4-5";

let _client: Anthropic | null = null;

export function isLLMAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(): Anthropic {
  if (_client) return _client;
  _client = new Anthropic(); // ANTHROPIC_API_KEY from env
  return _client;
}

/** 구조화 출력 — JSON 스키마로 강제. 2단계 감정 분석에 사용. */
export async function generateJSON<T>(args: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: args.maxTokens ?? 1024,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
    output_config: { format: { type: "json_schema", schema: args.schema } },
  });
  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "{}";
  return JSON.parse(text) as T;
}

/** 자유 텍스트 생성 — 5단계 편지 서술에 사용. */
export async function generateText(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: args.maxTokens ?? 600,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}
