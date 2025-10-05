import React from "react"

const NotificationsTab = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Email Notifications
            </h3>
            <p className="text-sm text-gray-500">
              Receive notifications via email
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Push Notifications
            </h3>
            <p className="text-sm text-gray-500">
              Receive push notifications on your device
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="pushNotifications"
              checked={formData.pushNotifications}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Comment Notifications
            </h3>
            <p className="text-sm text-gray-500">
              Get notified when someone comments on your posts
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="commentNotifications"
              checked={formData.commentNotifications}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

export default NotificationsTab
