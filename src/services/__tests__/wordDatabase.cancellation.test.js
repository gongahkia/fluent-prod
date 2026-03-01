import assert from "node:assert/strict"
import test from "node:test"
import {
  beginWordRequest,
  clearActiveWordRequest,
  ensureWordRequestNotAborted,
  isActiveWordRequest,
  resetWordRequestControllerForTests,
} from "../../lib/wordRequestController.js"

test("beginWordRequest aborts previous active request", () => {
  resetWordRequestControllerForTests()
  const first = beginWordRequest()
  assert.equal(first.signal.aborted, false)
  assert.equal(isActiveWordRequest(first), true)

  const second = beginWordRequest()
  assert.equal(first.signal.aborted, true)
  assert.equal(second.signal.aborted, false)
  assert.equal(isActiveWordRequest(first), false)
  assert.equal(isActiveWordRequest(second), true)
})

test("clearActiveWordRequest only clears the current request", () => {
  resetWordRequestControllerForTests()
  const first = beginWordRequest()
  const second = beginWordRequest()

  clearActiveWordRequest(first)
  assert.equal(isActiveWordRequest(second), true)

  clearActiveWordRequest(second)
  assert.equal(isActiveWordRequest(second), false)
})

test("ensureWordRequestNotAborted throws AbortError for aborted signals", () => {
  const controller = new AbortController()
  ensureWordRequestNotAborted(controller.signal)

  controller.abort()
  assert.throws(
    () => ensureWordRequestNotAborted(controller.signal),
    (error) => {
      assert.equal(error?.name, "AbortError")
      return true
    }
  )
})
