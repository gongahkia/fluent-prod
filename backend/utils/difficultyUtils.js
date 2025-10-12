/**
 * Difficulty Calculation Utilities
 * Shared utilities for calculating reading difficulty of English text
 */

import { syllable } from 'syllable'

/**
 * Calculate English text difficulty using Flesch Reading Ease Score
 * NOTE: This should receive PLAINTEXT ONLY (no markdown, no images)
 * @param {string} text - Plain text to analyze
 * @returns {number} Difficulty level (1-5)
 *   1 = Beginner (Very easy to read)
 *   2 = Elementary (Easy to read)
 *   3 = Intermediate (Fairly easy to read)
 *   4 = Advanced (Difficult to read)
 *   5 = Expert (Very difficult to read)
 */
export function calculateEnglishDifficulty(text) {
  if (!text || text.trim().length === 0) {
    return 1 // Default to easiest for empty text
  }

  // Basic text cleaning
  const cleanText = text.replace(/[^\w\s.!?]/g, ' ').trim()

  // Split into sentences (simple approach)
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length || 1

  // Split into words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  if (wordCount === 0) {
    return 1
  }

  // Calculate metrics
  const avgSentenceLength = wordCount / sentenceCount

  // Calculate syllable count
  let totalSyllables = 0
  try {
    totalSyllables = syllable(cleanText)
  } catch (error) {
    // Fallback: estimate syllables as word count * 1.5
    totalSyllables = Math.round(wordCount * 1.5)
  }

  const avgSyllablesPerWord = totalSyllables / wordCount

  // Flesch Reading Ease Score
  // Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)

  // Calculate difficulty level (1-5) based on Flesch score
  // Flesch: 90-100 = Very Easy, 60-70 = Standard, 30-50 = Difficult, 0-30 = Very Difficult
  let difficulty
  if (fleschScore >= 80) {
    difficulty = 1 // Beginner: Very easy to read
  } else if (fleschScore >= 60) {
    difficulty = 2 // Elementary: Easy to read
  } else if (fleschScore >= 50) {
    difficulty = 3 // Intermediate: Fairly easy to read
  } else if (fleschScore >= 30) {
    difficulty = 4 // Advanced: Difficult to read
  } else {
    difficulty = 5 // Expert: Very difficult to read
  }

  // Adjust for very short texts (less than 30 words)
  if (wordCount < 30) {
    difficulty = Math.max(1, difficulty - 1)
  }

  // Adjust for very long texts (more than 300 words)
  if (wordCount > 300) {
    difficulty = Math.min(5, difficulty + 1)
  }

  return difficulty
}

/**
 * Get text statistics for a given text
 * @param {string} text - Text to analyze
 * @returns {Object} Statistics object
 */
export function getTextStatistics(text) {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      syllableCount: 0,
      fleschScore: 0,
      difficulty: 1
    }
  }

  const cleanText = text.replace(/[^\w\s.!?]/g, ' ').trim()
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length || 1
  const words = cleanText.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  if (wordCount === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      syllableCount: 0,
      fleschScore: 0,
      difficulty: 1
    }
  }

  const avgSentenceLength = wordCount / sentenceCount
  const avgWordLength = cleanText.replace(/\s/g, '').length / wordCount

  let totalSyllables = 0
  try {
    totalSyllables = syllable(cleanText)
  } catch (error) {
    totalSyllables = Math.round(wordCount * 1.5)
  }

  const avgSyllablesPerWord = totalSyllables / wordCount
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  const difficulty = calculateEnglishDifficulty(text)

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength: avgSentenceLength.toFixed(2),
    avgWordLength: avgWordLength.toFixed(2),
    syllableCount: totalSyllables,
    avgSyllablesPerWord: avgSyllablesPerWord.toFixed(2),
    fleschScore: fleschScore.toFixed(2),
    difficulty
  }
}

export default {
  calculateEnglishDifficulty,
  getTextStatistics
}
