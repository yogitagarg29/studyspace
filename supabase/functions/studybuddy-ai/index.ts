const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are StudyBuddy AI, a friendly academic study assistant for college students.
You help ONLY with academics: explaining concepts, study plans, exam preparation, practice questions, note-taking, and study techniques.
If the user asks about anything unrelated to studying or academics, politely redirect them back to their studies.
Explain concepts in simple English with clear examples suitable for college students.
Keep answers focused, structured, and encouraging.`;

const PRIMARY_MODEL = "gemini-2.0-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";

interface MessageItem {
  role: "user" | "assistant" | "model";
  content: string;
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      reason?: string;
      message?: string;
      domain?: string;
    }>;
  };
}

async function callGemini(model: string, apiKey: string, contents: unknown[], temp: number): Promise<{ ok: boolean; status: number; text?: string; errorObj?: GeminiResponse["error"] }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: temp,
      },
    }),
  });

  const data = (await res.json().catch(() => null)) as GeminiResponse | null;

  if (res.ok && data?.candidates?.[0]?.content?.parts) {
    const text = data.candidates[0].content.parts.map((p) => p.text ?? "").join("").trim();
    if (text) {
      return { ok: true, status: 200, text };
    }
  }

  return { ok: false, status: res.status, errorObj: data?.error };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, temperature } = (await req.json().catch(() => ({}))) as {
      messages?: MessageItem[];
      temperature?: number;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Please provide a valid conversation history." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "no_api_key",
          message: "StudyBuddy AI is not connected yet — GEMINI_API_KEY secret is missing from environment variables.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Temperature slider support strictly between 0.1 and 1.0
    const temp = Math.min(Math.max(Number(temperature) || 0.7, 0.1), 1.0);

    // Attempt primary model (gemini-2.0-flash)
    let call = await callGemini(PRIMARY_MODEL, apiKey, contents, temp);

    // Fallback to gemini-1.5-flash if model not found or unavailable
    if (!call.ok && (call.status === 404 || call.status === 503)) {
      console.warn(`[StudyBuddy] ${PRIMARY_MODEL} returned ${call.status}, falling back to ${FALLBACK_MODEL}`);
      call = await callGemini(FALLBACK_MODEL, apiKey, contents, temp);
    }

    if (call.ok && call.text) {
      return new Response(JSON.stringify({ reply: call.text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Diagnose exact Google API error
    const err = call.errorObj;
    const msg = (err?.message || "").toLowerCase();
    const reason = (err?.details?.[0]?.reason || "").toUpperCase();
    const statusStr = (err?.status || "").toUpperCase();

    let code = "server_error";
    let friendly = "The AI service encountered an error. Please try again in a little while.";
    let httpStatus = call.status || 500;

    if (call.status === 429 || statusStr === "RESOURCE_EXHAUSTED" || msg.includes("quota") || msg.includes("rate")) {
      code = "rate_limited";
      friendly = "StudyBuddy AI rate limit reached. Please wait a minute and try again.";
      httpStatus = 429;
    } else if (call.status === 401 || reason === "API_KEY_INVALID" || msg.includes("api key not valid")) {
      code = "invalid_key";
      friendly = "The provided GEMINI_API_KEY is invalid. Please generate a fresh key from Google AI Studio.";
      httpStatus = 401;
    } else if (call.status === 403 || statusStr === "PERMISSION_DENIED" || msg.includes("permission")) {
      if (reason === "SERVICE_DISABLED" || msg.includes("has not been used in project") || msg.includes("disabled")) {
        code = "api_disabled";
        friendly = "The Generative Language API is disabled in your Google Cloud project. Enable it in Google Cloud Console or create an API key in Google AI Studio.";
        httpStatus = 403;
      } else if (reason === "API_KEY_SERVICE_BLOCKED" || msg.includes("blocked by api key restrictions") || msg.includes("restrictions")) {
        code = "key_restrictions";
        friendly = "GEMINI_API_KEY has application restrictions (e.g. HTTP referrers or IP filters) blocking backend calls. In Google Cloud Console -> Credentials, set Application Restrictions to 'None'.";
        httpStatus = 403;
      } else {
        code = "project_restricted";
        friendly = `Google API rejected the request with PERMISSION_DENIED. Check project restrictions in Google Cloud Console or use Google AI Studio.`;
        httpStatus = 403;
      }
    } else if (call.status === 404 || statusStr === "NOT_FOUND") {
      code = "model_unavailable";
      friendly = "The Gemini model is currently not available for this project. Please check Google AI Studio access.";
      httpStatus = 502;
    }

    console.error(`[StudyBuddy] AI Error: ${code} (${httpStatus}) - ${err?.message || "unknown"}`);

    return new Response(
      JSON.stringify({ error: code, message: friendly }),
      { status: httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (caught) {
    const errorMsg = caught instanceof Error ? caught.message : String(caught);
    console.error("[StudyBuddy] Unhandled server error:", errorMsg);
    return new Response(
      JSON.stringify({ error: "server_error", message: "StudyBuddy AI server had an unexpected issue. Please retry." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
