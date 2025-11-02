import { useEffect } from 'react'

/**
 * Custom hook for keyboard navigation
 * Provides accessibility shortcuts for common actions
 */
export const useKeyboardNavigation = (callbacks) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger if user is typing in an input/textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      const { key, ctrlKey, metaKey, shiftKey } = event

      // Escape key - close modals/popups
      if (key === 'Escape' && callbacks.onEscape) {
        event.preventDefault()
        callbacks.onEscape()
      }

      // Arrow keys - navigate items
      if (key === 'ArrowDown' && callbacks.onNext) {
        event.preventDefault()
        callbacks.onNext()
      }

      if (key === 'ArrowUp' && callbacks.onPrevious) {
        event.preventDefault()
        callbacks.onPrevious()
      }

      // Enter/Space - activate current item
      if ((key === 'Enter' || key === ' ') && callbacks.onActivate) {
        event.preventDefault()
        callbacks.onActivate()
      }

      // Keyboard shortcuts (Cmd/Ctrl + key)
      const modifierKey = metaKey || ctrlKey

      if (modifierKey) {
        // Cmd/Ctrl + K - Search
        if (key === 'k' && callbacks.onSearch) {
          event.preventDefault()
          callbacks.onSearch()
        }

        // Cmd/Ctrl + / - Show keyboard shortcuts help
        if (key === '/' && callbacks.onHelp) {
          event.preventDefault()
          callbacks.onHelp()
        }

        // Cmd/Ctrl + S - Save
        if (key === 's' && callbacks.onSave) {
          event.preventDefault()
          callbacks.onSave()
        }
      }

      // Number keys 1-5 - navigate to tabs (when not in input)
      if (!modifierKey && !shiftKey && callbacks.onTabSwitch) {
        const num = parseInt(key)
        if (num >= 1 && num <= 5) {
          event.preventDefault()
          callbacks.onTabSwitch(num)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [callbacks])
}

/**
 * Hook for managing focus trapping in modals
 */
export const useFocusTrap = (isActive, containerRef) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Focus first element when modal opens
    firstElement?.focus()

    container.addEventListener('keydown', handleTab)
    return () => container.removeEventListener('keydown', handleTab)
  }, [isActive, containerRef])
}
