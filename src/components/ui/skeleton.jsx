import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gray-200 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

/**
 * Skeleton for a feed post card
 */
function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton for dictionary item
 */
function DictionaryItemSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Grid of post skeletons for feed loading
 */
function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * List of dictionary item skeletons
 */
function DictionaryListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <DictionaryItemSkeleton key={i} />
      ))}
    </div>
  )
}

export { Skeleton, PostSkeleton, DictionaryItemSkeleton, FeedSkeleton, DictionaryListSkeleton }
