import React, { useEffect } from "react"
import { X } from "lucide-react"

/**
 * Toast notification component for subtle feedback
 * Auto-dismisses after specified duration
 */
const Toast = ({ message, icon, onClose, duration = 2000, actions = [] }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideInFromBottom">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[200px]">
        {icon && <span className="text-lg">{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{message}</div>
          {Array.isArray(actions) && actions.length > 0 && (
            <div className="mt-2 flex items-center justify-end space-x-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={
                    action.variant === "primary"
                      ? "bg-white text-gray-900 px-3 py-1 rounded-md text-xs font-semibold hover:bg-gray-100"
                      : "bg-transparent text-gray-200 px-3 py-1 rounded-md text-xs font-medium hover:text-white"
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
