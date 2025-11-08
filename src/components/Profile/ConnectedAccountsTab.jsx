import React, { useState, useEffect } from "react"
import { Link, Bot, X, RefreshCw, CheckCircle2, Check } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { startRedditOAuth, syncRedditSubreddits, disconnectReddit, checkRedditStatus } from "@/services/redditService"

const ConnectedAccountsTab = ({ formData, handleInputChange }) => {
  const { currentUser, userProfile } = useAuth()
  const [showPopup, setShowPopup] = useState(null)
  const [tempApiKey, setTempApiKey] = useState("")
  const [showStorageWarning, setShowStorageWarning] = useState(false)
  const [redditConfigured, setRedditConfigured] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState(null)

  // Check if Reddit OAuth is configured on backend
  useEffect(() => {
    checkRedditStatus().then(status => {
      setRedditConfigured(status.configured)
    })
  }, [])

  const connections = [
    {
      id: "reddit",
      name: "Reddit Account",
      icon: Link,
      connected: !!userProfile?.reddit?.connected,
      color: "orange",
      benefits: [
        "Sync your subscribed subreddits",
        "Auto-fetch content from your subscriptions",
        "Keep your feed personalized",
        "Connect once, sync anytime"
      ],
      useOAuth: true, // NEW: Use OAuth flow
      username: userProfile?.reddit?.username || null,
      syncedSubreddits: userProfile?.reddit?.syncedSubreddits || [],
      lastSynced: userProfile?.reddit?.lastSynced || null
    },
    {
      id: "gemini",
      name: "Gemini AI",
      icon: Bot,
      connected: !!formData.geminiApiKey,
      color: "purple",
      benefits: [
        "AI-powered comment suggestions",
        "Smart translation assistance",
        "Personalized learning recommendations",
        "Context-aware word explanations",
        "Intelligent conversation practice"
      ],
      instructions: "Get your free API key from Google AI Studio: https://ai.google.dev/",
      apiKeyField: "geminiApiKey",
      placeholder: "Enter your Gemini API Key",
      useOAuth: false
    }
  ]

  const handleConnect = async (connection) => {
    if (connection.useOAuth && connection.id === "reddit") {
      // Reddit OAuth flow
      if (!redditConfigured) {
        alert("Reddit OAuth is not configured on the server. Please contact the administrator.")
        return
      }

      try {
        await startRedditOAuth()
        // User will be redirected to Reddit, then back to /auth/reddit/callback
      } catch (error) {
        console.error("Error starting Reddit OAuth:", error)
        alert(`Failed to connect Reddit: ${error.message}`)
      }
    } else {
      // Traditional API key flow
      setTempApiKey(formData[connection.apiKeyField] || "")
      setShowPopup(connection)
    }
  }

  const handleSaveApiKey = () => {
    if (!tempApiKey.trim()) {
      alert("Please enter a valid API key")
      return
    }

    // Show storage warning if not already shown
    const hasSeenWarning = localStorage.getItem("apiKeyStorageWarningShown")
    if (!hasSeenWarning) {
      setShowStorageWarning(true)
      localStorage.setItem("apiKeyStorageWarningShown", "true")
    }

    // Save to formData (will be persisted to localStorage when user clicks Save Changes)
    handleInputChange({
      target: {
        name: showPopup.apiKeyField,
        value: tempApiKey
      }
    })

    setShowPopup(null)
    setTempApiKey("")
  }

  const handleDisconnect = async (connection) => {
    if (connection.useOAuth && connection.id === "reddit") {
      // Reddit OAuth disconnect
      if (!confirm(`Are you sure you want to disconnect your Reddit account (@${connection.username})?`)) {
        return
      }

      try {
        await disconnectReddit(currentUser.uid)
        window.location.reload() // Reload to update UI
      } catch (error) {
        console.error("Error disconnecting Reddit:", error)
        alert(`Failed to disconnect Reddit: ${error.message}`)
      }
    } else {
      // Traditional API key disconnect
      if (confirm(`Are you sure you want to disconnect ${connection.name}?`)) {
        handleInputChange({
          target: {
            name: connection.apiKeyField,
            value: ""
          }
        })
      }
    }
  }

  const handleSyncSubreddits = async () => {
    if (!currentUser) return

    setSyncing(true)
    setSyncMessage(null)

    try {
      const result = await syncRedditSubreddits(currentUser.uid)
      setSyncMessage({
        type: "success",
        text: `Successfully synced ${result.count} subreddits!`
      })

      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Error syncing subreddits:", error)
      setSyncMessage({
        type: "error",
        text: `Failed to sync: ${error.message}`
      })
    } finally {
      setSyncing(false)
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-700",
        button: "bg-orange-600 hover:bg-orange-700"
      },
      blue: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-700",
        button: "bg-orange-600 hover:bg-orange-700"
      },
      purple: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        button: "bg-amber-600 hover:bg-amber-700"
      }
    }
    return colors[color] || colors.blue
  }

  const formatDate = (date) => {
    if (!date) return "Never"
    try {
      const d = date.toDate ? date.toDate() : new Date(date)
      return d.toLocaleDateString() + " " + d.toLocaleTimeString()
    } catch {
      return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <strong>Connect your accounts</strong> to unlock additional features and enhance your learning experience.
          Reddit uses secure OAuth 2.0. Gemini API keys are encrypted and stored securely.
        </p>
      </div>

      {/* Connection Cards */}
      <div className="space-y-4">
        {connections.map((connection) => {
          const Icon = connection.icon
          const colors = getColorClasses(connection.color)

          return (
            <div
              key={connection.id}
              className={`${colors.bg} border ${colors.border} rounded-lg p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${colors.button} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {connection.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${connection.connected ? 'bg-amber-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm text-gray-600">
                        {connection.connected
                          ? (connection.username ? `Connected as @${connection.username}` : 'Connected')
                          : 'Not connected'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {connection.connected ? (
                    <>
                      {/* Sync button for Reddit */}
                      {connection.id === "reddit" && (
                        <button
                          onClick={handleSyncSubreddits}
                          disabled={syncing}
                          className="px-4 py-2 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                          <span>{syncing ? 'Syncing...' : 'Sync'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDisconnect(connection)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(connection)}
                      disabled={connection.id === "reddit" && !redditConfigured}
                      className={`px-4 py-2 text-sm font-medium text-white ${colors.button} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Reddit-specific info */}
              {connection.id === "reddit" && connection.connected && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Synced Subreddits:</p>
                      <p className="text-gray-600">{connection.syncedSubreddits.length} subreddits</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Last Synced:</p>
                      <p className="text-gray-600">{formatDate(connection.lastSynced)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sync message */}
              {connection.id === "reddit" && syncMessage && (
                <div className={`mb-4 p-3 rounded-lg border flex items-center space-x-2 ${
                  syncMessage.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  {syncMessage.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                  <span className="text-sm font-medium">{syncMessage.text}</span>
                </div>
              )}

              {/* Benefits Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">What you can do:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {connection.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gemini API Key Popup (unchanged) */}
      {showPopup && !showPopup.useOAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPopup(null)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Connect {showPopup.name}</h3>
              <button onClick={() => setShowPopup(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Benefits List */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Connecting {showPopup.name} will enable:</p>
              <ul className="space-y-2">
                {showPopup.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <Check className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* API Key Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key / Token
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder={showPopup.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                {showPopup.instructions}
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleSaveApiKey}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowPopup(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Warning Popup (unchanged) */}
      {showStorageWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Storage Notice</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your API keys will be stored in your browser's local storage. This means:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Keys persist across browser sessions</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>They're encrypted and stored locally on your device</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Clearing browser data will remove your keys</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Keys are also saved to your Firebase profile</span>
              </li>
            </ul>
            <button
              onClick={() => setShowStorageWarning(false)}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectedAccountsTab
