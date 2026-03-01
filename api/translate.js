function json(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

async function translateWithLingva(text, fromLang, toLang) {
  const baseUrl = process.env.LINGVA_BASE_URL || "https://lingva.ml/api/v1"
  const url = `${baseUrl}/${fromLang}/${toLang}/${encodeURIComponent(text)}`
  const response = await fetch(url, { method: "GET" })
  if (!response.ok) {
    throw new Error(`Lingva request failed with status ${response.status}`)
  }

  const data = await response.json()
  return data?.translation || ""
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" })
  }

  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      return json(res, 400, { error: "Invalid JSON body" })
    }
  }

  const text = String(body?.text || "").trim()
  const fromLang = String(body?.fromLang || "en").trim()
  const toLang = String(body?.toLang || "ja").trim()

  if (!text) {
    return json(res, 400, { error: "Missing required field: text" })
  }

  try {
    const translation = await translateWithLingva(text, fromLang, toLang)

    return json(res, 200, {
      translation,
      provider: "lingva",
    })
  } catch (error) {
    return json(res, 502, {
      error: "Translation provider request failed",
      message: error?.message || "Unknown error",
    })
  }
}
