import { NextRequest, NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.1-8b-instant";

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in .env.local");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message ?? `Groq API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    let prompt = "";

    if (action === "generate_all") {
      const { name } = data;
      prompt = `Ты помощник для создания карточек товаров на маркетплейсе.

Сгенерируй все необходимые поля для товара с названием: "${name}"

Верни ТОЛЬКО JSON объект без пояснений:
{
  "description_short": "краткое описание 1-2 предложения",
  "description_long": "полное описание 3-5 абзацев",
  "code": "уникальный артикул/SKU в формате XXX-XXXXX",
  "seo_title": "SEO заголовок для поисковых систем",
  "seo_description": "SEO описание 150-160 символов",
  "seo_keywords": ["ключевое1", "ключевое2", "ключевое3", "ключевое4", "ключевое5"],
  "marketplace_price": 0,
  "chatting_percent": 4,
  "address": "улица Примерная 1, Москва, Россия, 101000",
  "latitude": 55.7558,
  "longitude": 37.6173,
  "category_suggestion": "предлагаемая категория товара"
}`;
    } else if (action === "generate_seo") {
      const { name, description_short, description_long } = data;
      prompt = `Сгенерируй SEO параметры для товара на маркетплейсе.

Название: ${name}
Краткое описание: ${description_short}
Полное описание: ${description_long}

Верни ТОЛЬКО JSON без пояснений:
{
  "seo_title": "оптимизированный SEO заголовок до 60 символов",
  "seo_description": "SEO описание 150-160 символов с ключевыми словами",
  "seo_keywords": ["ключевое1", "ключевое2", "ключевое3", "ключевое4", "ключевое5", "ключевое6", "ключевое7"]
}`;
    } else if (action === "improve_description") {
      const { text, type } = data;
      const typeLabel = type === "short" ? "краткое (1-2 предложения)" : "подробное (3-5 абзацев)";
      prompt = `Улучши ${typeLabel} описание товара для маркетплейса. Сделай его более привлекательным, информативным и продающим.

Оригинальный текст: "${text}"

Верни ТОЛЬКО JSON без пояснений:
{
  "improved_text": "улучшенный текст"
}`;
    } else if (action === "suggest_category") {
      const { name, description_short } = data;
      prompt = `Определи категорию товара для маркетплейса.

Название: ${name}
Описание: ${description_short}

Доступные категории (id: название):
- 2477: Электроника и гаджеты
- 2478: Одежда и обувь
- 2479: Дом и сад
- 2480: Спорт и отдых
- 2481: Красота и здоровье
- 2482: Детские товары
- 2483: Книги и канцелярия
- 2484: Еда и напитки
- 2485: Автотовары
- 2486: Прочее

Верни ТОЛЬКО JSON без пояснений:
{
  "category_id": 2477,
  "category_name": "название категории",
  "confidence": "высокая/средняя/низкая"
}`;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const text = await callGroq(prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response", raw: text }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI API error:", message);
    return NextResponse.json(
      { error: "AI generation failed", details: message },
      { status: 500 }
    );
  }
}
