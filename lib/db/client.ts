import { createClient, type Client } from "@libsql/client";

// Turso(libSQL) 단일 클라이언트. 서버(Node 런타임)에서만 사용.
let _client: Client | null = null;

export function db(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  _client = createClient({ url, authToken });
  return _client;
}
