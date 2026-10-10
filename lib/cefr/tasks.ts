import type { TestTask, CEFRLevel, TaskFormat, TestLanguage } from "@/types";
import { ENGLISH_TASK_BANK } from "@/lib/cefr/tasks-en";

const ARABIC_TASK_BANK: TestTask[] = [
  // ============ Pre-A1: Muqaddimah (basic words) ============
  {
    language: "ar",
    id: "pre-a1-muq-1",
    level: "Pre-A1",
    format: "muqaddimah",
    prompt_ar:
      "قُلْ: السَّلامُ عَلَيْكُمْ، اِسْمي ... ، وَأَنا مِنْ ...",
    prompt_id:
      "Say the greeting, state your name, and mention your city/country of origin (e.g. السلام عليكم، اسمي أحمد، وأنا من جاكرتا).",
    durationSec: 30,
    preparationSec: 15,
  },
  {
    language: "ar",
    id: "pre-a1-muq-2",
    level: "Pre-A1",
    format: "muqaddimah",
    prompt_ar: "عُدَّ مِنْ وَاحِدٍ إِلى خَمْسَةٍ بِالعَرَبِيَّة.",
    prompt_id: "Count from one to five in Arabic.",
    durationSec: 30,
    preparationSec: 15,
  },
  {
    language: "ar",
    id: "pre-a1-muq-3",
    level: "Pre-A1",
    format: "muqaddimah",
    prompt_ar: "قُلْ ثَلاثَ كَلِماتٍ بَسيطَةٍ تَعْرِفُها: نَعَمْ، لا، شُكْراً.",
    prompt_id:
      "Say three simple words you know: yes (نعم), no (لا), thank you (شكراً).",
    durationSec: 30,
    preparationSec: 15,
  },

  // ============ A1: Muqaddimah ============
  {
    language: "ar",
    id: "a1-muq-1",
    level: "A1",
    format: "muqaddimah",
    prompt_ar:
      "عَرِّفْ بِنَفْسِكَ: اِسْمُكَ، عُمْرُكَ، مَدِينَتُكَ، وَهِوايَتُكَ المُفَضَّلَة.",
    prompt_id:
      "Introduce yourself: name, age, city of residence, and favorite hobby.",
    durationSec: 45,
    preparationSec: 15,
  },
  {
    language: "ar",
    id: "a1-muq-2",
    level: "A1",
    format: "muqaddimah",
    prompt_ar: "تَكَلَّمْ عَنْ عائِلَتِكَ: مَنْ أَفْرادُها؟ ماذا يَعْمَلونَ؟",
    prompt_id:
      "Talk about your family: who the members are and what they do for work.",
    durationSec: 45,
    preparationSec: 15,
  },
  {
    language: "ar",
    id: "a1-muq-3",
    level: "A1",
    format: "muqaddimah",
    prompt_ar: "صِفْ يَوْمَكَ المُعْتادَ مِنَ الصَّباحِ إِلى المَساء.",
    prompt_id: "Describe your typical day from morning to evening.",
    durationSec: 45,
    preparationSec: 15,
  },

  // ============ A2: Muqaddimah + Wasf ============
  {
    language: "ar",
    id: "a2-muq-1",
    level: "A2",
    format: "muqaddimah",
    prompt_ar:
      "تَحَدَّثْ عَنْ مَدْرَسَتِكَ أَوْ جامِعَتِكَ: مَوْقِعُها، الأَساتِذَة، وَالمَوادُّ الَّتي تَدْرُسُها.",
    prompt_id:
      "Talk about your school or university: its location, teachers, and subjects you study.",
    durationSec: 60,
    preparationSec: 20,
  },
  {
    language: "ar",
    id: "a2-wasf-1",
    level: "A2",
    format: "wasf",
    prompt_ar:
      "اُنْظُرْ إِلى الصُّورَة وَصِفْ ما تَراهُ: الأَشْخاص، الأَلْوان، وَالأَنْشِطَة.",
    prompt_id:
      "Look at the image and describe what you see: people, colors, and activities.",
    image: "/images/wasf/market.svg",
    durationSec: 60,
    preparationSec: 20,
  },
  {
    language: "ar",
    id: "a2-muq-2",
    level: "A2",
    format: "muqaddimah",
    prompt_ar:
      "صِفْ آخِرَ رِحْلَةٍ قُمْتَ بِها: إِلى أَيْنَ ذَهَبْتَ، مَعَ مَنْ، وَماذا فَعَلْتَ؟",
    prompt_id:
      "Describe your most recent trip: where you went, with whom, and what you did.",
    durationSec: 60,
    preparationSec: 20,
  },

  // ============ B1: Wasf + Hiwar ============
  {
    language: "ar",
    id: "b1-wasf-1",
    level: "B1",
    format: "wasf",
    prompt_ar:
      "صِفْ هذِهِ الصُّورَة بِالتَّفْصيلِ، وَتَخَيَّلْ ما حَدَثَ قَبْلَها وَما سَيَحْدُثُ بَعْدَها.",
    prompt_id:
      "Describe this image in detail, and imagine what happened before and what will happen after.",
    image: "/images/wasf/family-dinner.svg",
    durationSec: 75,
    preparationSec: 25,
  },
  {
    language: "ar",
    id: "b1-hiwar-1",
    level: "B1",
    format: "hiwar",
    prompt_ar:
      "أَنْتَ في المَطار وَفَقَدْتَ حَقيبَتَكَ. تَحَدَّثْ مَعَ المُوَظَّفِ شارِحاً المُشْكِلَة وَطالِباً المُساعَدَة.",
    prompt_id:
      "You are at the airport and have lost your luggage. Speak with an officer, explain the problem, and ask for help.",
    durationSec: 75,
    preparationSec: 25,
  },
  {
    language: "ar",
    id: "b1-hiwar-2",
    level: "B1",
    format: "hiwar",
    prompt_ar:
      "تَخَيَّلْ أَنَّكَ تَتَّصِلُ بِصَديقِكَ لِدَعْوَتِهِ إِلى حَفْلَةِ عيدِ ميلادِكَ. اِشْرَحْ تَفاصيلَ الحَفْلَة.",
    prompt_id:
      "Imagine you are calling a friend to invite them to your birthday party. Explain the party details.",
    durationSec: 75,
    preparationSec: 25,
  },

  // ============ B2: Hiwar + Munaqasyah ============
  {
    language: "ar",
    id: "b2-hiwar-1",
    level: "B2",
    format: "hiwar",
    prompt_ar:
      "أَنْتَ في مُقابَلَةِ عَمَل. تَحَدَّثْ عَنْ خِبْراتِكَ وَلِماذا أَنْتَ المُرَشَّحُ المُناسِبُ لِهذِهِ الوَظيفَة.",
    prompt_id:
      "You are in a job interview. Talk about your experience and why you are the right candidate.",
    durationSec: 90,
    preparationSec: 30,
  },
  {
    language: "ar",
    id: "b2-mun-1",
    level: "B2",
    format: "munaqasyah",
    prompt_ar:
      "ما رَأْيُكَ في اِسْتِخْدامِ الهاتِفِ الذَّكِيِّ في المَدارِس؟ اِذْكُرْ ثَلاثَةَ أَسْبابٍ تَدْعَمُ رَأْيَكَ.",
    prompt_id:
      "What is your opinion on smartphone use in schools? Give three reasons supporting your view.",
    durationSec: 90,
    preparationSec: 30,
  },
  {
    language: "ar",
    id: "b2-mun-2",
    level: "B2",
    format: "munaqasyah",
    prompt_ar:
      "هَلْ تُفَضِّلُ العَمَلَ مِنَ المَنْزِلِ أَمْ في المَكْتَب؟ اِشْرَحْ مَزايا وَعُيوبَ كُلِّ خِيار.",
    prompt_id:
      "Do you prefer working from home or in the office? Explain the advantages and disadvantages of each.",
    durationSec: 90,
    preparationSec: 30,
  },

  // ============ C1: Munaqasyah ============
  {
    language: "ar",
    id: "c1-mun-1",
    level: "C1",
    format: "munaqasyah",
    prompt_ar:
      "ناقِشْ أَثَرَ وَسائِلِ التَّواصُلِ الاجْتِماعِيِّ عَلى الشَّبابِ في العالَمِ العَرَبِيِّ، مَعَ ذِكْرِ أَمْثِلَةٍ مَلْموسَة.",
    prompt_id:
      "Discuss the impact of social media on youth in the Arab world, with concrete examples.",
    durationSec: 90,
    preparationSec: 30,
  },
  {
    language: "ar",
    id: "c1-mun-2",
    level: "C1",
    format: "munaqasyah",
    prompt_ar:
      "كَيْفَ يُمْكِنُ المُوازَنَةُ بَيْنَ الحِفاظِ عَلى التُّراثِ الثَّقافِيِّ وَمُواكَبَةِ التَّطَوُّرِ التِّكْنولوجِيّ؟",
    prompt_id:
      "How can we balance preserving cultural heritage with keeping pace with technological development?",
    durationSec: 90,
    preparationSec: 30,
  },

  // ============ C2: Advanced Munaqasyah ============
  {
    language: "ar",
    id: "c2-mun-1",
    level: "C2",
    format: "munaqasyah",
    prompt_ar:
      "حَلِّلْ التَّوَتُّرَ بَيْنَ العَوْلَمَةِ وَالهُوِيَّةِ الوَطَنِيَّةِ في العَصْرِ الحَديث، مُسْتَشْهِداً بِأَدِلَّةٍ مِنَ الواقِعِ المُعاصِر.",
    prompt_id:
      "Analyze the tension between globalization and national identity in the modern era, with evidence from contemporary reality.",
    durationSec: 90,
    preparationSec: 30,
  },
  {
    language: "ar",
    id: "c2-mun-2",
    level: "C2",
    format: "munaqasyah",
    prompt_ar:
      "ما الدَّوْرُ الَّذي يَنْبَغي أَنْ تَلْعَبَهُ الذَّكاءُ الاصْطِناعِيُّ في صِناعَةِ القَرارِ الأَخْلاقِيِّ وَالسِّياسِيّ؟",
    prompt_id:
      "What role should artificial intelligence play in ethical and political decision-making?",
    durationSec: 90,
    preparationSec: 30,
  },
];

export const TASK_BANK: TestTask[] = [...ARABIC_TASK_BANK, ...ENGLISH_TASK_BANK];

export function pickTaskForLevel(
  level: CEFRLevel,
  language: TestLanguage,
  excludeIds: string[] = [],
  preferredFormat?: TaskFormat,
): TestTask | null {
  const candidates = TASK_BANK.filter(
    (t) =>
      t.level === level &&
      t.language === language &&
      !excludeIds.includes(t.id) &&
      (preferredFormat ? t.format === preferredFormat : true),
  );
  if (candidates.length === 0) {
    const all = TASK_BANK.filter(
      (t) =>
        t.level === level &&
        t.language === language &&
        !excludeIds.includes(t.id),
    );
    if (all.length === 0) return null;
    return all[Math.floor(Math.random() * all.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getTaskById(id: string): TestTask | null {
  return TASK_BANK.find((t) => t.id === id) ?? null;
}
