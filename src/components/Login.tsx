"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TranslatedText } from "@/hooks/useTranslation";
import {
  showErrorToast,
  showWarningToast,
  showSuccessToast,
} from "@/utils/toast";

interface LoginProps {
  onLogin: (userData?: { username: string; id: string }) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const { theme } = useTheme();

  // Add custom styles for animations
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .animate-fade-in {
        animation: fade-in 1s ease-out;
      }
      
      .animate-fade-in-delay {
        animation: fade-in 1s ease-out 0.3s both;
      }
      
      .animate-fade-in-delay-2 {
        animation: fade-in 1s ease-out 0.6s both;
      }
      
      .animation-delay-1000 {
        animation-delay: 1s;
      }
      
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      
      .animation-delay-3000 {
        animation-delay: 3s;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to generate random username
  const generateUsername = () => {
    const adjectives = [
      "Silent",
      "Shadow",
      "uki",
      "uthpala",
      "gayani",
      "Manusha",
      "Akash",
      "scobby",
      "Echo",
      "Blur",
    ];
    const nouns = [
      "KIA",
      "Ghost",
      "Hunter",
      "Tera",
      "Seeker",
      "Rider",
      "Dreamer",
      "Whisper",
      "Soul",
      "Mind",
    ];
    const numbers = Math.floor(Math.random() * 9999) + 1;

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${randomAdjective}${randomNoun}${numbers}`;
  };

  // Function to generate random password
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    // Ensure at least one character from each category
    let password = "";
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Fill remaining length with random characters from all categories
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to randomize character positions
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  // Function to download credentials as txt file
  const downloadCredentials = () => {
    const content = `BlurText Anonymous Account Credentials\n\nUsername: ${generatedUsername}\nPassword: ${generatedPassword}\n\nGenerated on: ${new Date().toLocaleString()}\n\nIMPORTANT: Keep these credentials safe. This is the only way to access your anonymous account.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BlurText_Credentials_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Handle login API call
  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      showWarningToast("Please enter both username and password");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin({
          username: data.user.username,
          id: data.user.id,
        });
      } else {
        showErrorToast(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      showErrorToast("Login failed. Please try again.");
    }
  };

  // Handle registration API call
  const handleRegister = async () => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: generatedUsername,
          password: generatedPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessToast(
          "Account created successfully! Please login with your credentials.",
          4000
        );
        switchToLogin();
      } else {
        showErrorToast(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showErrorToast("Registration failed. Please try again.");
    }
  };

  // Generate credentials when switching to registration form
  useEffect(() => {
    if (!isLoginForm) {
      setGeneratedUsername(generateUsername());
      setGeneratedPassword(generatePassword());
    } else {
      // Clear credentials when switching to login form
      setGeneratedUsername("");
      setGeneratedPassword("");
      setLoginUsername("");
      setLoginPassword("");
      setShowPassword(false);
      setShowGeneratedPassword(false);
    }
  }, [isLoginForm]);

  const switchToRegister = () => setIsLoginForm(false);
  const switchToLogin = () => setIsLoginForm(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-[#1a1625] dark:via-[#262335] dark:to-[#2d1b3d] flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Animated Background happening here */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-300 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-pulse animation-delay-3000"></div>
      </div>

      {/* Welcome Text Section */}
      <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-10 max-w-lg">
        <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-2xl p-8 border border-white/20 dark:border-gray-700/30">
          {/* Welcome Text  and animation happend here*/}
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-fade-in">
            <TranslatedText>Welcome to BlurText</TranslatedText>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed animate-fade-in-delay">
            <TranslatedText>
              Your anonymous social platform where privacy meets connection.
              Share thoughts freely without revealing your identity.
            </TranslatedText>
          </p>
          <div className="mt-6 flex items-center space-x-2 animate-fade-in-delay-2">
            {/* Animated ping dot */}
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <TranslatedText>Secure & Anonymous</TranslatedText>
            </span>
          </div>
        </div>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-md ml-auto mr-16 z-20">
        <div className="backdrop-blur-lg bg-white/80 dark:bg-[#262335]/80 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
          {isLoginForm ? (
            <>
              {/* BLUR TEXT Heading */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <img
                    src={
                      theme === "light"
                        ? "icons/blur-dark.png"
                        : "icons/blur.png"
                    }
                    alt="logo"
                    width={150}
                    height={150}
                    className="mx-auto"
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  <TranslatedText>Anonymous Social Platform</TranslatedText>
                </p>
              </div>

              {/* Credentials Section */}
              <div className="mb-6">
                <p className="text-center text-green-600 dark:text-green-400 font-medium">
                  <TranslatedText>
                    Enter Your Credentials To Login
                  </TranslatedText>
                </p>
              </div>

              {/* Username Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <TranslatedText>Username</TranslatedText>
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border-0 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Enter your username"
                />
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <TranslatedText>Password</TranslatedText>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border-0 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Enter BlurText Button */}
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 mb-4"
              >
                <TranslatedText>Enter the BlurText</TranslatedText>
              </button>

              {/* Create Account Link */}
              <p
                onClick={switchToRegister}
                className="text-center text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 cursor-pointer transition-colors duration-300"
              >
                <TranslatedText>
                  Not a Member, Create New Account
                </TranslatedText>
              </p>
            </>
          ) : (
            // REGISTRATION FORM JSX HERE
            <>
              {/* BLUR TEXT Heading */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <img
                    src={
                      theme === "light"
                        ? "icons/blur-dark.png"
                        : "icons/blur.png"
                    }
                    alt="logo"
                    width={150}
                    height={150}
                    className="mx-auto"
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  <TranslatedText>Anonymous Social Platform</TranslatedText>
                </p>
              </div>

              {/* Registration Section */}
              <div className="mb-6">
                <p className="text-center text-green-600 dark:text-green-400 font-medium">
                  <TranslatedText>Create Your Anonymous Account</TranslatedText>
                </p>
              </div>

              {/* Generate Anonymous Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <TranslatedText>Anonymous Username</TranslatedText>
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 cursor-not-allowed"
                  value={generatedUsername}
                  readOnly
                />
              </div>

              {/* Generate Anonymous Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <TranslatedText>Anonymous Password</TranslatedText>
                </label>
                <div className="relative">
                  <input
                    type={showGeneratedPassword ? "text" : "password"}
                    disabled
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 cursor-not-allowed"
                    value={generatedPassword}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowGeneratedPassword(!showGeneratedPassword)
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showGeneratedPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Download Credentials Button */}
              <button
                onClick={downloadCredentials}
                className="w-full bg-gradient-to-r from-green-900 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-medium py-3 px-6 rounded-full transition-colors duration-300 mb-4 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <TranslatedText>Download Credentials</TranslatedText>
              </button>

              {/* Create Account Button */}
              <button
                onClick={handleRegister}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 mb-4"
              >
                <TranslatedText>Create Anonymous Account</TranslatedText>
              </button>

              {/* Back to Login Link */}
              <p
                onClick={switchToLogin}
                className="text-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors duration-300"
              >
                <TranslatedText>
                  Already have an account? Login here
                </TranslatedText>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
