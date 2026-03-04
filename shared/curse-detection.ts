const CURSE_WORDS = [
  "damn", "dammit", "damnit", "goddamn", "goddamnit",
  "hell",
  "crap", "crappy",
  "piss", "pissed", "pissing",
  "bastard", "bastards",
  "bloody",
  "shit", "shits", "shitty", "bullshit", "horseshit", "dipshit", "shithead",
  "fuck", "fucker", "fuckers", "fucking", "fucked", "motherfucker", "motherfucking", "wtf", "stfu",
  "ass", "asses", "asshole", "assholes", "dumbass", "jackass", "badass", "smartass", "fatass", "asshat",
  "bitch", "bitches", "bitchy", "bitching", "sonofabitch",
  "dick", "dicks", "dickhead",
  "cock", "cocks", "cocksucker",
  "penis",
  "wiener",
  "whore", "whores",
  "slut", "sluts", "slutty",
  "douche", "douchebag",
  "twat",
  "wanker", "wankers",
  "bollocks",
  "arse", "arsehole",
  "tits",
  "boobs",
  "cunt", "cunts",
  "suck", "sucks", "sucking",
  "blows",
  "screw", "screwed",
];

const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
};

function normalizeLeet(word: string): string {
  let result = "";
  for (const ch of word) {
    result += LEET_MAP[ch] || ch;
  }
  return result;
}

function collapseRepeats(word: string): string {
  return word.replace(/(.)\1{2,}/g, "$1$1");
}

function stripPunctuation(word: string): string {
  return word.replace(/[^a-zA-Z0-9@$!+]/g, "");
}

function normalizeWord(raw: string): string[] {
  const lower = raw.toLowerCase();
  const stripped = stripPunctuation(lower);
  const leetNorm = normalizeLeet(stripped);
  const collapsed = collapseRepeats(leetNorm);
  const collapsedSingle = collapsed.replace(/(.)\1+/g, "$1");

  const variants = new Set<string>();
  variants.add(stripped);
  variants.add(leetNorm);
  variants.add(collapsed);
  variants.add(collapsedSingle);
  variants.add(collapseRepeats(stripped));
  variants.add(stripped.replace(/(.)\1+/g, "$1"));

  return Array.from(variants).filter(Boolean);
}

export function detectCurseWords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const detected: string[] = [];
  const alreadyFound = new Set<string>();

  for (const rawWord of words) {
    const variants = normalizeWord(rawWord);

    for (const variant of variants) {
      let matched = false;
      for (const curse of CURSE_WORDS) {
        if (variant === curse) {
          if (!alreadyFound.has(curse)) {
            detected.push(curse);
            alreadyFound.add(curse);
          }
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  return detected;
}

export function isCurseWord(word: string): boolean {
  const variants = normalizeWord(word);
  return variants.some((v) => CURSE_WORDS.includes(v));
}

export { CURSE_WORDS };
