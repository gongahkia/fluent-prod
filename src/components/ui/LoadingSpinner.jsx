import React, { useState, useEffect } from "react"
import { FluentLogo } from "./FluentLogo"

const goofyLoadingWords = [
  "skedaddling",
  "doodling",
  "ideating",
  "summoning",
  "wrangling",
  "herding",
  "sprinkling",
  "canvasing",
  "decoding",
  "brewing",
  "juggling",
  "untangling",
  "polishing",
  "waxing",
  "marinating",
  "whisking",
  "seasoning",
  "kneading",
  "stirring",
  "stretching",
  "bamboozling",
  "flummoxing",
  "befuddling",
  "concocting",
  "muddling",
  "scrambling",
  "ricocheting",
  "careening",
  "careening",
  "gallivanting",
  "cavorting",
  "zigzagging",
  "wobbling",
  "sizzling",
  "cracking",
  "splattering",
  "simmering",
  "scorching",
  "whirling",
  "twirling",
  "swirling",
  "swirling",
  "percolating",
  "perking",
  "perking",
  "percolating",
  "combusting",
  "exploding",
  "rocketing",
  "catapulting",
  "jettisoning",
];

const LoadingSpinner = ({ size = "md", className = "", text = "", showLogo = true, showRandomWords = false }) => {
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

  // Initialize with random word
  const [currentWordIndex, setCurrentWordIndex] = useState(
    Math.floor(Math.random() * goofyLoadingWords.length)
  )

  // Randomize loading words every 1.5 seconds
  useEffect(() => {
    if (!showRandomWords) return

    const interval = setInterval(() => {
      // Pick a random word that's different from the current one
      setCurrentWordIndex((prev) => {
        let newIndex
        do {
          newIndex = Math.floor(Math.random() * goofyLoadingWords.length)
        } while (newIndex === prev && goofyLoadingWords.length > 1)
        return newIndex
      })
    }, 1500) // Change word every 1.5 seconds

    return () => clearInterval(interval)
  }, [showRandomWords])

  // Determine what text to display
  const displayText = showRandomWords
    ? `${goofyLoadingWords[currentWordIndex]}...`
    : text

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
      {displayText && (
        <p className="mt-2 text-sm text-gray-600 transition-opacity duration-300">
          {displayText}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner
