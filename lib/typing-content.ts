export type Lesson = {
  id: string;
  level: number;
  title: string;
  description: string;
  targetKeys: string[];
  finger: string;
  exercise: string;
  goalWpm: number;
  goalAccuracy: number;
};

export const TEST_PASSAGES = [
  'Good typing begins with calm hands and accurate movement. Keep your fingers close to the home row and let rhythm grow naturally.',
  'Practice a little each day. Small, deliberate improvements build strong habits, better accuracy, and faster confident typing over time.',
  'The quickest typists are not rushing every keystroke. They are using efficient finger paths, steady rhythm, and reliable muscle memory.',
  'When a key feels difficult, slow down and repeat it. Accuracy gives your hands a clear signal about what to learn next.',
  'Touch typing makes the keyboard feel familiar. Look at the words, trust your fingers, and keep your attention on the next character.',
  'Professional typing is quiet, accurate, and repeatable. Build control first, then let speed emerge from efficient movement.',
  'Strong typists recover from mistakes without losing their rhythm. Breathe, correct the pattern, and return your attention to the next word.',
];

export const LESSONS: Lesson[] = [
  { id: 'home-row', level: 1, title: 'Home Row', description: 'Find your anchors and build a stable starting position.', targetKeys: ['a','s','d','f','j','k','l',';'], finger: 'Index, middle, ring, pinky', exercise: 'asdf jkl; fdsa ;lkj asdf jkl;', goalWpm: 12, goalAccuracy: 92 },
  { id: 'anchors', level: 1, title: 'F & J Anchors', description: 'Use the raised keys to orient your hands without looking.', targetKeys: ['f','j'], finger: 'Left index + right index', exercise: 'fj jf ff jj fj jf fj jf', goalWpm: 15, goalAccuracy: 94 },
  { id: 'left-reach', level: 2, title: 'Left Hand Reach', description: 'Move from home position and return without lifting the hand.', targetKeys: ['q','w','e','r','t'], finger: 'Left hand by finger zone', exercise: 'aq sw de fr ft aq sw de fr ft', goalWpm: 18, goalAccuracy: 94 },
  { id: 'right-reach', level: 2, title: 'Right Hand Reach', description: 'Build controlled reaches while keeping the wrist relaxed.', targetKeys: ['y','u','i','o','p'], finger: 'Right hand by finger zone', exercise: 'jy ku li op py jy ku li op py', goalWpm: 18, goalAccuracy: 94 },
  { id: 'reach-return', level: 2, title: 'Reach & Return', description: 'Reach from home position, then return smoothly.', targetKeys: ['r','u','e','i'], finger: 'Index + middle fingers', exercise: 'fr ju fr ju re ui er iu', goalWpm: 20, goalAccuracy: 95 },
  { id: 'lower-row', level: 3, title: 'Lower Row', description: 'Build controlled reaches into the lower row.', targetKeys: ['z','x','c','v','b','n','m'], finger: 'Mapped by finger zone', exercise: 'cv vm bn mx can van mix', goalWpm: 22, goalAccuracy: 95 },
  { id: 'word-building', level: 4, title: 'Word Building', description: 'Turn individual key movements into accurate words.', targetKeys: ['t','h','e','r','o','n'], finger: 'Mixed', exercise: 'the there other another north then', goalWpm: 25, goalAccuracy: 95 },
  { id: 'tricky-patterns', level: 4, title: 'Tricky Patterns', description: 'Automate common letter combinations and confusing transitions.', targetKeys: ['t','r','h','g'], finger: 'Mixed', exercise: 'right tight sight great three through', goalWpm: 28, goalAccuracy: 96 },
  { id: 'sentences', level: 5, title: 'Sentence Flow', description: 'Practice spaces, capitalization, punctuation, and rhythm.', targetKeys: ['shift', 'space'], finger: 'All fingers', exercise: 'Practice makes progress. Keep it steady.', goalWpm: 30, goalAccuracy: 96 },
  { id: 'numbers', level: 6, title: 'Number Row', description: 'Reach for numbers while keeping your home position stable.', targetKeys: ['1','2','3','4','5','6','7','8','9','0'], finger: 'Mapped by finger zone', exercise: '12345 67890 2026 314159 8080', goalWpm: 28, goalAccuracy: 95 },
  { id: 'punctuation', level: 7, title: 'Punctuation', description: 'Build confidence with commas, quotes, colons, and sentence endings.', targetKeys: [',','.',';','\'',':','!'], finger: 'Mapped by finger zone', exercise: 'Ready, set, type. Keep pace; stay precise!', goalWpm: 32, goalAccuracy: 96 },
  { id: 'accuracy-loop', level: 8, title: 'Accuracy Loop', description: 'Slow down, notice mistakes, and repeat difficult patterns.', targetKeys: ['g','h','r','t'], finger: 'Mixed', exercise: 'right tight sight great three through', goalWpm: 34, goalAccuracy: 98 },
  { id: 'speed-builder', level: 9, title: 'Speed Builder', description: 'Increase pace while protecting accuracy and rhythm.', targetKeys: ['all'], finger: 'All fingers', exercise: 'Fast hands still need calm, accurate movement.', goalWpm: 40, goalAccuracy: 96 },
  { id: 'professional', level: 10, title: 'Professional Fluency', description: 'Handle longer text, punctuation, and varied patterns with confidence.', targetKeys: ['all'], finger: 'All fingers', exercise: 'Consistent practice turns conscious technique into effortless skill.', goalWpm: 50, goalAccuracy: 97 },
];

export const FINGER_BY_KEY: Record<string, string> = {
  '`':'left pinky','1':'left pinky','q':'left pinky','a':'left pinky','z':'left pinky',
  '2':'left ring','w':'left ring','s':'left ring','x':'left ring',
  '3':'left middle','e':'left middle','d':'left middle','c':'left middle',
  '4':'left index','5':'left index','r':'left index','t':'left index','f':'left index','g':'left index','v':'left index','b':'left index',
  '6':'right index','7':'right index','y':'right index','u':'right index','h':'right index','j':'right index','n':'right index','m':'right index',
  '8':'right middle','i':'right middle','k':'right middle',',':'right middle',
  '9':'right ring','o':'right ring','l':'right ring','.':'right ring',
  '0':'right pinky','p':'right pinky',';':'right pinky','/':'right pinky',
  ' ':'thumbs',
};

export const KEYBOARD_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m',',','.','/'],
  ['1','2','3','4','5','6','7','8','9','0'],
];
