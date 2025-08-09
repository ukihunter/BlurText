// Utility function to generate consistent random avatar URLs (using DiceBear API)
export const generateConsistentAvatar = (username: string): string => {
  if (!username) return 'https://api.dicebear.com/7.x/avataaars/png?seed=default&size=128';
  
  // Use DiceBear avataaars style which creates diverse human-like avatars
  // The seed parameter ensures the same username always gets the same avatar
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(username)}&size=128&backgroundColor=transparent`;
};

// Alternative avatar URL for fallback
export const generateFallbackAvatar = (username: string): string => {
  if (!username) return 'https://api.dicebear.com/7.x/personas/png?seed=fallback&size=128';
  
  // Use different style for fallback
  return `https://api.dicebear.com/7.x/personas/png?seed=${encodeURIComponent(username)}-fallback&size=128&backgroundColor=transparent`;
};
