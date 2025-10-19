import React from "react"
import { FluentLogo } from "./FluentLogo"

const LoadingSpinner = ({ size = "md", className = "", text = "", showLogo = true }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  }

  const logoSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {showLogo && (
        <div className={`${logoSizes[size]} mb-3 opacity-90`}>
          <FluentLogo variant="short" className="w-full h-full" alt="Loading" />
        </div>
      )}
      <div
        className={`${sizes[size]} border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin`}
      ></div>
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  )
}

export default LoadingSpinner
