import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  FileText,
  Filter,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react"
import React, { useState } from "react"

const Dictionary = ({ onBack, userDictionary, onRemoveWord, onUpdateWord }) => {
  const [expandedWord, setExpandedWord] = useState(null)
  const [sortBy, setSortBy] = useState("date") // 'level', 'date', 'alphabetical', 'mastery'
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterTag, setFilterTag] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [editingWord, setEditingWord] = useState(null)
  const [editForm, setEditForm] = useState({})

  // Get unique tags from dictionary
  const getAllTags = () => {
    const tags = new Set()
    userDictionary.forEach(word => {
      if (word.tags && Array.isArray(word.tags)) {
        word.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags)
  }

  const getFilteredWords = () => {
    let words = [...userDictionary]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      words = words.filter(word =>
        word.japanese.toLowerCase().includes(query) ||
        word.hiragana.toLowerCase().includes(query) ||
        word.english.toLowerCase().includes(query)
      )
    }

    // Level filter
    if (filterLevel !== "all") {
      const level = parseInt(filterLevel)
      words = words.filter(word => word.level === level)
    }

    // Tag filter
    if (filterTag !== "all") {
      words = words.filter(word =>
        word.tags && word.tags.includes(filterTag)
      )
    }

    return words
  }

  const getSortedWords = () => {
    const words = getFilteredWords()

    switch (sortBy) {
      case "level":
        return words.sort((a, b) => a.level - b.level)
      case "date":
        return words.sort(
          (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
        )
      case "alphabetical":
        return words.sort((a, b) => a.japanese.localeCompare(b.japanese))
      case "mastery":
        // Sort by review data if available
        return words.sort((a, b) => {
          const aInterval = a.reviewData?.interval || 0
          const bInterval = b.reviewData?.interval || 0
          return bInterval - aInterval
        })
      default:
        return words
    }
  }

  const sortedWords = getSortedWords()

  const getLevelColor = (level) => {
    if (level === 1) return "bg-green-500"
    if (level === 2) return "bg-blue-500"
    if (level === 3) return "bg-yellow-500"
    if (level === 4) return "bg-orange-500"
    return "bg-red-500"
  }

  const getLevelName = (level) => {
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native']
    return levels[level - 1] || 'Beginner'
  }

  const removeWord = (wordId) => {
    if (confirm('Are you sure you want to remove this word from your dictionary?')) {
      onRemoveWord(wordId)
    }
  }

  const toggleExpanded = (wordId) => {
    setExpandedWord(expandedWord === wordId ? null : wordId)
  }

  const startEditing = (word) => {
    setEditingWord(word.id)
    setEditForm({
      japanese: word.japanese,
      hiragana: word.hiragana,
      english: word.english,
      example: word.example || '',
      exampleEn: word.exampleEn || '',
      notes: word.notes || '',
      tags: word.tags?.join(', ') || ''
    })
  }

  const saveEdit = () => {
    if (onUpdateWord && editingWord) {
      onUpdateWord(editingWord, {
        ...editForm,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t)
      })
      setEditingWord(null)
      setEditForm({})
    }
  }

  const cancelEdit = () => {
    setEditingWord(null)
    setEditForm({})
  }

  // Export dictionary as JSON
  const exportDictionary = () => {
    const dataStr = JSON.stringify(userDictionary, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `influent-dictionary-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export as CSV
  const exportCSV = () => {
    const headers = ['Japanese', 'Reading', 'English', 'Level', 'Example', 'Translation', 'Source', 'Date Added']
    const rows = userDictionary.map(word => [
      word.japanese,
      word.hiragana,
      word.english,
      word.level,
      word.example || '',
      word.exampleEn || '',
      word.source || '',
      word.dateAdded
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `influent-dictionary-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStats = () => {
    const byLevel = {
      1: sortedWords.filter(w => w.level === 1).length,
      2: sortedWords.filter(w => w.level === 2).length,
      3: sortedWords.filter(w => w.level === 3).length,
      4: sortedWords.filter(w => w.level === 4).length,
      5: sortedWords.filter(w => w.level === 5).length,
    }

    const mature = userDictionary.filter(w =>
      w.reviewData && w.reviewData.interval >= 21
    ).length

    return { byLevel, mature, total: userDictionary.length }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Feed
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              My Japanese Dictionary
            </h1>
            <p className="text-sm text-gray-600">
              {stats.total} words • {stats.mature} mature
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export as CSV"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={exportDictionary}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export as JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Vocabulary Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.byLevel[1]}</div>
              <div className="text-xs text-gray-600">Beginner</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.byLevel[2]}</div>
              <div className="text-xs text-gray-600">Intermediate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.byLevel[3]}</div>
              <div className="text-xs text-gray-600">Advanced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.byLevel[4]}</div>
              <div className="text-xs text-gray-600">Expert</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.byLevel[5]}</div>
              <div className="text-xs text-gray-600">Native</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="date">Recently Added</option>
                <option value="alphabetical">A-Z (Japanese)</option>
                <option value="level">Difficulty Level</option>
                <option value="mastery">Mastery</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Level
                </label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Beginner</option>
                  <option value="2">Intermediate</option>
                  <option value="3">Advanced</option>
                  <option value="4">Expert</option>
                  <option value="5">Native</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Tag
                </label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="all">All Tags</option>
                  {getAllTags().map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {searchQuery || filterLevel !== 'all' || filterTag !== 'all' ? (
          <div className="text-sm text-gray-600 mb-4">
            Showing {sortedWords.length} of {stats.total} words
          </div>
        ) : null}

        {/* Dictionary Words */}
        <div className="space-y-3">
          {sortedWords.map((word) => (
            <div
              key={word.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {editingWord === word.id ? (
                /* Edit Mode */
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Japanese
                      </label>
                      <input
                        type="text"
                        value={editForm.japanese}
                        onChange={(e) => setEditForm({...editForm, japanese: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Reading (Hiragana)
                      </label>
                      <input
                        type="text"
                        value={editForm.hiragana}
                        onChange={(e) => setEditForm({...editForm, hiragana: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        English
                      </label>
                      <input
                        type="text"
                        value={editForm.english}
                        onChange={(e) => setEditForm({...editForm, english: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                        placeholder="grammar, verb, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Example Sentence
                      </label>
                      <textarea
                        value={editForm.example}
                        onChange={(e) => setEditForm({...editForm, example: e.target.value})}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Translation
                      </label>
                      <textarea
                        value={editForm.exampleEn}
                        onChange={(e) => setEditForm({...editForm, exampleEn: e.target.value})}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        rows="2"
                        placeholder="Add your personal notes..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold text-gray-900">
                          {word.japanese}
                        </div>
                        <div className="text-lg text-gray-600">{word.hiragana}</div>
                        <span
                          className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getLevelColor(word.level)}`}
                        >
                          {getLevelName(word.level)}
                        </span>
                        {word.reviewData && word.reviewData.interval >= 21 && (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            ✓ Mature
                          </span>
                        )}
                      </div>
                      <div className="text-lg text-gray-800 font-medium mb-2">
                        {word.english}
                      </div>
                      {word.tags && word.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-2">
                          {word.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(word)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpanded(word.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedWord === word.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => removeWord(word.id)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedWord === word.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {word.example && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Example Sentence
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-900 mb-1">{word.example}</p>
                            {word.exampleEn && (
                              <p className="text-gray-600 text-sm">{word.exampleEn}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {word.notes && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Personal Notes
                          </h4>
                          <div className="bg-yellow-50 rounded-lg p-3">
                            <p className="text-gray-800 text-sm">{word.notes}</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">
                            Source
                          </h4>
                          <p className="text-gray-600">{word.source || 'Unknown'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">
                            Date Added
                          </h4>
                          <p className="text-gray-600">
                            {new Date(word.dateAdded).toLocaleDateString()}
                          </p>
                        </div>
                        {word.reviewData && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-1">
                                Review Interval
                              </h4>
                              <p className="text-gray-600">
                                {Math.round(word.reviewData.interval)} days
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-1">
                                Next Review
                              </h4>
                              <p className="text-gray-600">
                                {new Date(word.reviewData.nextReview).toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {sortedWords.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterLevel !== 'all' || filterTag !== 'all'
                ? "No words match your filters"
                : "Your Japanese Dictionary is Empty"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterLevel !== 'all' || filterTag !== 'all'
                ? "Try adjusting your search or filters"
                : "Start clicking on Japanese words in posts to build your personal dictionary!"}
            </p>
            {!(searchQuery || filterLevel !== 'all' || filterTag !== 'all') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Click on any Japanese word in the news
                  feed to see its meaning, pronunciation, and add it to your
                  dictionary for later review.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dictionary
