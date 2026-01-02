import React from 'react'
import { Home, Search, BookOpen, Bookmark, User } from 'lucide-react'

/**
 * Instagram-style bottom navigation bar
 * Shows: Feed, Saved Words, Saved Posts, Profile
 */
const MobileBottomBar = ({ currentView, onNavigate }) => {
  const navItems = [
    {
      id: 'feed',
      label: 'Feed',
      icon: Home,
      activeColor: 'text-orange-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Search,
      activeColor: 'text-orange-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'dictionary',
      label: 'Saved Words',
      icon: BookOpen,
      activeColor: 'text-orange-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'savedposts',
      label: 'Saved Posts',
      icon: Bookmark,
      activeColor: 'text-orange-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      activeColor: 'text-orange-600',
      inactiveColor: 'text-gray-500'
    }
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            currentView === item.id ||
            (item.id === 'dictionary' && currentView === 'flashcards')

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 mb-1 transition-all duration-300 ${
                  isActive ? item.activeColor : item.inactiveColor
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  isActive ? item.activeColor : item.inactiveColor
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomBar
