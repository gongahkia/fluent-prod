import { Plus, Search, Trash2, X } from "lucide-react"
import React, { useState } from "react"

const CollectionWordsModal = ({
  collectionId,
  collections,
  userDictionary,
  onAddWord,
  onRemoveWord,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("")

  // Find the current collection from the live collections array
  // This ensures we always have the latest data from Firestore's real-time listener
  const collection = collections.find((c) => c.id === collectionId)

  // If collection not found (shouldn't happen), return null
  if (!collection) {
    return null
  }

  // Get words that are already in this collection
  const collectionWordIds = new Set(collection.wordIds || [])
  const wordsInCollection = userDictionary.filter((word) =>
    collectionWordIds.has(word.id.toString())
  )

  // Get filtered available words (not in collection)
  const getFilteredAvailableWords = () => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return []

    return userDictionary
      .filter((word) => !collectionWordIds.has(word.id.toString()))
      .filter((word) => {
        // Search across all fields
        const japanese = word.japanese || ""
        const korean = word.korean || ""
        const hiragana = word.hiragana || ""
        const romanization = word.romanization || ""
        const english = word.english || ""

        return (
          japanese.toLowerCase().includes(query) ||
          korean.toLowerCase().includes(query) ||
          hiragana.toLowerCase().includes(query) ||
          romanization.toLowerCase().includes(query) ||
          english.toLowerCase().includes(query)
        )
      })
      .slice(0, 10) // Limit to 10 results for performance
  }

  const availableWords = getFilteredAvailableWords()

  const handleAddWord = (wordId) => {
    onAddWord(collection.id, wordId)
  }

  const handleRemoveWord = (wordId) => {
    if (confirm("Remove this word from the collection?")) {
      onRemoveWord(collection.id, wordId)
    }
  }

  // Helper to display word fields
  const getWordDisplay = (word) => {
    const targetWord = word.japanese || word.korean || ""
    const reading = word.hiragana || word.romanization || ""
    const meaning = word.english || ""

    return { targetWord, reading, meaning }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Collection
            </h2>
            <p className="text-sm text-gray-600 mt-1">{collection.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Words in Collection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Words in Collection ({wordsInCollection.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {wordsInCollection.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No words in this collection yet.</p>
                    <p className="text-sm mt-2">
                      Search and add words from your dictionary.
                    </p>
                  </div>
                ) : (
                  wordsInCollection.map((word) => {
                    const { targetWord, reading, meaning } =
                      getWordDisplay(word)
                    return (
                      <div
                        key={word.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {targetWord}
                            </span>
                            {reading && (
                              <span className="text-sm text-gray-600">
                                ({reading})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 truncate">
                            {meaning}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveWord(word.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors ml-2"
                          title="Remove from collection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right: Search and Add Words */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Words from Dictionary
              </h3>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by English, Japanese, reading..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchQuery.trim() === "" ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Start typing to search your dictionary</p>
                  </div>
                ) : availableWords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No matching words found</p>
                    <p className="text-sm mt-2">
                      Try a different search term or all matching words are
                      already in this collection.
                    </p>
                  </div>
                ) : (
                  availableWords.map((word) => {
                    const { targetWord, reading, meaning } =
                      getWordDisplay(word)
                    return (
                      <div
                        key={word.id}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {targetWord}
                            </span>
                            {reading && (
                              <span className="text-sm text-gray-600">
                                ({reading})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 truncate">
                            {meaning}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddWord(word.id)}
                          className="p-2 text-orange-600 hover:text-orange-800 transition-colors ml-2"
                          title="Add to collection"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default CollectionWordsModal
