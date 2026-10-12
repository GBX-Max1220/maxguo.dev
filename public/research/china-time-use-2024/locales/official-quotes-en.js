/* official-quotes-en.js — English renderings of the official Chinese definitions.
 *
 * The official text of the 2024 NBS bulletins exists only in Chinese. The strings here
 * are OUR TRANSLATIONS of quoted official footnotes, published for English readers;
 * they are never presented as an official English version, and the Chinese original is
 * always shown alongside them on the English page.
 *
 * Keys match data/audited/official_notes.json (i.e. DATA.definitions).
 */
export const OFFICIAL_EN = {
  unpaid_definition:
    "Footnote [8]: the unpaid-work domain covers the activity categories of housework, "
    + "accompanying and caring for family members, and buying goods or services; it also covers "
    + "unpaid internship within the employment category, and voluntary work within the social "
    + "interaction category.",
  paid_definition:
    "Footnote [7]: the paid-work domain covers all categories within the employment activity "
    + "category except unpaid internship and similar activities.",
  discretionary_definition:
    "Footnote [9]: the personal discretionary-activities domain covers exercise and fitness, "
    + "leisure and entertainment, and similar activity categories.",
  week_weighting:
    "When calculating the time residents spent on a type of activity, a week is weighted as "
    + "five weekdays and two rest days (5/7 and 2/7).",
  six_domains:
    "Residents' daily time is divided into six mutually exclusive activity domains: personal "
    + "necessities, paid work, unpaid work, personal discretionary activities, education and "
    + "training, and transport.",
  sample_scope:
    "The survey covers usual residents aged 6 and over in sampled households; the field period "
    + "was 11–31 May 2024.",
  age_paid_caution:
    "Respondents aged 6–15 are not counted as having engaged in paid activity.",
};

export const TRANSLATION_NOTE = {
  zh: "官方公报仅有中文文本；下列英文为译者译文，不是官方英文版本。",
  en: "The official bulletins exist in Chinese only. The English lines below are our "
    + "translation of the quoted official footnotes, not an official English version.",
};

export default OFFICIAL_EN;
