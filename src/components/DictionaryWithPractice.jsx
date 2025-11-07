import { BookOpen, Shuffle } from "lucide-react"
import React, { useState } from "react"
import Dictionary from "./Dictionary"
import Flashcards from "./Flashcards"

/**
 * Combined Dictionary and Flashcards view with tab toggle
 * Consolidates study features into a single navigation item
 */
const DictionaryWithPractice = ({ userDictionary, onRemoveWord, userProfile }) => {
  const [activeTab, setActiveTab] = useState("words") // "words" or "practice"

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Toggle */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg max-w-md mx-auto animate-slideInFromBottom">
        <button
          onClick={() => setActiveTab("words")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
            activeTab === "words"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Saved Words</span>
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
            activeTab === "practice"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Practice</span>
        </button>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === "words" ? (
          <Dictionary
            userDictionary={userDictionary}
            onRemoveWord={onRemoveWord}
            userProfile={userProfile}
          />
        ) : (
          <Flashcards
            userDictionary={userDictionary}
            userProfile={userProfile}
          />
        )}
      </div>
    </div>
  )
}

export default DictionaryWithPractice
