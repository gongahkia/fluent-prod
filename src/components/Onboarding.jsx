import { BookOpen, ChevronRight, Globe, Lightbulb } from "lucide-react"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [nativeLanguages, setNativeLanguages] = useState([])
  const [targetLanguage, setTargetLanguage] = useState("")
  const [translationLevel, setTranslationLevel] = useState(1)

  // Sample Japanese post for the demo
  const originalPost = {
    author: "田中雪",
    location: "渋谷、東京",
    time: "2時間前",
    content:
      "今日は友達と一緒に新しいラーメン店に行きました。とても美味しかったです！店の雰囲気も素晴らしくて、また行きたいと思います。皆さんにもおすすめします。",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=200&fit=crop",
  }

  const translatedPost = {
    author: "Yuki Tanaka",
    location: "Shibuya, Tokyo",
    time: "2 hours ago",
    content:
      "Today I went to a new ramen shop with my friends. It was very delicious! The atmosphere of the shop was also wonderful, and I want to go again. I recommend it to everyone too.",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=200&fit=crop",
  }

  const getInterpolatedContent = (level) => {
    const words = [
      { jp: "今日は", en: "Today" },
      { jp: "友達と", en: "with friends" },
      { jp: "一緒に", en: "together" },
      { jp: "新しい", en: "new" },
      { jp: "ラーメン店に", en: "ramen shop" },
      { jp: "行きました", en: "went to" },
      { jp: "とても", en: "very" },
      { jp: "美味しかったです", en: "delicious" },
      { jp: "店の", en: "shop's" },
      { jp: "雰囲気も", en: "atmosphere" },
      { jp: "素晴らしくて", en: "wonderful" },
      { jp: "また", en: "again" },
      { jp: "行きたいと思います", en: "want to go" },
      { jp: "皆さんにも", en: "to everyone" },
      { jp: "おすすめします", en: "recommend" },
    ]

    let result = ""
    words.forEach((word, index) => {
      const threshold = ((index + 1) / words.length) * 10 // Convert to 1-10 scale
      if (level >= threshold) {
        result += word.en + " "
      } else {
        result += word.jp + " "
      }
    })

    return result.trim()
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete({
        nativeLanguages,
        targetLanguage,
        level: "intermediate",
      })
    }
  }

  const handleLanguageToggle = (language) => {
    setNativeLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of 4
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / 4) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Native Language Selection */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to LivePeek!
            </h2>
            <p className="text-gray-600 mb-8">
              Discover authentic content from around the world. We're starting
              with Japanese and expanding to more languages soon!
            </p>

            <div className="text-left mb-8">
              <label className="block text-lg font-medium text-gray-900 mb-4">
                What's your native language(s)?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["English"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageToggle(lang)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      nativeLanguages.includes(lang)
                        ? "border-gray-900 bg-gray-100 text-gray-900"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={nativeLanguages.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Target Language Selection */}
        {currentStep === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What do you want to learn?
            </h2>
            <p className="text-gray-600 mb-8">
              We're launching with Japanese first, with more languages coming
              soon!
            </p>

            <div className="text-left mb-8">
              <div className="space-y-3">
                <button
                  onClick={() => setTargetLanguage("Japanese")}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    targetLanguage === "Japanese"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🇯🇵</span>
                    <div className="text-left">
                      <div className="font-medium">Japanese</div>
                      <div className="text-sm text-gray-500">日本語</div>
                    </div>
                  </div>
                  {targetLanguage === "Japanese" && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!targetLanguage}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Interactive Translation Demo */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How LivePeek Works
            </h2>
            <p className="text-gray-600 mb-8">
              Slide to control how much translation you need. Stop when you
              understand!
            </p>

            {/* Sample Post */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-6 text-left border border-yellow-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-700">
                    YT
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {translationLevel > 8
                      ? translatedPost.author
                      : originalPost.author}
                  </div>
                  <div className="text-sm text-gray-500">
                    {translationLevel > 8
                      ? translatedPost.location
                      : originalPost.location}{" "}
                    •{" "}
                    {translationLevel > 8
                      ? translatedPost.time
                      : originalPost.time}
                  </div>
                </div>
              </div>

              <p className="text-gray-800 mb-4 leading-relaxed">
                {translationLevel === 1
                  ? originalPost.content
                  : translationLevel === 10
                    ? translatedPost.content
                    : getInterpolatedContent(translationLevel)}
              </p>

              <img
                src={originalPost.image}
                alt="Ramen"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            {/* Translation Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Level 1 (Japanese)
                </span>
                <span className="text-sm text-gray-600">
                  Level 10 (English)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={translationLevel}
                onChange={(e) => setTranslationLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-center mt-2">
                <span className="text-sm text-gray-500">
                  Current Level: {translationLevel}
                </span>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              I understand! <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 4: Disclaimer */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Before We Begin
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">
                Important Notice
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>
                  • LivePeek is designed for{" "}
                  <strong>intermediate to advanced</strong> language learners
                </li>
                <li>
                  • We expect you to have a <strong>basic understanding</strong>{" "}
                  of your target language
                </li>
                <li>
                  • For Japanese: You should be comfortable with hiragana and
                  katakana
                </li>
                <li>
                  • Our content includes authentic, real-world conversations
                </li>
                <li>• Use translation tools to learn, not as a crutch</li>
                <li>
                  • More languages will be added as we expand our platform
                </li>
              </ul>
            </div>

            <div className="text-gray-600 mb-8">
              <p>
                Ready to immerse yourself in authentic content and connect with
                native speakers worldwide?
              </p>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Start Learning! <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Onboarding
