import { BookOpen, ChevronRight, Globe, Lightbulb, Target, Palette } from "lucide-react"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [nativeLanguages, setNativeLanguages] = useState([])
  const [targetLanguage, setTargetLanguage] = useState("")
  const [translationLevel, setTranslationLevel] = useState(1)

  // New customization preferences
  const [dailyWordGoal, setDailyWordGoal] = useState(10)
  const [dailyReadingGoal, setDailyReadingGoal] = useState(5)
  const [accentColor, setAccentColor] = useState("orange")
  const [studyReminder, setStudyReminder] = useState(true)

  // Map 1-5 slider to level names
  const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native']
  const getLevelName = (level) => {
    return levelNames[level - 1] || 'Beginner'
  }

  // Sample Japanese post for the demo
  const originalJapanesePost = {
    author: "田中雪",
    location: "渋谷、東京",
    time: "2時間前",
    content:
      "今日は友達と一緒に新しいラーメン店に行きました。とても美味しかったです！店の雰囲気も素晴らしくて、また行きたいと思います。皆さんにもおすすめします。",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=200&fit=crop",
  }

  const translatedJapanesePost = {
    author: "Yuki Tanaka",
    location: "Shibuya, Tokyo",
    time: "2 hours ago",
    content:
      "Today I went to a new ramen shop with my friends. It was very delicious! The atmosphere of the shop was also wonderful, and I want to go again. I recommend it to everyone too.",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=200&fit=crop",
  }

  // Sample Korean post for the demo
  const originalKoreanPost = {
    author: "김민지",
    location: "강남, 서울",
    time: "2시간 전",
    content:
      "오늘 친구들과 새로운 카페에 갔어요. 정말 맛있었어요! 카페 분위기도 너무 좋아서 다시 가고 싶어요. 여러분께도 추천해요.",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=200&fit=crop",
  }

  const translatedKoreanPost = {
    author: "Minji Kim",
    location: "Gangnam, Seoul",
    time: "2 hours ago",
    content:
      "Today I went to a new cafe with my friends. It was really delicious! The cafe atmosphere was also very nice, so I want to go again. I recommend it to you all too.",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=200&fit=crop",
  }

  const getInterpolatedJapaneseContent = (level) => {
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
      const threshold = ((index + 1) / words.length) * 5 // Convert to 1-5 scale
      if (level >= threshold) {
        result += word.en + " "
      } else {
        result += word.jp + " "
      }
    })

    return result.trim()
  }

  const getInterpolatedKoreanContent = (level) => {
    const words = [
      { kr: "오늘", en: "Today" },
      { kr: "친구들과", en: "with friends" },
      { kr: "새로운", en: "new" },
      { kr: "카페에", en: "cafe" },
      { kr: "갔어요", en: "went to" },
      { kr: "정말", en: "really" },
      { kr: "맛있었어요", en: "delicious" },
      { kr: "카페", en: "cafe" },
      { kr: "분위기도", en: "atmosphere" },
      { kr: "너무", en: "very" },
      { kr: "좋아서", en: "nice" },
      { kr: "다시", en: "again" },
      { kr: "가고 싶어요", en: "want to go" },
      { kr: "여러분께도", en: "to you all" },
      { kr: "추천해요", en: "recommend" },
    ]

    let result = ""
    words.forEach((word, index) => {
      const threshold = ((index + 1) / words.length) * 5 // Convert to 1-5 scale
      if (level >= threshold) {
        result += word.en + " "
      } else {
        result += word.kr + " "
      }
    })

    return result.trim()
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete({
        nativeLanguages,
        targetLanguage,
        level: translationLevel,
        levelName: getLevelName(translationLevel),
        dailyWordGoal,
        dailyReadingGoal,
        accentColor,
        studyReminder,
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
              Step {currentStep} of 5
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / 5) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
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
              Welcome to Fluent!
            </h2>
            <p className="text-gray-600 mb-8">
              Discover authentic content from around the world. Start with
              Japanese or Korean!
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
              Choose your target language to start learning!
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

                <button
                  onClick={() => setTargetLanguage("Korean")}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    targetLanguage === "Korean"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🇰🇷</span>
                    <div className="text-left">
                      <div className="font-medium">Korean</div>
                      <div className="text-sm text-gray-500">한국어</div>
                    </div>
                  </div>
                  {targetLanguage === "Korean" && (
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
              How Fluent Works
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
                    {targetLanguage === "Korean" ? "MK" : "YT"}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {targetLanguage === "Korean"
                      ? translationLevel >= 4
                        ? translatedKoreanPost.author
                        : originalKoreanPost.author
                      : translationLevel >= 4
                        ? translatedJapanesePost.author
                        : originalJapanesePost.author}
                  </div>
                  <div className="text-sm text-gray-500">
                    {targetLanguage === "Korean"
                      ? translationLevel >= 4
                        ? translatedKoreanPost.location
                        : originalKoreanPost.location
                      : translationLevel >= 4
                        ? translatedJapanesePost.location
                        : originalJapanesePost.location}{" "}
                    •{" "}
                    {targetLanguage === "Korean"
                      ? translationLevel >= 4
                        ? translatedKoreanPost.time
                        : originalKoreanPost.time
                      : translationLevel >= 4
                        ? translatedJapanesePost.time
                        : originalJapanesePost.time}
                  </div>
                </div>
              </div>

              <p className="text-gray-800 mb-4 leading-relaxed">
                {targetLanguage === "Korean"
                  ? translationLevel === 1
                    ? originalKoreanPost.content
                    : translationLevel === 5
                      ? translatedKoreanPost.content
                      : getInterpolatedKoreanContent(translationLevel)
                  : translationLevel === 1
                    ? originalJapanesePost.content
                    : translationLevel === 5
                      ? translatedJapanesePost.content
                      : getInterpolatedJapaneseContent(translationLevel)}
              </p>

              <img
                src={targetLanguage === "Korean" ? originalKoreanPost.image : originalJapanesePost.image}
                alt={targetLanguage === "Korean" ? "Cafe" : "Ramen"}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            {/* Translation Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Beginner ({targetLanguage === "Korean" ? "Korean" : "Japanese"})
                </span>
                <span className="text-sm text-gray-600">
                  Native (English)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={translationLevel}
                onChange={(e) => setTranslationLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-center mt-2">
                <span className="text-sm font-medium text-gray-700">
                  {getLevelName(translationLevel)}
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

        {/* Step 4: Customization */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Customize Your Experience
            </h2>
            <p className="text-gray-600 mb-8">
              Set your learning goals and personalize the app to suit your style
            </p>

            <div className="text-left space-y-6">
              {/* Daily Word Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Daily Word Goal
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={dailyWordGoal}
                    onChange={(e) => setDailyWordGoal(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                    {dailyWordGoal}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Learn {dailyWordGoal} new words every day
                </p>
              </div>

              {/* Daily Reading Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Daily Reading Goal (Posts)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={dailyReadingGoal}
                    onChange={(e) => setDailyReadingGoal(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                    {dailyReadingGoal}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Read {dailyReadingGoal} posts every day
                </p>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Choose Your Accent Color
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { name: 'orange', color: 'bg-orange-500' },
                    { name: 'blue', color: 'bg-blue-500' },
                    { name: 'green', color: 'bg-green-500' },
                    { name: 'purple', color: 'bg-purple-500' }
                  ].map(({ name, color }) => (
                    <button
                      key={name}
                      onClick={() => setAccentColor(name)}
                      className={`h-12 ${color} rounded-lg border-2 transition-all ${
                        accentColor === name ? 'border-gray-900 scale-105' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Study Reminder */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Enable Study Reminders
                  </h3>
                  <p className="text-sm text-gray-500">
                    Get daily notifications to stay on track
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studyReminder}
                    onChange={(e) => setStudyReminder(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full mt-8 bg-orange-500 hover:bg-orange-600"
            >
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 5: Disclaimer */}
        {currentStep === 5 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Before We Begin
            </h2>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-4 text-left">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center space-x-2">
                <span>🚧 Beta Testing Notice</span>
              </h3>
              <ul className="space-y-2 text-orange-800 text-sm">
                <li>
                  • Fluent is currently in <strong>beta testing</strong>
                </li>
                <li>
                  • You may encounter bugs or incomplete features
                </li>
                <li>
                  • Your feedback helps us improve the platform
                </li>
                <li>
                  • Features and UI may change as we iterate
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">
                Important Notice
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>
                  • Fluent is designed for{" "}
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
                  • For Korean: You should be comfortable with hangul
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
