const DEFAULT_OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434"
const DEFAULT_TIMEOUT_MS = 20_000

function truncateText(text, maxChars) {
  if (!text) return ""
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}…`
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

let cachedModelName = null

async function resolveOllamaModel(baseUrl = DEFAULT_OLLAMA_BASE_URL) {
  const override = import.meta.env.VITE_OLLAMA_MODEL
  if (override) return override
  if (cachedModelName) return cachedModelName

  const res = await fetchWithTimeout(`${baseUrl}/api/tags`, { method: "GET" }, 4000)
  if (!res.ok) {
    throw new Error(`Ollama not reachable (GET /api/tags -> ${res.status})`)
  }

  const data = await res.json().catch(() => null)
  const modelName = data?.models?.[0]?.name
  if (!modelName) {
    throw new Error("No local Ollama models found. Pull one in Ollama first.")
  }

  cachedModelName = modelName
  return modelName
}

function extractJson(text) {
  if (!text) return null

  // Prefer fenced JSON blocks
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1])
    } catch {
      // fall through
    }
  }

  // Otherwise try to parse the first object/array found
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(candidate)
    } catch {
      // fall through
    }
  }

  const firstBracket = text.indexOf("[")
  const lastBracket = text.lastIndexOf("]")
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.slice(firstBracket, lastBracket + 1)
    try {
      return JSON.parse(candidate)
    } catch {
      // ignore
    }
  }

  return null
}

async function ollamaChat({ baseUrl = DEFAULT_OLLAMA_BASE_URL, model, messages, temperature = 0.2 }) {
  const res = await fetchWithTimeout(
    `${baseUrl}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature },
      }),
    },
    DEFAULT_TIMEOUT_MS
  )

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Ollama chat failed (${res.status}): ${body || res.statusText}`)
  }

  const data = await res.json().catch(() => null)
  return data?.message?.content || ""
}

async function ollamaGenerate({ baseUrl = DEFAULT_OLLAMA_BASE_URL, model, prompt, temperature = 0.2 }) {
  const res = await fetchWithTimeout(
    `${baseUrl}/api/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature },
      }),
    },
    DEFAULT_TIMEOUT_MS
  )

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Ollama generate failed (${res.status}): ${body || res.statusText}`)
  }

  const data = await res.json().catch(() => null)
  return data?.response || ""
}

async function ollamaComplete({ baseUrl, model, messages, temperature }) {
  try {
    return await ollamaChat({ baseUrl, model, messages, temperature })
  } catch {
    // Some Ollama setups may not support /api/chat; fallback to /api/generate
    const prompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n")
      .trim()
    return await ollamaGenerate({ baseUrl, model, prompt, temperature })
  }
}

export async function generateCommentSuggestionsLocal({
  postTitle,
  postContent,
  targetLanguage,
  numberOfSuggestions = 3,
  baseUrl = DEFAULT_OLLAMA_BASE_URL,
} = {}) {
  const model = await resolveOllamaModel(baseUrl)

  const title = truncateText(postTitle || "", 180)
  const content = truncateText(postContent || "", 1200)
  const language = targetLanguage || "Japanese"

  const system =
    "You generate short, friendly comment suggestions for a language-learning social app. " +
    "Return ONLY valid JSON. No markdown, no extra text."

  const user =
    `Write ${numberOfSuggestions} short comment suggestions responding to the post below. ` +
    `Each suggestion should mix simple English with a bit of ${language}. ` +
    "Avoid being overly formal. Keep each suggestion <= 160 characters if possible. " +
    "Return JSON of the form: { \"suggestions\": [{\"text\": string, \"translation\": string}] }. " +
    "The \"translation\" should be the English meaning of the non-English part (or a full English paraphrase if mixed).\n\n" +
    `POST TITLE: ${title || "(no title)"}\n` +
    `POST CONTENT: ${content || "(no content)"}`

  const raw = await ollamaComplete({
    baseUrl,
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  })

  const parsed = extractJson(raw)
  const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : null

  if (!suggestions || suggestions.length === 0) {
    throw new Error("Local LLM returned no suggestions")
  }

  return {
    model,
    suggestions: suggestions
      .filter((s) => s && typeof s.text === "string" && s.text.trim())
      .slice(0, numberOfSuggestions)
      .map((s) => ({
        text: s.text.trim(),
        translation: typeof s.translation === "string" ? s.translation.trim() : "",
      })),
  }
}

export async function checkGrammarLocal({
  commentText,
  targetLanguage,
  baseUrl = DEFAULT_OLLAMA_BASE_URL,
} = {}) {
  const model = await resolveOllamaModel(baseUrl)

  const language = targetLanguage || "Japanese"
  const text = (commentText || "").trim()
  if (!text) {
    return {
      model,
      originalText: "",
      isCorrect: true,
      correctedText: "",
      explanation: "",
    }
  }

  const system =
    "You are a careful bilingual writing assistant. Return ONLY valid JSON. No markdown, no extra text."

  const user =
    `Check the comment below for grammar/spelling and naturalness. The user is learning ${language}. ` +
    "If the comment is already fine, mark isCorrect=true and keep correctedText empty. " +
    "If improvements are needed, set isCorrect=false, provide correctedText (keeping the original meaning), " +
    "and provide a short explanation. " +
    "Return JSON of the form: { \"originalText\": string, \"isCorrect\": boolean, \"correctedText\": string, \"explanation\": string }.\n\n" +
    `COMMENT: ${truncateText(text, 1200)}`

  const raw = await ollamaComplete({
    baseUrl,
    model,
    temperature: 0.1,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  })

  const parsed = extractJson(raw)
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Local LLM returned unparsable grammar result")
  }

  const isCorrect = Boolean(parsed.isCorrect)
  const correctedText = typeof parsed.correctedText === "string" ? parsed.correctedText.trim() : ""

  return {
    model,
    originalText: typeof parsed.originalText === "string" ? parsed.originalText : text,
    isCorrect,
    correctedText,
    explanation: typeof parsed.explanation === "string" ? parsed.explanation.trim() : "",
  }
}
