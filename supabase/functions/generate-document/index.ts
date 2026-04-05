import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sanitizeSection = (text: string): string => {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/\r/g, "")
    .replace(/`+/g, "")
    .replace(/[№#*]+/g, "")
    .replace(/^\s*[-–—•]+\s*/gm, "")
    .replace(/^\s*\d+[.)]\s*/gm, "")
    .replace(/-{3,}/g, "")
    .replace(/_{3,}/g, "")
    .replace(/={3,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const SYSTEM_PROMPT = `You are an expert in writing scientific and engineering projects for students.
Your task is to generate a full document text based on user answers and evaluation criteria.

Rules:
1. Use the template structure but fill it with real content based on user answers.
2. If the user gave a brief answer, expand it into a full section with details, examples and justifications.
3. If the user gave a detailed answer, keep the essence but improve wording and structure.
4. Consider evaluation criteria when writing to ensure all criteria are covered.
5. Write ONLY in English. All output must be in English regardless of input language.
6. The text should be professional but understandable.
7. Each section should be substantive (at least 2-3 paragraphs).
8. Return the result as JSON with keys for each section.

CRITICAL FORMATTING RULES:
- Use plain text only. No markdown, no headings, no bullets, no numbered lists.
- Do NOT use symbols like: # * --- ___ === № or any decorative characters.
- Do NOT use bullet points (-, •, –, —) or numbered lists (1. 2. 3.).
- Write in flowing paragraphs with clear sentence structure.
- Separate ideas with new paragraphs, not with special characters.

RESEARCH AND DATA REQUIREMENTS:
- In the "existing_solutions" section, find and describe real-world analogues and competing solutions with specific names, organizations, and URLs where possible.
- In the "theory" section, reference real scientific principles, formulas, and studies relevant to the topic.
- In the "results" section, suggest specific metrics, data tables (described in text form), and types of charts/graphs that would best visualize the results (e.g. "A bar chart comparing efficiency before and after optimization would show...").
- In the "methodology" section, describe what types of infographics, flowcharts, or diagrams would help illustrate the experimental process.
- Throughout the document, suggest where charts, graphs, tables, or infographics would strengthen the presentation, describing what they should contain.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notebook, diaryEntries, criteriaText, teamInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent = `
Team/Project Information:
- Name: ${teamInfo?.name || 'Not specified'}
- Season: ${teamInfo?.season || '2024-2025'}
- Region: ${teamInfo?.region || 'Not specified'}

User answers by section:

INNOVATION PROJECT:
- Problem: ${notebook?.innovation?.problem || 'Not filled'}
- Research: ${notebook?.innovation?.research || 'Not filled'}
- Solution: ${notebook?.innovation?.solution || 'Not filled'}
- Next steps: ${notebook?.innovation?.nextStep || 'Not filled'}

ROBOT DESIGN:
- Iterations: ${notebook?.robot?.iterations || 'Not filled'}
- Main problem: ${notebook?.robot?.mainProblem || 'Not filled'}
- How solved: ${notebook?.robot?.howSolved || 'Not filled'}
- What would do differently: ${notebook?.robot?.whatDifferent || 'Not filled'}

CORE VALUES:
- Discovery: ${notebook?.coreValues?.discovery || 'Not filled'}
- Innovation: ${notebook?.coreValues?.innovation || 'Not filled'}
- Impact: ${notebook?.coreValues?.impact || 'Not filled'}
- Inclusion: ${notebook?.coreValues?.inclusion || 'Not filled'}
- Teamwork: ${notebook?.coreValues?.teamwork || 'Not filled'}
- Fun: ${notebook?.coreValues?.fun || 'Not filled'}

RESEARCH:
- Data: ${notebook?.research?.data || 'Not filled'}
- Graphs: ${notebook?.research?.graphs || 'Not filled'}
- Relevance: ${notebook?.research?.relevance || 'Not filled'}

DIARY ENTRIES (${diaryEntries?.length || 0} entries):
${(diaryEntries || []).slice(0, 10).map((e: any) => `${e.date}: ${e.q1} | ${e.q2 || ''} | ${e.q3 || ''}`).join('\n')}

${criteriaText ? `EVALUATION CRITERIA:\n${criteriaText}` : ''}

Based on these answers, generate a full document following the template structure. Include suggestions for charts, graphs, and infographics where appropriate. Write in plain flowing paragraphs without any special symbols or formatting characters.`;

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
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_document",
              description: "Generate a structured document with sections in plain text without any markdown or special symbols",
              parameters: {
                type: "object",
                properties: {
                  title_page: { type: "string", description: "Title page text in plain paragraphs" },
                  annotation: { type: "string", description: "Annotation in plain paragraphs" },
                  introduction: { type: "string", description: "Introduction in plain paragraphs" },
                  goals: { type: "string", description: "Goals, tasks and hypothesis in plain paragraphs" },
                  existing_solutions: { type: "string", description: "Review of existing solutions with real examples and references" },
                  theory: { type: "string", description: "Theoretical background with scientific principles" },
                  construction: { type: "string", description: "Construction description in plain paragraphs" },
                  methodology: { type: "string", description: "Experiment methodology with suggested diagrams/infographics" },
                  results: { type: "string", description: "Test results with suggested charts and data visualizations" },
                  error_analysis: { type: "string", description: "Error analysis in plain paragraphs" },
                  evaluation: { type: "string", description: "Evaluation in plain paragraphs" },
                  pros_cons: { type: "string", description: "Advantages and disadvantages in plain paragraphs" },
                  conclusion: { type: "string", description: "Conclusion in plain paragraphs" },
                  bibliography: { type: "string", description: "Bibliography as plain text references" },
                },
                required: ["annotation", "introduction", "goals", "construction", "conclusion"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_document" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    let sections: Record<string, string> = {};
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const raw = JSON.parse(toolCall.function.arguments);
        for (const [key, value] of Object.entries(raw)) {
          sections[key] = sanitizeSection(value as string);
        }
      } catch {
        sections = { error: "Failed to parse AI response" };
      }
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const raw = JSON.parse(jsonMatch[0]);
          for (const [key, value] of Object.entries(raw)) {
            sections[key] = sanitizeSection(value as string);
          }
        }
      } catch {
        sections = { raw: sanitizeSection(content) };
      }
    }

    return new Response(JSON.stringify({ sections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
