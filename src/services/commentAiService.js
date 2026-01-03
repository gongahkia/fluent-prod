import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"

const DEFAULT_WEBLLM_MODEL =
  import.meta.env.VITE_WEBLLM_MODEL || "Llama-3.2-1B-Instruct-q4f16_1"

const DEFAULT_MAX_CHARS = {
  postTitle: 180,
  postContent: 1400,
  comment: 1200,
}

function truncateText(text, maxChars) {
  if (!text) return ""
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}…`
}

function extractJsonCandidate(text) {
  if (!text) return null

  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) return fenced[1]

  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }

  const firstBracket = text.indexOf("[")
  const lastBracket = text.lastIndexOf("]")
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1)
  }

  return null
}

function safeParseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    // fall through
  }

  const candidate = extractJsonCandidate(text)
  if (!candidate) return null

  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

let webLlmEnginePromise = null
let webLlmModelLoaded = null

async function getWebLlmEngine() {
  if (typeof window === "undefined") {
    throw new Error("WebLLM is only available in the browser")
  }

  if (!("gpu" in navigator)) {
    throw new Error("WebGPU not available")
  }

  if (!webLlmEnginePromise) {
    webLlmEnginePromise = (async () => {
      const webllm = await import("@mlc-ai/web-llm")
      // engine is stateful; keep a singleton
      return new webllm.MLCEngine()
    })()
  }

  return webLlmEnginePromise
}

async function ensureWebLlmModelLoaded(model = DEFAULT_WEBLLM_MODEL) {
  const engine = await getWebLlmEngine()
  if (webLlmModelLoaded === model) return { engine, model }

  // This downloads model weights on first load; can take a while.
  await engine.reload(model)
  webLlmModelLoaded = model
  return { engine, model }
}

async function webLlmChat({
  system,
  user,
  temperature = 0.3,
  maxTokens = 256,
  model = DEFAULT_WEBLLM_MODEL,
} = {}) {
  const { engine } = await ensureWebLlmModelLoaded(model)

  const completion = await engine.chat.completions.create({
    messages: [
      { role: "system", content: system || "" },
      { role: "user", content: user || "" },
    ],
    temperature,
    max_tokens: maxTokens,
  })

  return completion?.choices?.[0]?.message?.content || ""
}

let langDetectPipelinePromise = null

async function detectLanguageCode(text) {
  const sample = (text || "").trim().slice(0, 280)
  if (!sample) return null

  if (!langDetectPipelinePromise) {
    langDetectPipelinePromise = (async () => {
      const { pipeline, env } = await import("@xenova/transformers")
      // Avoid filesystem/local model assumptions in browser.
      env.allowLocalModels = false
      // Small-ish language ID model.
      return pipeline(
        "text-classification",
        "Xenova/fasttext-language-identification"
      )
    })()
  }

  try {
    const classifier = await langDetectPipelinePromise
    const result = await classifier(sample)
    const label = result?.[0]?.label
    if (typeof label === "string" && label.startsWith("__label__")) {
      return label.replace("__label__", "")
    }
    return null
  } catch {
    // If it fails (model download blocked, etc.), just skip language detection.
    return null
  }
}

const SuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        text: z.string(),
        translation: z.string().optional().default(""),
      })
    )
    .min(1),
})

const GrammarSchema = z.object({
  originalText: z.string(),
  isCorrect: z.boolean(),
  correctedText: z.string().optional().default(""),
  explanation: z.string().optional().default(""),
})

const suggestionsParser = StructuredOutputParser.fromZodSchema(SuggestionsSchema)
const grammarParser = StructuredOutputParser.fromZodSchema(GrammarSchema)

export async function generateCommentSuggestionsLocal({
  postTitle,
  postContent,
  targetLanguage,
  numberOfSuggestions = 3,
  model = DEFAULT_WEBLLM_MODEL,
} = {}) {
  const title = truncateText(postTitle || "", DEFAULT_MAX_CHARS.postTitle)
  const content = truncateText(postContent || "", DEFAULT_MAX_CHARS.postContent)
  const language = targetLanguage || "Japanese"

  const system =
    "You generate short, friendly comment suggestions for a language-learning social app. " +
    "Return ONLY JSON. Do not include markdown or extra commentary."

  const prompt = await PromptTemplate.fromTemplate(
    [
      `Write {n} short comment suggestions responding to the post below.`,
      `Each suggestion should mix simple English with a bit of {language}.`,
      `Avoid being overly formal. Keep each suggestion <= 160 characters if possible.`,
      `The "translation" should be the English meaning of the non-English part (or a full English paraphrase if mixed).`,
      `{format_instructions}`,
      ``,
      `POST TITLE: {title}`,
      `POST CONTENT: {content}`,
    ].join("\n")
  ).format({
    n: numberOfSuggestions,
    language,
    title: title || "(no title)",
    content: content || "(no content)",
    format_instructions: suggestionsParser.getFormatInstructions(),
  })

  const raw = await webLlmChat({
    system,
    user: prompt,
    model,
    temperature: 0.5,
    maxTokens: 384,
  })

  let parsedSuggestions
  try {
    parsedSuggestions = await suggestionsParser.parse(raw)
  } catch {
    const fallback = safeParseJson(raw)
    const validated = SuggestionsSchema.safeParse(fallback)
    if (!validated.success) {
      throw new Error("WebLLM returned invalid suggestions JSON")
    }
    parsedSuggestions = validated.data
  }

  return {
    model,
    suggestions: parsedSuggestions.suggestions
      .filter((s) => s?.text && typeof s.text === "string")
      .slice(0, numberOfSuggestions)
      .map((s) => ({
        text: s.text.trim(),
        translation: (s.translation || "").trim(),
      })),
  }
}

export async function checkGrammarLocal({
  commentText,
  targetLanguage,
  model = DEFAULT_WEBLLM_MODEL,
} = {}) {
  const text = (commentText || "").trim()
  const language = targetLanguage || "Japanese"

  if (!text) {
    return {
      model,
      originalText: "",
      isCorrect: true,
      correctedText: "",
      explanation: "",
    }
  }

  const detected = await detectLanguageCode(text)

  const system =
    "You are a careful bilingual writing assistant. Return ONLY JSON. Do not include markdown or extra commentary."

  const prompt = await PromptTemplate.fromTemplate(
    [
      `Check the comment below for grammar/spelling and naturalness. The user is learning {language}.`,
      `If the comment is already fine, set isCorrect=true and keep correctedText empty.`,
      `If improvements are needed, set isCorrect=false, provide correctedText (keeping the original meaning), and provide a short explanation.`,
      `{format_instructions}`,
      detected ? `Detected primary language: {detected}` : ``,
      ``,
      `COMMENT: {comment}`,
    ]
      .filter(Boolean)
      .join("\n")
  ).format({
    language,
    detected: detected || "",
    comment: truncateText(text, DEFAULT_MAX_CHARS.comment),
    format_instructions: grammarParser.getFormatInstructions(),
  })

  const raw = await webLlmChat({
    system,
    user: prompt,
    model,
    temperature: 0.15,
    maxTokens: 384,
  })

  let parsedGrammar
  try {
    parsedGrammar = await grammarParser.parse(raw)
  } catch {
    const fallback = safeParseJson(raw)
    const validated = GrammarSchema.safeParse(fallback)
    if (!validated.success) {
      throw new Error("WebLLM returned invalid grammar JSON")
    }
    parsedGrammar = validated.data
  }

  return {
    model,
    originalText: parsedGrammar.originalText || text,
    isCorrect: parsedGrammar.isCorrect,
    correctedText: (parsedGrammar.correctedText || "").trim(),
    explanation: (parsedGrammar.explanation || "").trim(),
  }
}
