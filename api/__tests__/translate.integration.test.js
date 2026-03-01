import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../translate.js'

function createReqRes(body) {
  const req = {
    method: 'POST',
    body,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  }

  let responseBody = ''
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload) {
      responseBody = payload
    },
  }

  return {
    req,
    res,
    readJson: () => JSON.parse(responseBody || '{}'),
  }
}

test('translate handler falls back from lingva to mymemory', async () => {
  const originalFetch = global.fetch
  global.fetch = async (url) => {
    if (String(url).includes('lingva')) {
      return { ok: false, status: 503, json: async () => ({}) }
    }
    if (String(url).includes('mymemory')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ responseData: { translatedText: 'こんにちは' } }),
      }
    }
    return { ok: false, status: 500, json: async () => ({}) }
  }

  try {
    const { req, res, readJson } = createReqRes({ text: 'hello integration A', fromLang: 'en', toLang: 'ja' })
    await handler(req, res)

    const payload = readJson()
    assert.equal(res.statusCode, 200)
    assert.equal(payload.translation, 'こんにちは')
    assert.equal(payload.provider, 'mymemory')
  } finally {
    global.fetch = originalFetch
  }
})

test('translate handler returns NO_PROVIDER_SUCCESS when all providers fail', async () => {
  const originalFetch = global.fetch
  global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) })

  try {
    const { req, res, readJson } = createReqRes({ text: 'hello integration B', fromLang: 'en', toLang: 'ja' })
    await handler(req, res)

    const payload = readJson()
    assert.equal(res.statusCode, 502)
    assert.ok(['UPSTREAM_5XX', 'NO_PROVIDER_SUCCESS'].includes(payload.code))
  } finally {
    global.fetch = originalFetch
  }
})
