import React from "react"

const LearningTab = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Native Language
            </label>
            <select
              name="nativeLanguage"
              value={formData.nativeLanguage}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Chinese">Chinese</option>
              <option value="Korean">Korean</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Language
            </label>
            <select
              name="targetLanguage"
              value={formData.targetLanguage}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Chinese" disabled>
                Chinese (Coming soon)
              </option>
              <option value="Spanish" disabled>
                Spanish (Coming soon)
              </option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Level
          </label>
          <select
            name="learningLevel"
            value={formData.learningLevel}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="1">Beginner</option>
            <option value="2">Intermediate</option>
            <option value="3">Advanced</option>
            <option value="4">Expert</option>
            <option value="5">Native</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default LearningTab
