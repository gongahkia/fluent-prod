import React from "react"

const DeveloperTab = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Developer Mode:</strong> Configure API keys for additional news sources. These credentials are stored locally in your browser's session storage and are never sent to our servers.
        </p>
      </div>

      {/* Twitter API Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Twitter API</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter Bearer Token
            </label>
            <input
              type="password"
              name="twitterBearerToken"
              value={formData.twitterBearerToken}
              onChange={handleInputChange}
              placeholder="Enter your Twitter API Bearer Token"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your Bearer Token from{" "}
              <a
                href="https://developer.twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                developer.twitter.com
              </a>
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${formData.twitterBearerToken ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className="text-gray-600">
              {formData.twitterBearerToken ? 'Configured' : 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Instagram API Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instagram API</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram Username
            </label>
            <input
              type="text"
              name="instagramUsername"
              value={formData.instagramUsername}
              onChange={handleInputChange}
              placeholder="Enter your Instagram username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram Password
            </label>
            <input
              type="password"
              name="instagramPassword"
              value={formData.instagramPassword}
              onChange={handleInputChange}
              placeholder="Enter your Instagram password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your credentials are stored locally and never sent to our servers
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${formData.instagramUsername && formData.instagramPassword ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className="text-gray-600">
              {formData.instagramUsername && formData.instagramPassword ? 'Configured' : 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Reddit (No configuration needed) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reddit API</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Enabled by default (no API key required)</span>
          </div>
        </div>
      </div>

      {/* Gemini AI API Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gemini AI (AI Features)</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              name="geminiApiKey"
              value={formData.geminiApiKey}
              onChange={handleInputChange}
              placeholder="Enter your Gemini 2.0 API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your free API key from{" "}
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a>
              {" "}to enable AI-powered comment suggestions
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${formData.geminiApiKey ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className="text-gray-600">
              {formData.geminiApiKey ? 'Configured - AI features enabled' : 'Not configured - AI features disabled'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> After configuring API keys, click "Save Changes" at the top to persist them in your browser session.
        </p>
      </div>
    </div>
  )
}

export default DeveloperTab
