// Minimal Gemini proxy via Supabase Edge Functions (Deno)
// Reads GEMINI_API_KEY from Supabase secrets and calls the public REST API.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ProxyRequestBody {
  model: string;
  contents: any;
  config?: Record<string, unknown>;
}

function json(res: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(res), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      ...init?.headers,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json()) as ProxyRequestBody;
    const model = body?.model || "gemini-2.5-flash";
    const contents = body?.contents ?? "";
    const config = body?.config ?? {};

    // Build request for Generative Language API v1beta
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Normalize contents: Accept string or structured content
    const requestPayload: Record<string, unknown> = {
      contents:
        typeof contents === "string"
          ? [{ role: "user", parts: [{ text: contents }] }]
          : contents,
      // Pass-through config fields that map to REST API
      generationConfig: (config as any)?.generationConfig,
      safetySettings: (config as any)?.safetySettings,
      tools: (config as any)?.tools,
      systemInstruction: (config as any)?.systemInstruction
        ? { role: "system", parts: [{ text: (config as any).systemInstruction }] }
        : undefined,
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return json({ error: "Upstream error", status: resp.status, detail: errText }, { status: 500 });
    }

    const data = await resp.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p?.text || "")
      .join("");

    return json({ text, raw: data }, { status: 200 });
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, { status: 500 });
  }
});


