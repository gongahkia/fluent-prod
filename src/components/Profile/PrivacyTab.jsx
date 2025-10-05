import React from "react"
import { User, Trash2 } from "lucide-react"

const PrivacyTab = ({ formData, handleInputChange, setShowFollowers, setShowFollowing }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Visibility
        </label>
        <select
          name="profileVisibility"
          value={formData.profileVisibility}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="public">
            Public - Anyone can see your profile
          </option>
          <option value="friends">
            Friends Only - Only friends can see your profile
          </option>
          <option value="private">
            Private - Only you can see your profile
          </option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Show Email Address
            </h3>
            <p className="text-sm text-gray-500">
              Allow others to see your email address
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="showEmail"
              checked={formData.showEmail}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Show Location
            </h3>
            <p className="text-sm text-gray-500">
              Allow others to see your location
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="showLocation"
              checked={formData.showLocation}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
          </label>
        </div>
      </div>

      {/* Social Management */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowFollowers(true)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            Manage Followers
          </button>
          <button
            onClick={() => setShowFollowing(true)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            Manage Following
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors">
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Delete Account</span>
        </button>
        <p className="text-xs text-gray-500 mt-1">
          This action cannot be undone. All your data will be
          permanently deleted.
        </p>
      </div>
    </div>
  )
}

export default PrivacyTab
