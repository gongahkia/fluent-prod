import React, { useState } from 'react'
import { X, Share2, Copy, Flag, EyeOff, Check } from 'lucide-react'
import Toast from './ui/Toast'

/**
 * PostSettingsModal - Modal for post actions and sharing
 * Opens when clicking the 3-dot menu on a post
 */
const PostSettingsModal = ({ post, onClose, onNotInterested, onReport }) => {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showFeedback = (message) => {
    setToastMessage(message)
    setShowToast(true)
  }

  const handleCopyText = async () => {
    const textToCopy = `${post.title}\n\n${post.content || ''}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      showFeedback('Text copied to clipboard!')
      setTimeout(() => onClose(), 1000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      showFeedback('Failed to copy text')
    }
  }

  const handleCopyLink = async () => {
    const linkToCopy = post.externalUrl || post.url || window.location.href
    try {
      await navigator.clipboard.writeText(linkToCopy)
      showFeedback('Link copied to clipboard!')
      setTimeout(() => onClose(), 1000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      showFeedback('Failed to copy link')
    }
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(post.title)
    const url = encodeURIComponent(post.externalUrl || post.url || window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400')
    onClose()
  }

  const handleShareFacebook = () => {
    const url = encodeURIComponent(post.externalUrl || post.url || window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400')
    onClose()
  }

  const handleShareReddit = () => {
    const title = encodeURIComponent(post.title)
    const url = encodeURIComponent(post.externalUrl || post.url || window.location.href)
    window.open(`https://reddit.com/submit?title=${title}&url=${url}`, '_blank', 'width=600,height=600')
    onClose()
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${post.title}\n${post.externalUrl || post.url || window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    onClose()
  }

  const handleNotInterested = () => {
    onNotInterested(post.id)
    showFeedback('Post hidden')
    setTimeout(() => onClose(), 800)
  }

  const handleReport = () => {
    if (onReport) {
      onReport(post.id)
      showFeedback('Post reported. Thank you for your feedback.')
      setTimeout(() => onClose(), 1500)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Post Options</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Quick Share Actions Row */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">Quick Share</p>
              <div className="flex items-center justify-around gap-2">
                {/* Twitter/X */}
                <button
                  onClick={handleShareTwitter}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share on Twitter/X"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-xs text-gray-600">Twitter</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={handleShareFacebook}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share on Facebook"
                >
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs text-gray-600">Facebook</span>
                </button>

                {/* Reddit */}
                <button
                  onClick={handleShareReddit}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share on Reddit"
                >
                  <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                  <span className="text-xs text-gray-600">Reddit</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share on WhatsApp"
                >
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-xs text-gray-600">WhatsApp</span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Copy</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4" />

            {/* Action Items */}
            <div className="space-y-1">
              {/* Copy Text */}
              <button
                onClick={handleCopyText}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Copy className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Copy text</span>
              </button>

              {/* Not Interested */}
              <button
                onClick={handleNotInterested}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <EyeOff className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Not interested</span>
              </button>

              {/* Report Post */}
              <button
                onClick={handleReport}
                className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-left"
              >
                <Flag className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Report post</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {showToast && (
        <Toast
          message={toastMessage}
          icon=""
          onClose={() => setShowToast(false)}
          duration={2000}
        />
      )}
    </>
  )
}

export default PostSettingsModal
