import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FluentLogo } from "./FluentLogo";

// Goofy action words for loading states
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
];

/**
 * LoadingScreen Component
 *
 * Full-screen loading screen with animated Fluent logo and orange circular spinner.
 * Displays on app initialization before any content loads.
 *
 * @param {Object} props
 * @param {Function} props.onLoadingComplete - Callback function when loading completes
 * @param {number} props.duration - Duration in milliseconds (default: 3000)
 * @param {boolean} props.showText - Whether to show animated text below spinner (default: false)
 */
export default function LoadingScreen({
  onLoadingComplete,
  duration = 3000,
  showText = false,
}) {
  const [isVisible, setIsVisible] = useState(true);
  // FIXED: Initialize with random word instead of always starting at 0
  const [currentWordIndex, setCurrentWordIndex] = useState(
    Math.floor(Math.random() * goofyLoadingWords.length)
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onLoadingComplete, 500); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onLoadingComplete]);

  // FIXED: Randomize loading words instead of cycling sequentially
  useEffect(() => {
    if (!showText) return;

    const interval = setInterval(() => {
      // Pick a random word that's different from the current one
      setCurrentWordIndex((prev) => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * goofyLoadingWords.length);
        } while (newIndex === prev && goofyLoadingWords.length > 1);
        return newIndex;
      });
    }, 1500); // Change word every 1.5 seconds

    return () => clearInterval(interval);
  }, [showText]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        >
          <div className="flex flex-col items-center space-y-8">
            {/* Fluent Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ width: '250px' }}
            >
              <FluentLogo variant="full" className="w-full h-auto" />
            </motion.div>

            {/* Rotating Orange Spinner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="relative w-12 h-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0"
                >
                  <div className="w-full h-full border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
                </motion.div>
              </div>
            </motion.div>

            {/* Animated Loading Text */}
            {showText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="h-8 flex items-center"
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="text-orange-600 font-medium text-lg"
                  >
                    {goofyLoadingWords[currentWordIndex]}...
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
