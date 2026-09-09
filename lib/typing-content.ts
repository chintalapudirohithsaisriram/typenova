export type Lesson = {
  id: string;
  level: number;
  title: string;
  description: string;
  targetKeys: string[];
  finger: string;
  exercise: string;
};

export const TEST_PASSAGES = [
  'Good typing begins with calm hands and accurate movement. Keep your fingers close to the home row and let rhythm grow naturally.',
  'Practice a little each day. Small, deliberate improvements build strong habits, better accuracy, and faster confident typing over time.',
  'The quickest typists are not rushing every keystroke. They are using efficient finger paths, steady rhythm, and reliable muscle memory.',
  'When a key feels difficult, slow down and repeat it. Accuracy gives your hands a clear signal about what to learn next.',
  'Touch typing makes the keyboard feel familiar. Look at the words, trust your fingers, and keep your attention on the next character.',
];

export const LESSONS: Lesson[] = [
  { id: 'home-row', level: 1, title: 'Home Row', description: 'Find your anchors and build a stable starting position.', targetKeys: ['a','s','d','f','j','k','l',';'], finger: 'Index, middle, ring, pinky', exercise: 'asdf jkl; fdsa ;lkj asdf jkl;' },
  { id: 'anchors', level: 1, title: 'F & J Anchors', description: 'Use the raised keys to orient your hands without looking.', targetKeys: ['f','j'], finger: 'Left index + right index', exercise: 'fj jf ff jj fj jf' },
  { id: 'reach-return', level: 2, title: 'Reach & Return', description: 'Reach from home position, then return smoothly.', targetKeys: ['r','u','e','i'], finger: 'Index + middle fingers', exercise: 'fr ju fr ju re ui er iu' },
  { id: 'upper-row', level: 2, title: 'Upper Row', description: 'Add the top row while preserving your home position.', targetKeys: ['q','w','e','r','t','y','u','i','o','p'], finger: 'Mapped by finger zone', exercise: 'we weer type type write' },
  { id: 'lower-row', level: 2, title: 'Lower Row', description: 'Build controlled reaches into the lower row.', targetKeys: ['z','x','c','v','b','n','m'], finger: 'Mapped by finger zone', exercise: 'cv vm bn mx can van mix' },
  { id: 'word-building', level: 3, title: 'Word Building', description: 'Turn individual key movements into accurate words.', targetKeys: ['t','h','e','r','o','n'], finger: 'Mixed', exercise: 'the there other another north then' },
  { id: 'accuracy-loop', level: 3, title: 'Accuracy Loop', description: 'Slow down, notice mistakes, and repeat difficult patterns.', targetKeys: ['g','h','r','t'], finger: 'Mixed', exercise: 'right tight sight great three through' },
  { id: 'sentences', level: 4, title: 'Sentence Flow', description: 'Practice spaces, capitalization, punctuation, and rhythm.', targetKeys: ['shift', 'space'], finger: 'All fingers', exercise: 'Practice makes progress. Keep it steady.' },
  { id: 'speed', level: 5, title: 'Speed Builder', description: 'Increase pace while protecting accuracy.', targetKeys: ['all'], finger: 'All fingers', exercise: 'Fast hands still need calm, accurate movement.' },
  { id: 'advanced', level: 6, title: 'Advanced Passage', description: 'Handle longer text, punctuation, and varied patterns.', targetKeys: ['all'], finger: 'All fingers', exercise: 'Consistent practice turns conscious technique into effortless skill.' },
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
];
