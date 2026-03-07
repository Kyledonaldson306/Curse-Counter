const CURSE_WORDS = [
  "damn", "dammit", "damnit", "goddamn", "goddamnit", "goddamned",
  "hell", "hellhole",
  "crap", "crappy", "crappiest",
  "piss", "pissed", "pissing", "pissoff",
  "bastard", "bastards",
  "bloody",

  "shit", "shits", "shitty", "shittiest", "shitter", "bullshit", "horseshit",
  "dipshit", "shithead", "shitface", "shitshow", "shithole", "shitstain",
  "batshit", "apeshit", "chickenshit",

  "fuck", "fucker", "fuckers", "fucking", "fucked", "fucks",
  "motherfucker", "motherfucking", "motherfuckers",
  "clusterfuck", "fuckface", "fuckhead", "fuckwit", "fuckboy",
  "fuckoff", "fuckup", "unfuckingbelievable",
  "wtf", "stfu", "gtfo",

  "ass", "asses", "asshole", "assholes", "dumbass", "jackass",
  "badass", "smartass", "fatass", "asshat", "assclown", "asswipe",
  "lardass", "lazyass", "hardass", "kickass",

  "bitch", "bitches", "bitchy", "bitching", "bitchass",
  "sonofabitch", "sonuvabitch",

  "dick", "dicks", "dickhead", "dickwad", "dickface", "dickbag",
  "dickweed", "dickless",

  "cock", "cocks", "cocksucker", "cocksuckers", "cocky",
  "cockblock", "cockhead",

  "penis", "wiener",
  "whore", "whores", "whorehouse",
  "slut", "sluts", "slutty", "slutshaming",
  "douche", "douchebag", "douchebags", "douchey", "douchy",
  "twat", "twats", "twatwaffle",
  "wanker", "wankers", "wank",
  "bollocks",
  "arse", "arsehole", "arseholes",
  "tits", "titty", "titties",
  "boobs", "boobies",
  "cunt", "cunts",
  "suck", "sucks", "sucking",
  "blows",
  "screw", "screwed", "screwing", "screwyou",

  "nigger", "niggers", "nigga", "niggas", "negro", "negros",
  "spic", "spics", "spick", "spicks",
  "wetback", "wetbacks",
  "beaner", "beaners",
  "chink", "chinks",
  "gook", "gooks",
  "jap", "japs",
  "kike", "kikes",
  "raghead", "ragheads",
  "towelhead", "towelheads",
  "camelhumper",
  "cracker", "crackers",
  "honky", "honkey", "honkies",
  "gringo", "gringos",
  "redskin", "redskins",
  "injun",
  "coon", "coons",
  "darkie", "darkies", "darky",
  "porchmonkey",
  "zipperhead",
  "halfbreed",

  "faggot", "faggots", "fag", "fags", "faggy",
  "dyke", "dykes",
  "homo", "homos",
  "queer", "queers",
  "tranny", "trannies",
  "shemale", "shemales",
  "lesbo", "lesbos",
  "pansy", "pansies",
  "sissy", "sissies",
  "sodomite",
  "buttboy",

  "retard", "retards", "retarded", "tard", "tards",
  "spaz", "spazz", "spastic",
  "cripple", "crippled",
  "mongoloid",

  "skank", "skanks", "skanky",
  "hoe", "hoes", "hoebag",
  "tramp", "tramps",
  "floozy", "floozies",
  "hooker", "hookers",
  "prostitute",
  "tart", "tarts",
  "trollop",

  "prick", "pricks",
  "bellend", "bellends",
  "knob", "knobhead", "knobend",
  "tosser", "tossers",
  "pillock",
  "plonker",
  "minger", "minging",
  "git",
  "sod", "sodoff",
  "bugger", "buggers", "buggery",
  "wazzock",
  "berk",
  "numpty",

  "choad", "chode",
  "gooch",
  "taint",
  "queef", "queefs",
  "felch",
  "rimjob",
  "jizz", "jizzed",
  "cum", "cumshot", "cumming",
  "spunk",
  "dildo", "dildos",
  "buttplug",
  "blowjob", "blowjobs",
  "handjob",
  "jackoff", "jerkoff", "wankoff",
  "circlejerk",
  "bukakke", "bukkake",
  "creampie",

  "goddamnfucking", "motherfuckingshit",
  "shitfuck", "fuckshit",
  "asshat", "assmonkey", "buttmunch", "buttface", "butthead",
  "dirtbag", "scumbag", "scumbags",
  "sleazebag", "sleazeball",
  "ratbastard",
  "nutjob", "nutcase",
  "psycho",
  "pervert", "perv", "pervs", "perverted",

  "friggin", "freakin", "freaking", "effing", "effin",

  "biatch", "biotch", "beyotch",
  "mofo",
  "sob",
  "sumbitch",

  "shtick", "schmuck", "schmucks",
  "putz",
  "gonads", "nads",
  "balls", "ballsack",
  "nutsack",
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
  "8": "b",
  "9": "g",
  "6": "g",
  "2": "z",
};

const CURSE_SET = new Set(CURSE_WORDS);

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

  for (let i = 0; i < words.length; i++) {
    if (i + 1 < words.length) {
      const bigram = words[i] + words[i + 1];
      const bigramVariants = normalizeWord(bigram);
      let bigramMatched = false;
      for (const variant of bigramVariants) {
        if (CURSE_SET.has(variant) && !alreadyFound.has(variant)) {
          detected.push(variant);
          alreadyFound.add(variant);
          bigramMatched = true;
          break;
        }
      }
      if (bigramMatched) {
        i++;
        continue;
      }
    }

    const variants = normalizeWord(words[i]);
    for (const variant of variants) {
      if (CURSE_SET.has(variant)) {
        if (!alreadyFound.has(variant)) {
          detected.push(variant);
          alreadyFound.add(variant);
        }
        break;
      }
    }
  }

  return detected;
}

export function isCurseWord(word: string): boolean {
  const variants = normalizeWord(word.trim());
  return variants.some((v) => CURSE_SET.has(v));
}

export { CURSE_WORDS };
