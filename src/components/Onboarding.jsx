import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Globe, BookOpen, Lightbulb } from 'lucide-react';

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [nativeLanguages, setNativeLanguages] = useState([]);
  const [targetLanguage, setTargetLanguage] = useState('');
  const [translationLevel, setTranslationLevel] = useState(1);

  // Sample posts for the demo
  const japanesePost = {
    original: {
      author: "田中雪",
      location: "渋谷、東京",
      time: "2時間前",
      content: "今日は友達と一緒に新しいラーメン店に行きました。とても美味しかったです！店の雰囲気も素晴らしくて、また行きたいと思います。皆さんにもおすすめします。",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=200&fit=crop"
    },
    translated: {
      author: "Yuki Tanaka",
      location: "Shibuya, Tokyo",
      time: "2 hours ago",
      content: "Today I went to a new ramen shop with my friends. It was very delicious! The atmosphere of the shop was also wonderful, and I want to go again. I recommend it to everyone too.",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=200&fit=crop"
    }
  };

  const spanishPost = {
    original: {
      author: "María García",
      location: "Barcelona, España",
      time: "hace 3 horas",
      content: "Ayer probé un restaurante nuevo en el barrio gótico con mis amigos. ¡La paella estaba increíble! El ambiente era muy acogedor y el servicio excelente. Definitivamente volveré pronto.",
      image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=200&fit=crop"
    },
    translated: {
      author: "María García",
      location: "Barcelona, Spain",
      time: "3 hours ago",
      content: "Yesterday I tried a new restaurant in the gothic quarter with my friends. The paella was incredible! The atmosphere was very cozy and the service excellent. I will definitely return soon.",
      image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=200&fit=crop"
    }
  };

  const getInterpolatedContent = (level, language) => {
    const japaneseWords = [
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
      { jp: "おすすめします", en: "recommend" }
    ];

    const spanishWords = [
      { es: "Ayer", en: "Yesterday" },
      { es: "probé", en: "I tried" },
      { es: "un restaurante", en: "a restaurant" },
      { es: "nuevo", en: "new" },
      { es: "en el barrio gótico", en: "in the gothic quarter" },
      { es: "con mis amigos", en: "with my friends" },
      { es: "La paella", en: "The paella" },
      { es: "estaba increíble", en: "was incredible" },
      { es: "El ambiente", en: "The atmosphere" },
      { es: "era muy acogedor", en: "was very cozy" },
      { es: "y el servicio", en: "and the service" },
      { es: "excelente", en: "excellent" },
      { es: "Definitivamente", en: "Definitely" },
      { es: "volveré pronto", en: "I will return soon" }
    ];

    const words = language === 'Spanish' ? spanishWords : japaneseWords;
    const originalKey = language === 'Spanish' ? 'es' : 'jp';

    let result = "";
    words.forEach((word, index) => {
      const threshold = (index + 1) / words.length * 10; // Convert to 1-10 scale
      if (level >= threshold) {
        result += word.en + " ";
      } else {
        result += word[originalKey] + " ";
      }
    });

    return result.trim();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        nativeLanguages,
        targetLanguage,
        level: 'intermediate'
      });
    }
  };

  const handleLanguageToggle = (language) => {
    setNativeLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep} of 4</span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Native Language Selection */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Globe className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to LivePeek!</h2>
            <p className="text-gray-600 mb-8">Discover authentic content from around the world. We're starting with Japanese and expanding to more languages soon!</p>

            <div className="text-left mb-8">
              <label className="block text-base font-medium text-gray-900 mb-4">
                What's your native language(s)?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['English'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageToggle(lang)}
                    className={`p-3 rounded-md border transition-all ${
                      nativeLanguages.includes(lang)
                        ? 'border-gray-400 bg-gray-50 text-gray-900'
                        : 'border-gray-200 hover:border-gray-300'
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
              className="w-full bg-black hover:bg-gray-800 text-white py-2.5 text-sm font-medium rounded-md transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Target Language Selection */}
        {currentStep === 2 && (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What do you want to learn?</h2>
            <p className="text-gray-600 mb-8">Choose from Japanese and Spanish, with more languages coming soon!</p>

            <div className="text-left mb-8">
              <div className="space-y-3">
                <button
                  onClick={() => setTargetLanguage('Japanese')}
                  className={`w-full p-4 rounded-md border transition-all flex items-center justify-between ${
                    targetLanguage === 'Japanese'
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🇯🇵</span>
                    <div className="text-left">
                      <div className="font-medium">Japanese</div>
                      <div className="text-sm text-gray-500">日本語</div>
                    </div>
                  </div>
                  {targetLanguage === 'Japanese' && (
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setTargetLanguage('Spanish')}
                  className={`w-full p-4 rounded-md border transition-all flex items-center justify-between ${
                    targetLanguage === 'Spanish'
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🇪🇸</span>
                    <div className="text-left">
                      <div className="font-medium">Spanish</div>
                      <div className="text-sm text-gray-500">Español</div>
                    </div>
                  </div>
                  {targetLanguage === 'Spanish' && (
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!targetLanguage}
              className="w-full bg-black hover:bg-gray-800 text-white py-2.5 text-sm font-medium rounded-md transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Interactive Translation Demo */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How LivePeek Works</h2>
            <p className="text-gray-600 mb-8">Slide to control how much translation you need. Try both languages!</p>

            {/* Language Toggle for Demo */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
                <button
                  onClick={() => setTargetLanguage('Japanese')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    targetLanguage === 'Japanese'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🇯🇵 Japanese Demo
                </button>
                <button
                  onClick={() => setTargetLanguage('Spanish')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    targetLanguage === 'Spanish'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🇪🇸 Spanish Demo
                </button>
              </div>
            </div>

            {/* Sample Post */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-6 text-left border border-yellow-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-700">
                    {targetLanguage === 'Spanish' ? 'MG' : 'YT'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {translationLevel > 8
                      ? (targetLanguage === 'Spanish' ? spanishPost.translated.author : japanesePost.translated.author)
                      : (targetLanguage === 'Spanish' ? spanishPost.original.author : japanesePost.original.author)
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    {translationLevel > 8
                      ? (targetLanguage === 'Spanish' ? spanishPost.translated.location : japanesePost.translated.location)
                      : (targetLanguage === 'Spanish' ? spanishPost.original.location : japanesePost.original.location)
                    } • {translationLevel > 8
                      ? (targetLanguage === 'Spanish' ? spanishPost.translated.time : japanesePost.translated.time)
                      : (targetLanguage === 'Spanish' ? spanishPost.original.time : japanesePost.original.time)
                    }
                  </div>
                </div>
              </div>

              <p className="text-gray-800 mb-4 leading-relaxed">
                {translationLevel === 1
                  ? (targetLanguage === 'Spanish' ? spanishPost.original.content : japanesePost.original.content)
                  : translationLevel === 10
                  ? (targetLanguage === 'Spanish' ? spanishPost.translated.content : japanesePost.translated.content)
                  : getInterpolatedContent(translationLevel, targetLanguage)
                }
              </p>

              <img
                src={targetLanguage === 'Spanish' ? spanishPost.original.image : japanesePost.original.image}
                alt={targetLanguage === 'Spanish' ? 'Paella' : 'Ramen'}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            {/* Translation Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Level 1 ({targetLanguage === 'Spanish' ? 'Español' : '日本語'})
                </span>
                <span className="text-sm text-gray-600">Level 10 (English)</span>
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
              className="w-full bg-black hover:bg-gray-800 text-white py-2.5 text-sm font-medium rounded-md transition-colors"
            >
              I understand! <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 4: Disclaimer */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Before We Begin</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Important Notice</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• LivePeek is designed for <strong>intermediate to advanced</strong> language learners</li>
                <li>• We expect you to have a <strong>basic understanding</strong> of your target language</li>
                <li>• For Japanese: You should be comfortable with hiragana and katakana</li>
                <li>• Our content includes authentic, real-world conversations</li>
                <li>• Use translation tools to learn, not as a crutch</li>
                <li>• More languages will be added as we expand our platform</li>
              </ul>
            </div>

            <div className="text-gray-600 mb-8">
              <p>Ready to immerse yourself in authentic content and connect with native speakers worldwide?</p>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-black hover:bg-gray-800 text-white py-2.5 text-sm font-medium rounded-md transition-colors"
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

