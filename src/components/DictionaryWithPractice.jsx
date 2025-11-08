import React, { useState } from "react"
import Dictionary from "./Dictionary"
import Flashcards from "./Flashcards"

/**
 * Container for Dictionary and Flashcards with direct switching
 * No tabs - switching happens via button in Dictionary header
 */
const DictionaryWithPractice = ({ userDictionary, onRemoveWord, userProfile }) => {
  const [showPractice, setShowPractice] = useState(false)

  if (showPractice) {
    return (
      <Flashcards
        userDictionary={userDictionary}
        userProfile={userProfile}
        onBack={() => setShowPractice(false)}
      />
    )
  }

  return (
    <Dictionary
      userDictionary={userDictionary}
      onRemoveWord={onRemoveWord}
      userProfile={userProfile}
      onOpenPractice={() => setShowPractice(true)}
    />
  )
}

export default DictionaryWithPractice
