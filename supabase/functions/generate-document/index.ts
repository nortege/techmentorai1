import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEMPLATE_STRUCTURE = `
Структура документа (шаблон):

1. Титульная страница (название проекта, авторы, год, научный руководитель)
2. Содержание
3. Аннотация — краткое описание проекта, проблемы, решения и результатов
4. Введение — обоснование актуальности, контекст проблемы
5. Цель, задачи и гипотеза — чётко сформулированные цели и гипотеза
6. Обзор существующих решений — анализ аналогов и их недостатков
7. Теоретическое обоснование работоспособности — научные принципы
8. Конструкция — описание устройства/решения с деталями
9. Методика эксперимента и измерений — как проводились тесты
10. Результаты тестирования — данные и их анализ
11. Анализ погрешностей — оценка точности результатов
12. Оценка — общая оценка эффективности решения
13. Преимущества и недостатки — честный анализ
14. Вывод — итоги работы и перспективы
15. Библиография — источники информации
`;

const SYSTEM_PROMPT = `You are an expert in writing scientific and engineering projects for students.
Your task is to generate a full document text based on user answers and evaluation criteria.

Rules:
1. Use the template structure but fill it with real content based on user answers.
2. If the user gave a brief answer — expand it into a full section with details, examples and justifications.
3. If the user gave a detailed answer — keep the essence but improve wording and structure.
4. Consider evaluation criteria when writing — ensure all criteria are covered.
5. Write ONLY in English. All output must be in English regardless of input language.
6. The text should be professional but understandable.
7. Each section should be substantive (at least 2-3 paragraphs).
8. Return the result as JSON with keys for each section.

${TEMPLATE_STRUCTURE}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notebook, diaryEntries, criteriaText, teamInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent = `
Информация о команде/проекте:
- Название: ${teamInfo?.name || 'Не указано'}
- Сезон: ${teamInfo?.season || '2024-2025'}
- Регион: ${teamInfo?.region || 'Не указан'}

Ответы пользователя по разделам:

INNOVATION PROJECT:
- Проблема: ${notebook?.innovation?.problem || 'Не заполнено'}
- Исследование: ${notebook?.innovation?.research || 'Не заполнено'}
- Решение: ${notebook?.innovation?.solution || 'Не заполнено'}
- Следующие шаги: ${notebook?.innovation?.nextStep || 'Не заполнено'}

ROBOT DESIGN:
- Итерации: ${notebook?.robot?.iterations || 'Не заполнено'}
- Главная проблема: ${notebook?.robot?.mainProblem || 'Не заполнено'}
- Как решили: ${notebook?.robot?.howSolved || 'Не заполнено'}
- Что бы сделали иначе: ${notebook?.robot?.whatDifferent || 'Не заполнено'}

CORE VALUES:
- Discovery: ${notebook?.coreValues?.discovery || 'Не заполнено'}
- Innovation: ${notebook?.coreValues?.innovation || 'Не заполнено'}
- Impact: ${notebook?.coreValues?.impact || 'Не заполнено'}
- Inclusion: ${notebook?.coreValues?.inclusion || 'Не заполнено'}
- Teamwork: ${notebook?.coreValues?.teamwork || 'Не заполнено'}
- Fun: ${notebook?.coreValues?.fun || 'Не заполнено'}

ИССЛЕДОВАНИЕ:
- Данные: ${notebook?.research?.data || 'Не заполнено'}
- Графики: ${notebook?.research?.graphs || 'Не заполнено'}
- Актуальность: ${notebook?.research?.relevance || 'Не заполнено'}

ЗАПИСИ ДНЕВНИКА (${diaryEntries?.length || 0} записей):
${(diaryEntries || []).slice(0, 10).map((e: any) => `- ${e.date}: ${e.q1} | ${e.q2 || ''} | ${e.q3 || ''}`).join('\n')}

${criteriaText ? `КРИТЕРИИ ОЦЕНИВАНИЯ:\n${criteriaText}` : ''}

На основе этих ответов сгенерируй полный документ по структуре шаблона. Верни JSON:
{
  "title_page": "текст титульной страницы",
  "annotation": "аннотация",
  "introduction": "введение",
  "goals": "цель, задачи и гипотеза",
  "existing_solutions": "обзор существующих решений",
  "theory": "теоретическое обоснование",
  "construction": "конструкция",
  "methodology": "методика эксперимента",
  "results": "результаты тестирования",
  "error_analysis": "анализ погрешностей",
  "evaluation": "оценка",
  "pros_cons": "преимущества и недостатки",
  "conclusion": "вывод",
  "bibliography": "библиография"
}`;

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
              description: "Generate a structured document with sections",
              parameters: {
                type: "object",
                properties: {
                  title_page: { type: "string" },
                  annotation: { type: "string" },
                  introduction: { type: "string" },
                  goals: { type: "string" },
                  existing_solutions: { type: "string" },
                  theory: { type: "string" },
                  construction: { type: "string" },
                  methodology: { type: "string" },
                  results: { type: "string" },
                  error_analysis: { type: "string" },
                  evaluation: { type: "string" },
                  pros_cons: { type: "string" },
                  conclusion: { type: "string" },
                  bibliography: { type: "string" },
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
    
    let sections: any = {};
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        sections = JSON.parse(toolCall.function.arguments);
      } catch {
        sections = { error: "Failed to parse AI response" };
      }
    } else {
      // Fallback: try to parse content as JSON
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) sections = JSON.parse(jsonMatch[0]);
      } catch {
        sections = { raw: content };
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
