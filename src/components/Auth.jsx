import { Check, Eye, EyeOff, Globe, Lock, Mail, User } from "lucide-react"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { registerWithEmail, signInWithEmail, signInWithGoogle } from "@/services/authService"
import { FluentLogo } from "@/components/ui/FluentLogo"
import GuestWarning from "./GuestWarning"
import { useAuth } from "@/contexts/AuthContext"

const Auth = ({ onAuthComplete }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showTOS, setShowTOS] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [hasScrolledTOS, setHasScrolledTOS] = useState(false)
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [showGuestWarning, setShowGuestWarning] = useState(false)
  const { signInAsGuest } = useAuth()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleGuestContinue = () => {
    signInAsGuest()
    onAuthComplete({ isGuest: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      let result

      if (isLogin) {
        // Sign in existing user
        result = await signInWithEmail(formData.email, formData.password)
      } else {
        // Register new user
        result = await registerWithEmail(formData.email, formData.password, formData.name)
      }

      if (result.success) {
        // For new users, show email confirmation popup
        if (!isLogin && result.isNewUser) {
          setConfirmationEmail(formData.email)
          setShowEmailConfirmation(true)
          setIsLoading(false)
          return
        }
        
        onAuthComplete({
          email: result.user.email,
          name: result.user.displayName || formData.name || result.user.email.split("@")[0],
          isNewUser: result.isNewUser,
        })
      } else {
        setError(result.error || "Authentication failed. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Auth error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")

    try {
      const result = await signInWithGoogle()

      if (result.success) {
        onAuthComplete({
          email: result.user.email,
          name: result.user.displayName || result.user.email.split("@")[0],
          isNewUser: result.isNewUser,
        })
      } else {
        setError(result.error || "Google sign-in failed. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred with Google sign-in.")
      console.error("Google sign-in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    })
    setAgreedToTerms(false)
    setHasScrolledTOS(false)
    setHasScrolledPrivacy(false)
  }

  const handleScroll = (e, type) => {
    const element = e.target
    const isScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10

    if (isScrolledToBottom) {
      if (type === 'tos') {
        setHasScrolledTOS(true)
      } else if (type === 'privacy') {
        setHasScrolledPrivacy(true)
      }
    }
  }

  const handleAcceptTOS = () => {
    setShowTOS(false)
    if (hasScrolledPrivacy) {
      setAgreedToTerms(true)
    }
  }

  const handleAcceptPrivacy = () => {
    setShowPrivacy(false)
    if (hasScrolledTOS) {
      setAgreedToTerms(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-auto mx-auto mb-4">
            <FluentLogo variant="full" className="w-full h-auto" alt="Fluent Logo" />
          </div>
          <p className="text-gray-600 mt-4">
            {isLogin ? "Welcome back!" : "Start your language learning journey"}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-gray-600 text-sm">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Join thousands of language learners worldwide"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Registration only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Registration only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Terms and Conditions (Registration only) */}
            {!isLogin && (
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-400"
                  required
                  disabled={!hasScrolledTOS || !hasScrolledPrivacy}
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTOS(true)}
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    Privacy Policy
                  </button>
                  {(!hasScrolledTOS || !hasScrolledPrivacy) && (
                    <span className="block text-xs text-orange-600 mt-1">
                      Please read and scroll through both documents to continue
                    </span>
                  )}
                </label>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-base font-medium"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </span>
                </div>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Social Login Options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                disabled
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed"
                title="Google sign-in coming soon"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Google (Soon)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGuestWarning(true)}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <User className="w-5 h-5 mr-2 text-gray-500" />
                Continue as Guest
              </button>
            </div>
          </div>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer (Sign In only) */}
        {isLogin && (
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>
              By continuing, you agree to our{" "}
              <button
                type="button"
                onClick={() => setShowTOS(true)}
                className="text-orange-600 hover:text-orange-700 underline"
              >
                Terms of Service
              </button>
              {" "}and{" "}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="text-orange-600 hover:text-orange-700 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        )}
      </div>

      <GuestWarning
        open={showGuestWarning}
        onContinue={handleGuestContinue}
        onCancel={() => setShowGuestWarning(false)}
      />

      {/* Terms of Service Modal */}
      {showTOS && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
              <p className="text-sm text-gray-600 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div
              className="p-6 overflow-y-auto flex-1"
              onScroll={(e) => handleScroll(e, 'tos')}
            >
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mt-4">1. Acceptance of Terms</h3>
                <p className="text-gray-700">
                  By accessing and using Fluent ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">2. Description of Service</h3>
                <p className="text-gray-700">
                  Fluent provides a language learning platform that aggregates content from various sources including Reddit and other public APIs. The Service offers translation features, vocabulary management, and interactive learning tools to help users learn Japanese and other languages.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">3. User Accounts</h3>
                <p className="text-gray-700">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">4. User Content and Conduct</h3>
                <p className="text-gray-700">
                  You retain all rights to any content you submit, post or display on or through the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content. You agree not to use the Service for any unlawful purpose or in any way that could damage, disable, or impair the Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">5. Third-Party Content</h3>
                <p className="text-gray-700">
                  The Service aggregates content from third-party sources including Reddit. We do not control or endorse third-party content and are not responsible for its accuracy, completeness, or legality. Third-party content is subject to the terms and conditions of the respective platforms.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">6. Translation Services</h3>
                <p className="text-gray-700">
                  Our translation services are provided for educational purposes only. While we strive for accuracy, translations may contain errors or inaccuracies. We do not guarantee the accuracy, reliability, or completeness of any translations provided through the Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">7. Intellectual Property</h3>
                <p className="text-gray-700">
                  The Service and its original content, features, and functionality are owned by Fluent and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">8. Limitation of Liability</h3>
                <p className="text-gray-700">
                  In no event shall Fluent, its directors, employees, partners, or suppliers be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from your use of the Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">9. Disclaimer of Warranties</h3>
                <p className="text-gray-700">
                  The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">10. Changes to Terms</h3>
                <p className="text-gray-700">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page. Your continued use of the Service after such modifications constitutes your acceptance of the updated terms.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">11. Termination</h3>
                <p className="text-gray-700">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">12. Governing Law</h3>
                <p className="text-gray-700 mb-8">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Fluent operates, without regard to its conflict of law provisions. Any disputes arising from these terms will be resolved in the appropriate courts of that jurisdiction.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {hasScrolledTOS ? (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    You have read the entire document
                  </span>
                ) : (
                  <span className="text-orange-600">Please scroll to the bottom to continue</span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTOS(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleAcceptTOS}
                  disabled={!hasScrolledTOS}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    hasScrolledTOS
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
              <p className="text-sm text-gray-600 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div
              className="p-6 overflow-y-auto flex-1"
              onScroll={(e) => handleScroll(e, 'privacy')}
            >
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mt-4">1. Information We Collect</h3>
                <p className="text-gray-700">
                  We collect information that you provide directly to us, including your name, email address, and any content you create or upload to the Service. We also automatically collect certain information about your device and how you interact with the Service, including IP address, browser type, pages visited, and usage patterns.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">2. How We Use Your Information</h3>
                <p className="text-gray-700">
                  We use the information we collect to provide, maintain, and improve the Service, to communicate with you, to personalize your experience, to monitor and analyze trends and usage, and to protect against fraud and abuse. Your learning progress and vocabulary data are used to provide personalized language learning recommendations.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">3. Information Sharing</h3>
                <p className="text-gray-700">
                  We do not sell your personal information to third parties. We may share your information with service providers who perform services on our behalf, such as hosting, analytics, and translation services. These providers are contractually obligated to protect your information and use it only for the purposes we specify.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">4. Third-Party Services</h3>
                <p className="text-gray-700">
                  The Service integrates with third-party platforms including Reddit and various translation APIs. When you interact with content from these platforms, your actions may be subject to their respective privacy policies. We encourage you to review the privacy policies of any third-party services you access through our platform.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">5. Data Storage and Security</h3>
                <p className="text-gray-700">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">6. Cookies and Tracking Technologies</h3>
                <p className="text-gray-700">
                  We use cookies and similar tracking technologies to collect information about your browsing activities and to remember your preferences. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of the Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">7. Your Rights and Choices</h3>
                <p className="text-gray-700">
                  You have the right to access, update, or delete your personal information at any time through your account settings. You may also request a copy of your data or ask us to delete your account. You can opt out of promotional communications by following the unsubscribe instructions in those messages.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">8. Children's Privacy</h3>
                <p className="text-gray-700">
                  The Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information as quickly as possible.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">9. International Data Transfers</h3>
                <p className="text-gray-700">
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">10. Data Retention</h3>
                <p className="text-gray-700">
                  We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">11. Changes to Privacy Policy</h3>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4">12. Contact Us</h3>
                <p className="text-gray-700 mb-8">
                  If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@.app. We will respond to your inquiry within a reasonable timeframe.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {hasScrolledPrivacy ? (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    You have read the entire document
                  </span>
                ) : (
                  <span className="text-orange-600">Please scroll to the bottom to continue</span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleAcceptPrivacy}
                  disabled={!hasScrolledPrivacy}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    hasScrolledPrivacy
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Check Your Email</h3>
              <p className="text-gray-600 text-center mb-4">
                We've sent a confirmation email to:
              </p>
              <p className="text-orange-600 font-medium text-center mb-4">
                {confirmationEmail}
              </p>
              <p className="text-gray-600 text-center text-sm mb-6">
                Please click the confirmation link in the email to activate your account and start learning!
              </p>
              <button
                onClick={() => {
                  setShowEmailConfirmation(false)
                  setConfirmationEmail("")
                }}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Auth
