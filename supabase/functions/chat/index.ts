import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sanitizeResponse = (content: string) => content
  .replace(/\r/g, "")
  .replace(/`+/g, "")
  .replace(/[№#*]+/g, "")
  .replace(/^\s*[-–—•]+\s*/gm, "")
  .replace(/^\s*\d+[.)]\s*/gm, "")
  .replace(/-{3,}/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

const SYSTEM_PROMPT = `You are TechMentorAI — an expert assistant specialized in helping FIRST Lego League (FLL) teams fill out their Engineering Notebook. You provide guidance on:

1. **Innovation Project**: How to define a problem, conduct research, propose solutions, and plan next steps.
2. **Robot Design**: How to document design iterations, technical challenges, solutions, and reflections.
3. **Core Values**: How to demonstrate Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun with concrete examples.
4. **Training Diary**: Best practices for documenting each training session.
5. **Research Section**: How to present data, graphs, and relevance of the problem.

Always give specific, actionable advice. Use examples when possible. Respond in the same language as the user's message. Be encouraging and supportive. When reviewing content, provide constructive feedback with specific suggestions for improvement.

Additional response rules:
- Be fast, direct, and practical.
- Use plain text only.
- Do not use markdown, headings, bullets, numbered lists, or decorative separators.
- Do not use symbols like №, #, *, ---, or bullet characters.
- Prefer short paragraphs and simple wording.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const recentMessages = Array.isArray(messages) ? messages.slice(-8) : [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "No response generated.";
    const content = sanitizeResponse(rawContent) || "No response generated.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
