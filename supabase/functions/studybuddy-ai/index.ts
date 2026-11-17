import { GoogleGenAI } from "npm:@google/genai@1.30.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are StudyBuddy AI, a friendly academic study assistant for college students.
You help ONLY with academics: explaining concepts, study plans, exam preparation, practice questions, note-taking, and study techniques.
If the user asks about anything unrelated to studying or academics, politely redirect them back to their studies.
Explain concepts in simple English with clear examples suitable for college students.
Keep answers focused, structured, and encouraging.`;

const MODEL = "gemini-2.5-flash";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, temperature } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "bad_request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "no_api_key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const temp = Math.min(Math.max(Number(temperature) || 0.7, 0.1), 1);

    const res = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: temp,
      },
    });

    const text = res.text ?? "";

    if (!text) {
      return new Response(
        JSON.stringify({ error: "server_error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    let code = "network_error";
    let status = 500;
    if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
      code = "rate_limited";
      status = 429;
    } else if (msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("api key")) {
      code = "invalid_key";
      status = 401;
    } else if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      code = "model_unavailable";
      status = 502;
    } else if (msg.includes("5") === false && msg) {
      code = "server_error";
      status = 502;
    }
    return new Response(
      JSON.stringify({ error: code }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
