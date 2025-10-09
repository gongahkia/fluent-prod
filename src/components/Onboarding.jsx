import {
  BookOpen,
  ChevronRight,
  Globe,
  Lightbulb,
  Target,
  Palette,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [nativeLanguages, setNativeLanguages] = useState([]);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translationLevel, setTranslationLevel] = useState(1);

  // ADD THIS MISSING STATE VARIABLE
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // New customization preferences
  const [dailyWordGoal, setDailyWordGoal] = useState(10);
  const [dailyReadingGoal, setDailyReadingGoal] = useState(5);
  const [accentColor, setAccentColor] = useState("orange");
  const [studyReminder, setStudyReminder] = useState(true);

  const japanesePostLevels = [
    {
      level: 1,
      name: "Beginner",
      author: "Yuki Tanaka",
      location: "Tokyo, Japan",
      time: "2 hours ago",
      content:
        "I went to the スーパー today. I bought りんご and パン. The store clerk was very friendly.",
      image:
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=200&fit=crop", // Japanese grocery store with fruits
    },
    {
      level: 2,
      name: "Elementary",
      author: "Yuki Tanaka",
      location: "Tokyo, Japan",
      time: "2 hours ago",
      content:
        "This morning, I visited a カフェ near my house. I ordered コーヒー and ケーキ. The atmosphere was nice, and I talked with my 友達.",
      image:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=200&fit=crop", // Cozy cafe interior
    },
    {
      level: 3,
      name: "Intermediate",
      author: "Yuki Tanaka",
      location: "Tokyo, Japan",
      time: "2 hours ago",
      content:
        "On Sunday, I went to the 公園 with my 家族. We saw many さくらの花 and took pictures. My おかあさん made お弁当, and we ate together under the 木. It was a たのしい day.",
      image:
        "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=200&fit=crop", // Cherry blossom park picnic
    },
    {
      level: 4,
      name: "Advanced",
      author: "Yuki Tanaka",
      location: "Tokyo, Japan",
      time: "2 hours ago",
      content:
        "Last week, I attended a にほんごの勉強会 at the 図書館. The せんせい explained ぶんぽう and はつおん in detail. After the lesson, I discussed にほんぶんか and れきし with other さんかしゃ. It was very おもしろかった.",
      image:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop", // Library study group
    },
    {
      level: 5,
      name: "Expert",
      author: "Yuki Tanaka",
      location: "Tokyo, Japan",
      time: "2 hours ago",
      content:
        "さいきん、わたしは現代日本文学に興味があります。村上春樹の小説を読んでいますが、彼の独特な表現や深い意味を理解するのは難しいです。 Last week, I joined a 読書会 and we discussed the book's テーマ and 象徴.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop", // Books and reading
    },
  ];

  const koreanPostLevels = [
    {
      level: 1,
      name: "Beginner",
      author: "Minji Kim",
      location: "Seoul, South Korea",
      time: "2 hours ago",
      content:
        "I went to the 마트 today. I bought 사과 and 빵. The store clerk was very friendly.",
      image:
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=200&fit=crop", // Modern mart/supermarket
    },
    {
      level: 2,
      name: "Elementary",
      author: "Minji Kim",
      location: "Seoul, South Korea",
      time: "2 hours ago",
      content:
        "This morning, I visited a 카페 near my house. I ordered 커피 and 케이크. The atmosphere was nice, and I talked with my 친구.",
      image:
        "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&h=200&fit=crop", // Korean style cafe
    },
    {
      level: 3,
      name: "Intermediate",
      author: "Minji Kim",
      location: "Seoul, South Korea",
      time: "2 hours ago",
      content:
        "On Sunday, I went to the 공원 with my 가족. We saw many 벚꽃 and took pictures. My 어머니 made 도시락, and we ate together under the 나무. It was a 즐거운 day.",
      image:
        "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=200&fit=crop", // Cherry blossom park
    },
    {
      level: 4,
      name: "Advanced",
      author: "Minji Kim",
      location: "Seoul, South Korea",
      time: "2 hours ago",
      content:
        "Last week, I attended a 한국어 공부 모임 at the 도서관. The 선생님 explained 문법 and 발음 in detail. After the lesson, I discussed 한국 문화 and 역사 with other 참가자들. It was very 재미있었습니다.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop", // Library/study environment
    },
    {
      level: 5,
      name: "Expert",
      author: "Minji Kim",
      location: "Seoul, South Korea",
      time: "2 hours ago",
      content:
        "최근에 저는 현대 한국 문학에 관심이 있습니다. 한강의 소설을 읽고 있는데, 그녀의 독특한 표현과 깊은 의미를 이해하는 것이 어렵습니다. Last week, I joined a 독서 모임 and we discussed the book's 주제 and 상징.",
      image:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop", // Korean books/literature
    },
  ];

  const getCurrentPostLevels = () => {
    return targetLanguage === "Korean" ? koreanPostLevels : japanesePostLevels;
  };

  const goToPrevious = () => {
    const postLevels = getCurrentPostLevels();
    setCurrentCarouselIndex((prev) =>
      prev === 0 ? postLevels.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    const postLevels = getCurrentPostLevels();
    setCurrentCarouselIndex((prev) =>
      prev === postLevels.length - 1 ? 0 : prev + 1
    );
  };

  const selectLevel = (level) => {
    setTranslationLevel(level);
    handleNext();
  };

  // FIXED: Update level names to match the posts
  const levelNames = [
    "Beginner",
    "Elementary", // Changed from "Intermediate"
    "Intermediate", // Changed from "Advanced"
    "Advanced", // Changed from "Expert"
    "Expert", // Changed from "Native"
  ];
  const getLevelName = (level) => {
    return levelNames[level - 1] || "Beginner";
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
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
      });
    }
  };

  const handleLanguageToggle = (language) => {
    setNativeLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

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

        {/* Step 3: Interactive Translation Demo - FIXED */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Find Your Level
            </h2>
            <p className="text-gray-600 mb-8">
              Swipe through these posts and select the version you understand
              best!
            </p>

            <div className="relative mb-6">
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="overflow-hidden rounded-lg mx-8">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${currentCarouselIndex * 100}%)`,
                  }}
                >
                  {/* FIXED: Use getCurrentPostLevels() instead of japanesePostLevels */}
                  {getCurrentPostLevels().map((post) => (
                    <div
                      key={post.level}
                      className="w-full flex-shrink-0 bg-yellow-50 rounded-lg p-6 border border-yellow-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Level {post.level}: {post.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {/* FIXED: Use getCurrentPostLevels() */}
                          {post.level} of {getCurrentPostLevels().length}
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-700">
                              {/* FIXED: Dynamic initials */}
                              {targetLanguage === "Korean" ? "MK" : "YT"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {post.author}
                            </div>
                            <div className="text-sm text-gray-500">
                              {post.location} • {post.time}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-800 mb-4 leading-relaxed min-h-[80px] whitespace-pre-line">
                          {post.content}
                        </p>

                        <img
                          src={post.image}
                          alt="Post"
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />

                        <Button
                          onClick={() => selectLevel(post.level)}
                          className="w-full bg-orange-500 hover:bg-orange-600"
                        >
                          Select This Level ({post.name})
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-2 mb-6">
              {/* FIXED: Use getCurrentPostLevels() for dots */}
              {getCurrentPostLevels().map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCarouselIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentCarouselIndex === index
                      ? "bg-orange-500"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleNext}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                I'll set this later
              </button>
            </div>
          </div>
        )}

        {/* Keep your existing Step 4 and 5 code here */}
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
                    onChange={(e) =>
                      setDailyReadingGoal(parseInt(e.target.value))
                    }
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
                    { name: "orange", color: "bg-orange-500" },
                    { name: "blue", color: "bg-blue-500" },
                    { name: "green", color: "bg-green-500" },
                    { name: "purple", color: "bg-purple-500" },
                  ].map(({ name, color }) => (
                    <button
                      key={name}
                      onClick={() => setAccentColor(name)}
                      className={`h-12 ${color} rounded-lg border-2 transition-all ${
                        accentColor === name
                          ? "border-gray-900 scale-105"
                          : "border-transparent"
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
                <li>• You may encounter bugs or incomplete features</li>
                <li>• Your feedback helps us improve the platform</li>
                <li>• Features and UI may change as we iterate</li>
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
                <li>• For Korean: You should be comfortable with hangul</li>
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
  );
};

export default Onboarding;
