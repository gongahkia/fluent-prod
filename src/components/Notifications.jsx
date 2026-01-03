import React from "react"
import { ArrowLeft, X } from "lucide-react"

const Notifications = ({ notifications = [], onDismiss, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
        <div className="w-9" />
      </div>

      {notifications.length === 0 ? (
        <div className="text-sm text-gray-500">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3"
            >
              <div className="text-lg leading-none mt-0.5" aria-hidden="true">
                {n.icon || "ℹ️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 break-words">{n.message}</div>
                {n.createdAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
                onClick={() => onDismiss?.(n.id)}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
