"use client";

import { useState, useRef, useEffect, useMemo } from "react";

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

/**
 * Props for the EmojiPicker overlay component.
 * Controls visibility, positioning, and callback for emoji selection.
 */
export interface EmojiPickerProps {
  /** Whether the picker overlay is visible */
  isOpen: boolean;
  /** Callback to close the picker */
  onClose: () => void;
  /** Callback when an emoji is selected — receives the emoji character string */
  onEmojiSelect: (emoji: string) => void;
  /** Positioning of the picker relative to its trigger element */
  position?: "top" | "bottom" | "left" | "right";
}

// ---------------------------------------------------------------------------
// Emoji Category Definitions
// ---------------------------------------------------------------------------

interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: "recent", label: "Recently Used", icon: "🕐" },
  { id: "people", label: "Smileys & People", icon: "😀" },
  { id: "nature", label: "Animals & Nature", icon: "🐻" },
  { id: "food", label: "Food & Drink", icon: "🍔" },
  { id: "activity", label: "Activity", icon: "⚽" },
  { id: "travel", label: "Travel & Places", icon: "✈️" },
  { id: "objects", label: "Objects", icon: "💡" },
  { id: "symbols", label: "Symbols", icon: "❤️" },
  { id: "flags", label: "Flags", icon: "🏁" },
];

// ---------------------------------------------------------------------------
// Emoji Data — subsets of commonly used Unicode emoji per category
// ---------------------------------------------------------------------------

const EMOJI_DATA: Record<string, string[]> = {
  recent: ["👍", "❤️", "😂", "🎉", "👀", "🚀", "✅", "💯"],
  people: [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗",
    "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝",
    "🤑", "🤗", "🤭", "🤫", "🤔", "🫡", "🤐", "🤨",
    "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬",
    "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒",
    "🤕",
  ],
  nature: [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
    "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🌸",
    "🌹", "🌺", "🌻", "🌼", "🌷", "🌱", "🌿", "☘️",
    "🍀",
  ],
  food: [
    "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓",
    "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝",
    "🍅", "🍆", "🥑", "🫛", "🥦", "🥬", "🥒", "🌶️",
    "🫑", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯",
  ],
  activity: [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
    "🥏", "🎱", "🏓", "🏸", "🏒", "🥊", "🎯", "⛳",
    "🎮", "🎲", "🧩", "🎭", "🎨", "🎬", "🎤", "🎧",
  ],
  travel: [
    "✈️", "🚀", "🚗", "🚕", "🚌", "🏠", "🏢", "🏗️",
    "⛺", "🏖️", "🗻", "🌋", "🗽", "🗼", "⛩️", "🕌",
    "🕍", "⛪", "🏰",
  ],
  objects: [
    "💡", "🔦", "📱", "💻", "⌨️", "🖥️", "📷", "🎥",
    "📞", "📺", "📻", "⏰", "⌚", "💰", "💳", "📧",
    "📝", "📁", "📎", "✂️", "🔑", "🔒",
  ],
  symbols: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
    "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💖", "✅", "❌", "⭐",
    "🌟", "💫", "⚡", "🔥", "💧", "🎵", "🎶",
  ],
  flags: [
    "🏁", "🇺🇸", "🇬🇧", "🇫🇷", "🇩🇪", "🇯🇵", "🇰🇷", "🇨🇳",
    "🇮🇳", "🇧🇷", "🇨🇦", "🇦🇺", "🇮🇹", "🇪🇸", "🇲🇽",
  ],
};

// ---------------------------------------------------------------------------
// Emoji name mapping for search — maps emoji characters to searchable names
// ---------------------------------------------------------------------------

const EMOJI_NAMES: Record<string, string> = {
  "👍": "thumbs up like yes",
  "❤️": "red heart love",
  "😂": "face with tears of joy laugh",
  "🎉": "party popper tada celebration",
  "👀": "eyes look see",
  "🚀": "rocket launch",
  "✅": "check mark done",
  "💯": "hundred perfect",
  "😀": "grinning face happy",
  "😃": "grinning face big eyes",
  "😄": "grinning face smiling eyes",
  "😁": "beaming face grin",
  "😆": "grinning squinting face",
  "😅": "grinning face sweat",
  "🤣": "rolling on floor laughing rofl",
  "🙂": "slightly smiling face",
  "😊": "smiling face blushing",
  "😇": "smiling face halo angel",
  "🥰": "smiling face hearts love",
  "😍": "heart eyes love",
  "🤩": "star struck amazing",
  "😘": "face blowing kiss",
  "😗": "kissing face",
  "😚": "kissing face closed eyes",
  "😙": "kissing face smiling eyes",
  "🥲": "smiling face tear",
  "😋": "face savoring food yum",
  "😛": "face tongue",
  "😜": "winking face tongue",
  "🤪": "zany face crazy",
  "😝": "squinting face tongue",
  "🤑": "money mouth face rich",
  "🤗": "hugging face hug",
  "🤭": "face hand over mouth",
  "🤫": "shushing face quiet",
  "🤔": "thinking face hmm",
  "🫡": "saluting face",
  "🤐": "zipper mouth face",
  "🤨": "face raised eyebrow",
  "😐": "neutral face",
  "😑": "expressionless face",
  "😶": "face without mouth",
  "🫥": "dotted line face",
  "😏": "smirking face",
  "😒": "unamused face",
  "🙄": "face rolling eyes",
  "😬": "grimacing face",
  "🤥": "lying face pinocchio",
  "😌": "relieved face",
  "😔": "pensive face sad",
  "😪": "sleepy face",
  "🤤": "drooling face",
  "😴": "sleeping face zzz",
  "😷": "face medical mask",
  "🤒": "face thermometer sick",
  "🤕": "face head bandage",
  "🐶": "dog face puppy",
  "🐱": "cat face kitty",
  "🐭": "mouse face",
  "🐹": "hamster face",
  "🐰": "rabbit face bunny",
  "🦊": "fox face",
  "🐻": "bear face",
  "🐼": "panda face",
  "🐨": "koala",
  "🐯": "tiger face",
  "🦁": "lion face",
  "🐮": "cow face",
  "🐷": "pig face",
  "🐸": "frog face",
  "🐵": "monkey face",
  "🌸": "cherry blossom flower",
  "🌹": "rose flower",
  "🌺": "hibiscus flower",
  "🌻": "sunflower",
  "🌼": "blossom flower",
  "🌷": "tulip flower",
  "🌱": "seedling plant",
  "🌿": "herb leaf",
  "☘️": "shamrock clover",
  "🍀": "four leaf clover lucky",
  "🍎": "red apple fruit",
  "🍐": "pear fruit",
  "🍊": "tangerine orange fruit",
  "🍋": "lemon fruit",
  "🍌": "banana fruit",
  "🍉": "watermelon fruit",
  "🍇": "grapes fruit",
  "🍓": "strawberry fruit",
  "🫐": "blueberries fruit",
  "🍈": "melon fruit",
  "🍒": "cherries fruit",
  "🍑": "peach fruit",
  "🥭": "mango fruit",
  "🍍": "pineapple fruit",
  "🥥": "coconut",
  "🥝": "kiwi fruit",
  "🍅": "tomato",
  "🍆": "eggplant",
  "🥑": "avocado",
  "🫛": "pea pod",
  "🥦": "broccoli",
  "🥬": "leafy green",
  "🥒": "cucumber",
  "🌶️": "hot pepper chili",
  "🫑": "bell pepper",
  "🍔": "hamburger burger",
  "🍟": "french fries",
  "🍕": "pizza",
  "🌭": "hot dog",
  "🥪": "sandwich",
  "🌮": "taco",
  "🌯": "burrito",
  "⚽": "soccer ball football",
  "🏀": "basketball",
  "🏈": "american football",
  "⚾": "baseball",
  "🥎": "softball",
  "🎾": "tennis",
  "🏐": "volleyball",
  "🏉": "rugby football",
  "🥏": "flying disc frisbee",
  "🎱": "pool billiards",
  "🏓": "ping pong table tennis",
  "🏸": "badminton",
  "🏒": "ice hockey",
  "🥊": "boxing glove",
  "🎯": "bullseye target dart",
  "⛳": "flag in hole golf",
  "🎮": "video game controller",
  "🎲": "game die dice",
  "🧩": "puzzle piece jigsaw",
  "🎭": "performing arts theater",
  "🎨": "artist palette paint",
  "🎬": "clapper board movie film",
  "🎤": "microphone singing",
  "🎧": "headphone music",
  "✈️": "airplane travel flight",
  "🚗": "car automobile",
  "🚕": "taxi cab",
  "🚌": "bus",
  "🏠": "house home",
  "🏢": "office building",
  "🏗️": "construction building",
  "⛺": "tent camping",
  "🏖️": "beach umbrella",
  "🗻": "mount fuji mountain",
  "🌋": "volcano",
  "🗽": "statue of liberty",
  "🗼": "tokyo tower",
  "⛩️": "shinto shrine",
  "🕌": "mosque",
  "🕍": "synagogue",
  "⛪": "church",
  "🏰": "castle",
  "💡": "light bulb idea",
  "🔦": "flashlight torch",
  "📱": "mobile phone smartphone",
  "💻": "laptop computer",
  "⌨️": "keyboard",
  "🖥️": "desktop computer monitor",
  "📷": "camera photo",
  "🎥": "movie camera video",
  "📞": "telephone phone call",
  "📺": "television tv",
  "📻": "radio",
  "⏰": "alarm clock time",
  "⌚": "watch time",
  "💰": "money bag cash",
  "💳": "credit card payment",
  "📧": "email mail envelope",
  "📝": "memo note writing",
  "📁": "file folder",
  "📎": "paperclip attachment",
  "✂️": "scissors cut",
  "🔑": "key",
  "🔒": "locked padlock",
  "🧡": "orange heart",
  "💛": "yellow heart",
  "💚": "green heart",
  "💙": "blue heart",
  "💜": "purple heart",
  "🖤": "black heart",
  "🤍": "white heart",
  "🤎": "brown heart",
  "💔": "broken heart",
  "❤️‍🔥": "heart on fire",
  "❤️‍🩹": "mending heart",
  "💖": "sparkling heart",
  "❌": "cross mark no",
  "⭐": "star",
  "🌟": "glowing star",
  "💫": "dizzy star",
  "⚡": "lightning bolt zap",
  "🔥": "fire flame hot",
  "💧": "droplet water",
  "🎵": "musical note music",
  "🎶": "musical notes music",
  "🏁": "checkered flag race finish",
  "🇺🇸": "united states flag usa america",
  "🇬🇧": "united kingdom flag uk britain",
  "🇫🇷": "france flag french",
  "🇩🇪": "germany flag german",
  "🇯🇵": "japan flag japanese",
  "🇰🇷": "south korea flag korean",
  "🇨🇳": "china flag chinese",
  "🇮🇳": "india flag indian",
  "🇧🇷": "brazil flag brazilian",
  "🇨🇦": "canada flag canadian",
  "🇦🇺": "australia flag australian",
  "🇮🇹": "italy flag italian",
  "🇪🇸": "spain flag spanish",
  "🇲🇽": "mexico flag mexican",
};

// ---------------------------------------------------------------------------
// Skin Tone Variants
// ---------------------------------------------------------------------------

const SKIN_TONES: { index: number; color: string; label: string }[] = [
  { index: 0, color: "#FFCC22", label: "Default" },
  { index: 1, color: "#FADCBC", label: "Light" },
  { index: 2, color: "#E0BB95", label: "Medium-Light" },
  { index: 3, color: "#BF8F68", label: "Medium" },
  { index: 4, color: "#9B643D", label: "Medium-Dark" },
  { index: 5, color: "#594539", label: "Dark" },
];

// ---------------------------------------------------------------------------
// Position Class Mapping
// ---------------------------------------------------------------------------

function getPositionClasses(
  position: EmojiPickerProps["position"]
): string {
  switch (position) {
    case "top":
      return "bottom-full mb-2";
    case "bottom":
      return "top-full mt-2";
    case "left":
      return "right-full mr-2";
    case "right":
      return "left-full ml-2";
    default:
      return "bottom-full mb-2";
  }
}

// ---------------------------------------------------------------------------
// EmojiPicker Component
// ---------------------------------------------------------------------------

/**
 * Emoji picker overlay component with category tabs, search, emoji grid,
 * skin tone selector, and recently used section. Matches the Slack web app
 * emoji picker UI pattern.
 *
 * Features:
 * - 9 emoji categories with tab navigation
 * - Real-time search filtering by emoji name
 * - Skin tone selection (visual indicator)
 * - Click-outside and Escape key dismissal
 * - Auto-focus on search input when opened
 * - 8-column grid layout for emoji display
 */
export default function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  position = "top",
}: EmojiPickerProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("people");
  const [skinTone, setSkinTone] = useState<number>(0);

  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Reset state when picker transitions from closed to open
  // (React "adjusting state during render" pattern — avoids setState in effect)
  // -------------------------------------------------------------------------
  if (isOpen && !prevIsOpen) {
    setSearchQuery("");
    setActiveCategory("people");
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  // -------------------------------------------------------------------------
  // Derived: Filtered emoji list based on search query
  // -------------------------------------------------------------------------
  const filteredEmojis = useMemo<string[]>(() => {
    if (!searchQuery.trim()) {
      return EMOJI_DATA[activeCategory] ?? [];
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const allEmojis: string[] = [];

    for (const categoryId of EMOJI_CATEGORIES.map((c) => c.id)) {
      const emojis = EMOJI_DATA[categoryId];
      if (!emojis) continue;
      for (const emoji of emojis) {
        const name = EMOJI_NAMES[emoji] ?? "";
        if (
          name.toLowerCase().includes(lowerQuery) ||
          emoji.includes(lowerQuery)
        ) {
          allEmojis.push(emoji);
        }
      }
    }

    // Deduplicate (emojis may appear in "recent" and another category)
    return [...new Set(allEmojis)];
  }, [searchQuery, activeCategory]);

  // -------------------------------------------------------------------------
  // Derived: Active category label for the grid section header
  // -------------------------------------------------------------------------
  const activeCategoryLabel = useMemo<string>(() => {
    if (searchQuery.trim()) {
      return "Search Results";
    }
    const category = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
    return category?.label ?? "Emojis";
  }, [searchQuery, activeCategory]);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Escape key handler — close picker on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside handler — close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // Use a short timeout to prevent the click that opened the picker
    // from immediately closing it
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Auto-focus search input when picker opens
  useEffect(() => {
    if (isOpen) {
      // Focus after a micro-task to allow the DOM to render
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Viewport boundary detection — repositions picker when it overflows
  // the right or bottom edge of the viewport (QA Issue #2).
  // Uses requestAnimationFrame to run after the browser has painted the
  // picker at its default CSS position, then measures and adjusts.
  useEffect(() => {
    if (!isOpen || !pickerRef.current) return;

    // Reset any previous repositioning transform before measuring
    pickerRef.current.style.transform = "";

    const frameId = requestAnimationFrame(() => {
      if (!pickerRef.current) return;
      const rect = pickerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const safetyMargin = 16; // 16px gutter from viewport edges

      let translateX = 0;

      // If the picker overflows the right viewport edge, shift left
      if (rect.right > viewportWidth - safetyMargin) {
        translateX = -(rect.right - viewportWidth + safetyMargin);
      }

      // If the picker overflows the left viewport edge after shifting, clamp
      if (rect.left + translateX < safetyMargin) {
        translateX = -(rect.left - safetyMargin);
      }

      if (translateX !== 0) {
        pickerRef.current.style.transform = `translateX(${translateX}px)`;
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /** Handle emoji selection — notify parent and close the picker */
  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  /** Handle category tab click */
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className={`absolute z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 ${getPositionClasses(position)}`}
      role="dialog"
      aria-label="Emoji picker"
      aria-modal="true"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Search Bar                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          {/* Magnifying glass icon */}
          <span
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm border-none outline-none placeholder-gray-400 focus:ring-2 focus:ring-[#1164A3]"
            aria-label="Search emojis"
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Category Tabs                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 overflow-x-auto"
        role="tablist"
        aria-label="Emoji categories"
      >
        {EMOJI_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === category.id}
            aria-label={category.label}
            title={category.label}
            onClick={() => handleCategoryClick(category.id)}
            className={`p-1.5 rounded text-lg cursor-pointer shrink-0 transition-colors ${
              activeCategory === category.id && !searchQuery.trim()
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            {category.icon}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Emoji Grid                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="max-h-60 overflow-y-auto p-2 slack-scrollbar">
        {/* Category label */}
        <div className="text-xs font-semibold text-gray-500 uppercase px-1 py-2">
          {activeCategoryLabel}
        </div>

        {filteredEmojis.length > 0 ? (
          <div className="grid grid-cols-8 gap-1" role="grid">
            {filteredEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-xl cursor-pointer transition-colors"
                title={EMOJI_NAMES[emoji] ?? emoji}
                aria-label={EMOJI_NAMES[emoji] ?? emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-2xl mb-2" aria-hidden="true">
              🔍
            </span>
            <p className="text-sm text-gray-500">No emoji found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Skin Tone Selector                                                */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-1 p-2 border-t border-gray-200">
        <span className="text-xs text-gray-500 mr-1">Skin tone:</span>
        {SKIN_TONES.map((tone) => (
          <button
            key={tone.index}
            type="button"
            onClick={() => setSkinTone(tone.index)}
            className={`w-5 h-5 rounded-full cursor-pointer border transition-all ${
              skinTone === tone.index
                ? "ring-2 ring-[#1164A3] border-transparent"
                : "border-gray-300 hover:border-gray-400"
            }`}
            style={{ backgroundColor: tone.color }}
            title={tone.label}
            aria-label={`${tone.label} skin tone`}
            aria-pressed={skinTone === tone.index}
          />
        ))}
      </div>
    </div>
  );
}
