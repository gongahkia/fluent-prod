import React from "react"
import { Flame, Award, Zap, Globe } from "lucide-react"
import ConsistencyGraph from "../ConsistencyGraph"

const LearningTab = ({ formData, handleInputChange, mockActivityData }) => {
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

      {/* Consistency Graph */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Activity</h3>
        <ConsistencyGraph activityData={mockActivityData} />
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Flame className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="font-semibold text-gray-900">7 Day Streak</div>
              <div className="text-xs text-gray-600">First week!</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-semibold text-gray-900">100 Words</div>
              <div className="text-xs text-gray-600">Century club</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="font-semibold text-gray-900">Speed Reader</div>
              <div className="text-xs text-gray-600">10 posts/day</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div className="font-semibold text-gray-900">Explorer</div>
              <div className="text-xs text-gray-600">5 sources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Words Learned</span>
                <span className="font-medium text-gray-900">847 / 1000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '84.7%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Posts Read</span>
                <span className="font-medium text-gray-900">234 / 300</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Flashcards Reviewed</span>
                <span className="font-medium text-gray-900">1,234 / 2000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '61.7%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Goals</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Word Goal
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                name="dailyWordGoal"
                min="5"
                max="50"
                step="5"
                value={formData.dailyWordGoal}
                onChange={handleInputChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                {formData.dailyWordGoal}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Learn {formData.dailyWordGoal} new words every day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Reading Goal (Posts)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                name="dailyReadingGoal"
                min="1"
                max="20"
                step="1"
                value={formData.dailyReadingGoal}
                onChange={handleInputChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                {formData.dailyReadingGoal}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Read {formData.dailyReadingGoal} posts every day
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Daily Study Reminder
                </h3>
                <p className="text-sm text-gray-500">
                  Get reminded to study at your preferred time
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="studyReminder"
                  checked={formData.studyReminder}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
              </label>
            </div>

            {formData.studyReminder && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Time
                </label>
                <input
                  type="time"
                  name="reminderTime"
                  value={formData.reminderTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LearningTab
