
/**
 * Utility function to determine an appropriate emoji for a content idea
 * based on its title and category.
 */
export const getEmojiForIdea = (title: string, category: string): string => {
  // Simple emoji selection based on content keywords
  const topicKeywords: Record<string, string> = {
    'tutorial': '📝',
    'how-to': '📝',
    'review': '⭐️',
    'food': '🍔',
    'fitness': '💪',
    'tech': '📱',
    'beauty': '💄',
    'fashion': '👗',
    'travel': '✈️',
    'gaming': '🎮',
    'music': '🎵',
    'business': '💼',
    'education': '🎓',
    'health': '🧠',
    'finance': '💰',
    'productivity': '⏱️',
    'lifestyle': '🌿',
    'entertainment': '🎬',
    'cooking': '👨‍🍳',
    'sports': '⚽',
    'creative': '🎨',
    'motivation': '🔥'
  };
  
  // Convert inputs to lowercase for case-insensitive matching
  const searchText = (title + ' ' + category).toLowerCase();
  
  // Look for keyword matches
  for (const [keyword, emoji] of Object.entries(topicKeywords)) {
    if (searchText.includes(keyword.toLowerCase())) {
      return emoji;
    }
  }
  
  // Fallback to default emoji if no matches
  return '🍎';
};

export const commonEmojis = [
  "🎬", "📱", "💡", "🔍", "📊", "🎯", "✅", "🎨", "📝", "🏆",
  "🌟", "💫", "📈", "🚀", "💪", "🧠", "❤️", "💰", "🔥", "💯",
  "👍", "👋", "😊", "😎", "🤔", "😮", "🙌", "👏", "📸", "🎤",
  "🎵", "📚", "🍎", "⭐", "🌈", "🎁", "🎉", "💻", "🎮", "📹"
];

export const foodEmojis = [
  "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒",
  "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥬", "🥕",
  "🥗", "🥪", "🍕", "🍔", "🌮", "🌯", "🍣", "🍜", "🍝", "🍩",
  "🍪", "🎂", "🧁", "🍦", "🍧", "🍮", "🍰", "🥧", "🍫", "🍬"
];

export const activityEmojis = [
  "🏃", "🚴", "🏋️", "🧘", "🎮", "🎯", "🎨", "🎭", "🎬", "🎤",
  "🎸", "🥁", "📚", "✏️", "💻", "📱", "📷", "🎥", "🔬", "🧪",
  "🧮", "💼", "💰", "📈", "🏠", "🚗", "✈️", "🚆", "🛳️", "🏝️",
  "⚽", "🏀", "🎾", "🏐", "🎣", "🧩", "🎲", "🎯", "🎪", "🎠"
];

export const emotionEmojis = [
  "😀", "😊", "🥰", "😍", "😎", "🤩", "😇", "🙂", "🤗", "🤔",
  "🙄", "😴", "😪", "😮", "😯", "😲", "😳", "🥺", "😦", "😧",
  "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓",
  "😩", "😫", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️"
];

export const natureEmojis = [
  "🌱", "🌲", "🌳", "🌴", "🌵", "🌿", "☘️", "🍀", "🍁", "🍂",
  "🍃", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚",
  "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎",
  "🌍", "🌏", "🪐", "💫", "⭐", "🌟", "✨", "⚡", "☄️", "💥"
];
