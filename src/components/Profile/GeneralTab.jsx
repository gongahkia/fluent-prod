import React from "react"

const GeneralTab = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows="3"
          placeholder="Tell others about yourself and your language learning journey..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g. New York, USA"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://yourwebsite.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Banner Image URL
        </label>
        <input
          type="url"
          name="bannerImage"
          value={formData.bannerImage}
          onChange={handleInputChange}
          placeholder="https://example.com/banner.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter a URL for your profile banner image
        </p>
      </div>

      {/* Appearance Settings */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark (Coming Soon)</option>
              <option value="auto">Auto (Coming Soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'orange', color: 'bg-orange-500' },
                { name: 'blue', color: 'bg-blue-500' },
                { name: 'green', color: 'bg-green-500' },
                { name: 'purple', color: 'bg-purple-500' },
                { name: 'pink', color: 'bg-pink-500' },
                { name: 'red', color: 'bg-red-500' },
                { name: 'yellow', color: 'bg-yellow-500' },
                { name: 'gray', color: 'bg-gray-600' }
              ].map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => handleInputChange({ target: { name: 'accentColor', value: name } })}
                  className={`h-12 ${color} rounded-lg border-2 transition-all ${
                    formData.accentColor === name ? 'border-gray-900 scale-105' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <select
              name="fontSize"
              value={formData.fontSize}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneralTab
