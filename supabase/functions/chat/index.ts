// Edge Function «chat»: recibe la conversación del widget de la landing,
// la envía a Claude con la base de conocimiento del Grupo y devuelve la respuesta.
//
// Secretos / variables de entorno (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY  (obligatorio) clave de Claude Console.
//                      También se acepta CLAUDE_API_KEY o el nombre que fije en
//                      ANTHROPIC_KEY_SECRET_NAME.
//   CLAUDE_MODEL       (opcional) modelo a usar. Por defecto: claude-haiku-5-5.
//   ALLOWED_ORIGINS    (opcional) dominios que pueden usar el chat, separados por
//                      coma. Ej.: https://grupostf.hn,https://sasanfunes.github.io
//                      Si no se define, se permite cualquier origen.

import { SYSTEM_PROMPT } from "./knowledge.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-5-5";

// Límites para proteger su saldo de API
const MAX_MESSAGES = 16;          // turnos de historial que se envían a Claude
const MAX_CHARS_PER_MESSAGE = 1000;
const MAX_OUTPUT_TOKENS = 400;
const RATE_LIMIT = 20;            // mensajes por IP...
const RATE_WINDOW_MS = 10 * 60_000; // ...cada 10 minutos
const UPSTREAM_TIMEOUT_MS = 25_000;

type ChatMessage = { role: "user" | "assistant"; content: string };

function getApiKey(): string | undefined {
  const custom = Deno.env.get("ANTHROPIC_KEY_SECRET_NAME");
  return (custom && Deno.env.get(custom)) ||
    Deno.env.get("ANTHROPIC_API_KEY") ||
    Deno.env.get("CLAUDE_API_KEY") ||
    undefined;
}

function allowedOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const list = allowedOrigins();
  const allow = list.length === 0 ? "*" : (origin && list.includes(origin) ? origin : list[0]);
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

// Límite de uso por IP (en memoria: es aproximado, cada instancia lleva su cuenta)
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

// Limpia y valida el historial que manda el navegador
export function sanitizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const clean: ChatMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.trim().slice(0, MAX_CHARS_PER_MESSAGE);
    if (!text) continue;
    // Une mensajes seguidos del mismo rol
    const last = clean[clean.length - 1];
    if (last && last.role === role) last.content += "\n\n" + text;
    else clean.push({ role, content: text });
  }
  let trimmed = clean.slice(-MAX_MESSAGES);
  while (trimmed.length && trimmed[0].role !== "user") trimmed = trimmed.slice(1);
  if (!trimmed.length || trimmed[trimmed.length - 1].role !== "user") return null;
  return trimmed;
}

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405, origin);

  const list = allowedOrigins();
  if (list.length && (!origin || !list.includes(origin))) {
    return json({ error: "Origen no autorizado." }, 403, origin);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Falta el secreto ANTHROPIC_API_KEY (o CLAUDE_API_KEY).");
    return json({ error: "El asistente no está configurado." }, 500, origin);
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  if (rateLimited(ip)) {
    return json({ error: "Ha enviado muchos mensajes seguidos. Intente de nuevo en unos minutos." }, 429, origin);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400, origin);
  }
  const messages = sanitizeMessages((body as { messages?: unknown })?.messages);
  if (!messages) return json({ error: "Escriba una pregunta para continuar." }, 400, origin);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: Deno.env.get("CLAUDE_MODEL") || DEFAULT_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!res.ok) {
      console.error("Error de Claude API", res.status, await res.text());
      const busy = res.status === 429 || res.status === 529;
      return json(
        { error: busy ? "El asistente está ocupado. Intente de nuevo en un momento." : "No pudimos obtener una respuesta. Intente de nuevo." },
        busy ? 503 : 502,
        origin,
      );
    }

    const data = await res.json();
    const reply = (data?.content || [])
      .filter((b: { type?: string }) => b?.type === "text")
      .map((b: { text: string }) => b.text)
      .join("")
      .trim();

    return json({ reply: reply || "No tengo una respuesta para eso. Puede escribirnos por el formulario de contacto." }, 200, origin);
  } catch (err) {
    console.error("Fallo al llamar a Claude:", err);
    return json({ error: "No pudimos obtener una respuesta. Intente de nuevo." }, 504, origin);
  } finally {
    clearTimeout(timer);
  }
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function" && !Deno.env.get("CHAT_TEST")) {
  Deno.serve(handler);
}
