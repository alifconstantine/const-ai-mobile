import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, baseUrl, apiKey, apiFormat = "openai_completions", model = "Const" } = body;

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: "Base URL is required to test endpoint." },
        { status: 400 }
      );
    }

    const trimmed = baseUrl.trim().replace(/\/+$/, "");

    // ==========================================
    // 1. ACTION: FETCH / DISCOVER MODELS
    // ==========================================
    if (action === "fetch_models") {
      let endpoint = trimmed;
      if (trimmed.endsWith("/v1")) {
        endpoint = `${trimmed}/models`;
      } else if (trimmed.endsWith("/chat/completions")) {
        endpoint = trimmed.replace(/\/chat\/completions$/, "/models");
      } else if (trimmed.endsWith("/models")) {
        endpoint = trimmed;
      } else {
        endpoint = `${trimmed}/v1/models`;
      }

      const headers: Record<string, string> = {
        "Accept": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        let res = await fetch(endpoint, {
          headers,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (!res.ok && endpoint.endsWith("/v1/models")) {
          // Retry direct /models fallback
          const fallbackEndpoint = `${trimmed}/models`;
          const ctrl2 = new AbortController();
          const t2 = setTimeout(() => ctrl2.abort(), 4000);
          try {
            res = await fetch(fallbackEndpoint, {
              headers,
              signal: ctrl2.signal,
            }).finally(() => clearTimeout(t2));
            if (res.ok) {
              endpoint = fallbackEndpoint;
            }
          } catch {
            // keep original response
          }
        }

        if (!res.ok) {
          return NextResponse.json({
            success: false,
            error: `Endpoint returned HTTP ${res.status} (${res.statusText}) at ${endpoint}. This server might not expose a /models listing; you can add model tags manually.`,
            status: res.status,
          });
        }

        const data = await res.json();
        const rawList = data.data || data.models || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          const models = rawList.map((m: any) => ({
            id: String(m.id || m.name || ""),
            name: String(m.name || m.id || ""),
            contextLength: Number(m.context_length || 200000),
            supportsTools: true,
          }));
          return NextResponse.json({ success: true, models, endpoint });
        }

        return NextResponse.json({
          success: false,
          error: "Endpoint responded with 200 OK, but returned an empty model list.",
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error:
            err.name === "AbortError"
              ? `Timeout: Server at ${endpoint} did not answer within 6 seconds. Please check if your local server is running.`
              : `Connection error reaching ${endpoint}: ${err.message || String(err)}`,
        });
      }
    }

    // ==========================================
    // 2. ACTION: TEST SPECIFIC MODEL (PING TEST)
    // ==========================================
    if (action === "test_model") {
      let endpoint = trimmed;
      if (apiFormat === "responses" || trimmed.endsWith("/responses") || trimmed.endsWith("/response")) {
        endpoint = trimmed.endsWith("/responses") ? trimmed : `${trimmed}/responses`;
      } else if (apiFormat === "anthropic_messages" || trimmed.endsWith("/v1/messages")) {
        endpoint = trimmed.endsWith("/v1/messages") ? trimmed : `${trimmed}/v1/messages`;
      } else if (apiFormat === "ollama" || trimmed.endsWith("/api/chat")) {
        endpoint = trimmed.endsWith("/api/chat") ? trimmed : `${trimmed}/api/chat`;
      } else {
        if (trimmed.endsWith("/chat/completions")) {
          endpoint = trimmed;
        } else if (trimmed.endsWith("/v1")) {
          endpoint = `${trimmed}/chat/completions`;
        } else {
          endpoint = `${trimmed}/v1/chat/completions`;
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const bodyPayload = {
        model,
        messages: [{ role: "user", content: "Ping! Respond with 'pong' if you receive this." }],
        max_tokens: 30,
        temperature: 0.1,
        stream: false,
      };

      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        const latencyMs = Date.now() - startTime;
        const text = await res.text();

        if (!res.ok) {
          let errDetail = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errJson = JSON.parse(text);
            errDetail = errJson.error?.message || errJson.message || errDetail;
          } catch {
            if (text) errDetail += ` - ${text.slice(0, 150)}`;
          }
          return NextResponse.json({
            success: false,
            latencyMs,
            error: errDetail,
            endpoint,
          });
        }

        let reply = "pong";
        try {
          const json = JSON.parse(text);
          reply = json.choices?.[0]?.message?.content || json.response || json.reply || text.slice(0, 80);
        } catch {
          reply = text.slice(0, 80);
        }

        return NextResponse.json({
          success: true,
          latencyMs,
          reply: reply.trim() || "OK",
          modelUsed: model,
          endpoint,
        });
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        return NextResponse.json({
          success: false,
          latencyMs,
          error:
            err.name === "AbortError"
              ? `Timeout after 8s. Server at ${endpoint} did not respond.`
              : `Connection error to ${endpoint}: ${err.message || String(err)}`,
          endpoint,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: `Invalid action "${action}". Expected "fetch_models" or "test_model".` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
