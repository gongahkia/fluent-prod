import React, { useState } from "react"
import { User, Trash2, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const PrivacyTab = ({ formData, handleInputChange, setShowFollowers, setShowFollowing }) => {
  const { currentUser } = useAuth()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your password")
      return
    }

    setIsDeleting(true)
    setDeleteError("")

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deletePassword
      )

      await reauthenticateWithCredential(currentUser, credential)

      // Delete user data from Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await deleteDoc(userRef)

      // Delete the user account
      await deleteUser(currentUser)

      // User will be logged out automatically
      alert("Your account has been permanently deleted.")
    } catch (error) {
      console.error("Error deleting account:", error)

      if (error.code === 'auth/wrong-password') {
        setDeleteError("Incorrect password. Please try again.")
      } else if (error.code === 'auth/too-many-requests') {
        setDeleteError("Too many failed attempts. Please try again later.")
      } else {
        setDeleteError("Failed to delete account. Please try again.")
      }
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Visibility
        </label>
        <select
          name="profileVisibility"
          value={formData.profileVisibility}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="public">
            Public - Anyone can see your profile
          </option>
          <option value="friends">
            Friends Only - Only friends can see your profile
          </option>
          <option value="private">
            Private - Only you can see your profile
          </option>
        </select>
      </div>

      {/* Social Management */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowFollowers(true)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            Manage Followers
          </button>
          <button
            onClick={() => setShowFollowing(true)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            Manage Following
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={() => setShowDeleteConfirmation(true)}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Delete Account</span>
        </button>
        <p className="text-xs text-gray-500 mt-1">
          This action cannot be undone. All your data will be
          permanently deleted.
        </p>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  setDeletePassword("")
                  setDeleteError("")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ⚠️ Warning: This action is permanent!
                </p>
                <p className="text-sm text-red-700">
                  All your data including:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 ml-4">
                  <li>• Saved posts</li>
                  <li>• Dictionary words</li>
                  <li>• Flashcard progress</li>
                  <li>• Learning statistics</li>
                  <li>• Profile information</li>
                </ul>
                <p className="text-sm text-red-700 mt-2">
                  will be <strong>permanently deleted</strong> and cannot be recovered.
                </p>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                To confirm, please enter your password:
              </p>

              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isDeleting}
              />

              {deleteError && (
                <p className="text-sm text-red-600 mt-2">{deleteError}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  setDeletePassword("")
                  setDeleteError("")
                }}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrivacyTab
