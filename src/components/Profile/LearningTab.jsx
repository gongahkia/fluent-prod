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

const LearningTab = ({ formData, handleInputChange, showIntermediateModeToggle = false }) => {
  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <span className="block mb-2">Native Language</span>
              <select
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
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <span className="block mb-2">Learning Language</span>
              <select
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
            </label>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-2">Current Level</span>
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
          </label>
        </div>

        {showIntermediateModeToggle && (
          <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
            <label className="flex items-start justify-between gap-4">
              <div>
                <span className="block text-sm font-semibold text-gray-900">
                  Intermediate Learner Mode
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  Show Japanese first and reveal English only when you request it.
                </span>
              </div>
              <input
                type="checkbox"
                name="intermediateMode"
                checked={Boolean(formData.intermediateMode)}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

export default LearningTab
