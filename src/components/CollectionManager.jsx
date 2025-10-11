import { Album, BookOpen, Edit2, Plus, Sparkles, Trash2 } from "lucide-react"
import React, { useState } from "react"
import CollectionWordsModal from "./CollectionWordsModal"

const CollectionManager = ({
  collections,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onSelectCollection,
  userDictionary,
  onAddWordToCollection,
  onRemoveWordFromCollection,
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [managingCollectionId, setManagingCollectionId] = useState(null)

  const handleCreate = () => {
    if (!formData.name.trim()) return

    onCreateCollection({
      name: formData.name.trim(),
      description: formData.description.trim(),
      wordIds: [],
    })

    setFormData({ name: "", description: "" })
    setIsCreating(false)
  }

  const handleUpdate = (collectionId) => {
    if (!formData.name.trim()) return

    onUpdateCollection(collectionId, {
      name: formData.name.trim(),
      description: formData.description.trim(),
    })

    setEditingCollection(null)
    setFormData({ name: "", description: "" })
  }

  const handleDelete = (collection) => {
    if (
      confirm(
        `Are you sure you want to delete "${collection.name}"? This will not delete the words from your dictionary.`
      )
    ) {
      onDeleteCollection(collection.id)
    }
  }

  const startEditing = (collection) => {
    setEditingCollection(collection.id)
    setFormData({
      name: collection.name,
      description: collection.description || "",
    })
  }

  const cancelEdit = () => {
    setEditingCollection(null)
    setIsCreating(false)
    setFormData({ name: "", description: "" })
  }

  const getCollectionWordCount = (collection) => {
    return collection.wordIds?.length || 0
  }

  const getDueCardCount = (collection) => {
    // This would be calculated based on flashcard progress
    // For now, returning 0 as placeholder
    return 0
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Flashcard Collections
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Organize your words into custom study collections
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Create Collection Form */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Collection
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., JLPT N3, Travel Words, Verbs"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this collection"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            {editingCollection === collection.id ? (
              /* Edit Mode */
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(collection.id)}
                      disabled={!formData.name.trim()}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {collection.name}
                      </h3>
                      {collection.isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      )}
                    </div>
                    {collection.description && (
                      <p className="text-sm text-gray-600">
                        {collection.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEditing(collection)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit collection"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setManagingCollectionId(collection.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                      title="Manage words"
                    >
                      <Album className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(collection)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{getCollectionWordCount(collection)} words</span>
                  </div>
                </div>

                {/* Study Button */}
                <button
                  onClick={() => onSelectCollection(collection)}
                  disabled={getCollectionWordCount(collection) === 0}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {getCollectionWordCount(collection) === 0
                    ? "No words yet"
                    : "Study Collection"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {collections.length === 0 && !isCreating && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Collections Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first flashcard collection to organize your learning
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Collection</span>
          </button>
        </div>
      )}

      {/* Collection Words Management Modal */}
      {managingCollectionId && (
        <CollectionWordsModal
          collectionId={managingCollectionId}
          collections={collections}
          userDictionary={userDictionary}
          onAddWord={onAddWordToCollection}
          onRemoveWord={onRemoveWordFromCollection}
          onClose={() => setManagingCollectionId(null)}
        />
      )}
    </div>
  )
}

export default CollectionManager
