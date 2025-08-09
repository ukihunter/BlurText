import React from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";

const Home = () => {
  return (
    <div className="bg-[#262335] ">
      {/* Header */}
      <div className="max-w-3xl mx-auto ">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <h1 className="text-2xl font-bold bg-white bg-clip-text text-transparent ">
            <TranslatedText>Home</TranslatedText>
          </h1>
          <p className="text-slate-600 dark:text-slate-300  text-sm">
            <TranslatedText>Discover and share amazing content</TranslatedText>
          </p>
        </div>
      </div>

      {/* Create Post Section */}
      <div className="max-w-4xl mx-auto mb-2 ">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl  shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 flex-shrink-0 overflow-hidden">
              <img
                src={generateConsistentAvatar("youruser")}
                alt="Your Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-4">
                <textarea
                  placeholder="Share whispers..."
                  className="w-full bg-transparent placeholder-slate-500 dark:placeholder-slate-400 resize-none border-none outline-none text-lg"
                  rows={1}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-200/30">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">Photo</span>
                  </button>
                </div>
                <button className=" text-white border-white border px-8 py-2 rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                  <TranslatedText>Share</TranslatedText>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto space-y-6 p-3">
        {/* Featured Post */}
        <div className="bg-white/80 dark:bg-[#262335] backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={generateConsistentAvatar("manusha")}
                  alt="Alex Smith"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  Manusha
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  @manusha • 2 hours ago
                </p>
              </div>
              <div className="ml-auto"></div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed mb-4">
              eka eka keln kaiwath rasa mihiri katah Taniya thmi mae hita gath
              ekama kena 🐘❤ #Thaniya
            </p>
            <div className="bg-gradient-to-br from-purple-100 via-pink-500 to-orange-500 rounded-2xl h-64 mb-4 flex items-center justify-center">
              <img
                src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.dw.com%2Fimage%2F62865468_605.jpg&f=1&nofb=1&ipt=0a565863664a1c548b050fcbc3d386337f57f3c94b6ed73c770ce71101475fbe"
                alt="Design System Preview"
                className="object-cover rounded-2xl h-full w-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">24</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">156</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30">
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                </button>
              </div>
              <button className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-2 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-slate-600 dark:text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Regular Posts Grid */}
        <div className="space-y-6">
          {/* Post 1 */}
          <div className="bg-slate-800/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/30 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden">
                <img
                  src={generateConsistentAvatar("mariajohnson")}
                  alt="Maria Johnson"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">Maria Johnson</h4>
                <p className="text-slate-400 text-sm">
                  Travel Blogger • 4 hours ago
                </p>
              </div>
            </div>
            <p className="text-slate-200 text-lg leading-relaxed mb-4">
              Beautiful morning hike today! There&apos;s nothing quite like
              watching the sunrise from the mountain top. Nature always reminds
              me what&apos;s truly important. 🌅
            </p>
            <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl h-64 mb-4"></div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">12</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">89</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                </button>
              </div>
              <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Post 2 */}
          <div className="bg-slate-800/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/30 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden">
                <img
                  src={generateConsistentAvatar("davidkim")}
                  alt="David Kim"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">David Kim</h4>
                <p className="text-slate-400 text-sm">
                  Productivity Coach • 6 hours ago
                </p>
              </div>
            </div>
            <p className="text-slate-200 text-lg leading-relaxed mb-4">
              Just finished reading an amazing book about productivity! 📚 The
              key insight: focus on systems, not goals. Game-changer for sure.
            </p>
            <div className="bg-slate-700/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-20 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-xl flex-shrink-0"></div>
                <div>
                  <h5 className="font-semibold text-white text-lg">
                    Atomic Habits
                  </h5>
                  <p className="text-slate-400 text-sm">by James Clear</p>
                  <p className="text-slate-300 text-sm mt-2">
                    An easy way to build good habits and break bad ones...
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">8</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">34</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                </button>
              </div>
              <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Post 3 */}
          <div className="bg-slate-800/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/30 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden">
                <img
                  src={generateConsistentAvatar("sarahlee")}
                  alt="Sarah Lee"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">Sarah Lee</h4>
                <p className="text-slate-400 text-sm">
                  Chef & Food Blogger • 8 hours ago
                </p>
              </div>
            </div>
            <p className="text-slate-200 text-lg leading-relaxed mb-4">
              Working on a new recipe today! Experimenting with fusion cuisine -
              mixing Korean and Italian flavors. The kimchi carbonara turned out
              amazing! 🍝
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl h-48"></div>
              <div className="bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl h-48"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">15</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">67</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                </button>
              </div>
              <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Post 4 */}
          <div className="bg-slate-800/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/30 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden">
                <img
                  src={generateConsistentAvatar("ryanchen")}
                  alt="Ryan Chen"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">Ryan Chen</h4>
                <p className="text-slate-400 text-sm">
                  Senior Developer • 12 hours ago
                </p>
              </div>
            </div>
            <p className="text-slate-200 text-lg leading-relaxed mb-4">
              Quick coding tip: Use meaningful variable names! Your future self
              (and your teammates) will thank you. Code should tell a story. 💻
            </p>
            <div className="bg-slate-900/80 rounded-2xl p-4 mb-4 border border-slate-700/50">
              <div className="text-green-400 font-mono text-sm">
                <div className="text-slate-500">{`// Good ✓`}</div>
                <div className="text-blue-400">const</div>{" "}
                <span className="text-yellow-300">userAccountBalance</span> ={" "}
                <span className="text-green-300">1250.75</span>;
                <br />
                <div className="text-slate-500 mt-2">{`// Bad ✗`}</div>
                <div className="text-blue-400">const</div>{" "}
                <span className="text-yellow-300">uab</span> ={" "}
                <span className="text-green-300">1250.75</span>;
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">23</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">45</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <div className="p-2 rounded-xl hover:bg-slate-700/50">
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                </button>
              </div>
              <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
