export const NATIVE_LANGUAGE_OPTIONS = [
  { value: "English", disabled: false },
  { value: "Chinese", disabled: true },
  { value: "Bahasa Indonesia", disabled: true },
  { value: "Japanese", disabled: true },
]

export const TARGET_LANGUAGE_OPTIONS = [
  { value: "English", disabled: true },
  { value: "Chinese", disabled: true },
  { value: "Bahasa Indonesia", disabled: true },
  { value: "Japanese", disabled: false },
]

const LearningTab = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="settings-native-language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Native Language
            </label>
            <select
              id="settings-native-language"
              name="nativeLanguage"
              value={formData.nativeLanguage}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              {NATIVE_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="settings-target-language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Learning Language
            </label>
            <select
              id="settings-target-language"
              name="targetLanguage"
              value={formData.targetLanguage}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              {TARGET_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="settings-learning-level"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Current Level
          </label>
          <select
            id="settings-learning-level"
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
