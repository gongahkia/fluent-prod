let activeWordRequestController = null

export function beginWordRequest() {
  if (activeWordRequestController) {
    activeWordRequestController.abort()
  }
  const controller = new AbortController()
  activeWordRequestController = controller
  return controller
}

export function isActiveWordRequest(controller) {
  return activeWordRequestController === controller
}

export function clearActiveWordRequest(controller) {
  if (isActiveWordRequest(controller)) {
    activeWordRequestController = null
  }
}

export function ensureWordRequestNotAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException("Translation request was aborted", "AbortError")
  }
}

export function resetWordRequestControllerForTests() {
  if (activeWordRequestController) {
    activeWordRequestController.abort()
  }
  activeWordRequestController = null
}
