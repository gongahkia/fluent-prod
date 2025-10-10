import React, { useState } from "react"
import { X } from "lucide-react"

const GeneralTab = ({ formData, handleInputChange }) => {
  // All available subreddit tags based on target language
  const allTags = {
    Japanese: [
      "lowlevelaware",
      "newsokur",
      "anime",
      "BakaNewsJP",
      "manga",
      "jpop",
      "japannews",
      "japanmemes",
      "shibuya",
      "harajuku"
    ],
    Korean: [
      "hanguk",
      "kpop",
      "korea",
      "korean",
      "southkorea",
      "seoul",
      "koreanews",
      "koreamemes"
    ]
  }

  // Get tags for current target language
  const availableTags = allTags[formData.targetLanguage] || []

  // Initialize selected tags from formData or default to empty array
  const [selectedTags, setSelectedTags] = useState(formData.selectedTags || [])

  const handleToggleTag = (tag) => {
    let newTags
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag)
    } else {
      newTags = [...selectedTags, tag]
    }
    setSelectedTags(newTags)
    // Update formData
    handleInputChange({
      target: {
        name: 'selectedTags',
        value: newTags
      }
    })
  }

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
          Profile Picture URL
        </label>
        <input
          type="url"
          name="profilePictureUrl"
          value={formData.profilePictureUrl}
          onChange={handleInputChange}
          placeholder="https://example.com/profile.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter a URL for your profile picture
        </p>
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

      {/* Interest Tags */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Interests</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select subreddits you're interested in to personalize your feed. Posts from these communities will appear in your learning feed.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Currently showing:</strong> r/{formData.targetLanguage === 'Japanese' ? 'japan' : 'korea'} subreddits.
            Change your learning language in the Learning tab to see different options.
          </p>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected ({selectedTags.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors group"
                >
                  <span>r/{tag}</span>
                  <X className="w-4 h-4 ml-2 group-hover:text-orange-900" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Available Subreddits
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter(tag => !selectedTags.includes(tag))
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  r/{tag}
                </button>
              ))}
          </div>
          {availableTags.filter(tag => !selectedTags.includes(tag)).length === 0 && (
            <p className="text-sm text-gray-500 italic">
              All subreddits selected! You can remove some by clicking the X button above.
            </p>
          )}
        </div>
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
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
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
