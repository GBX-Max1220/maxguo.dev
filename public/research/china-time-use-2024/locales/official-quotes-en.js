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
    + "unpaid internship and similar employment activities within the employment activity "
    + "category, and voluntary work within the social interaction category.",
  paid_definition:
    "Footnote [7]: the paid-work domain covers all categories within the employment activity "
    + "category except unpaid internship and similar employment activities.",
  discretionary_definition:
    "Footnote [9]: the personal discretionary-activities domain covers the activity categories "
    + "of exercise and fitness, culture, leisure and entertainment, and similar categories, as "
    + "well as all other categories within the social interaction category except voluntary work.",
  week_weighting:
    "To calculate the time residents took part in a type of activity, the time-use data for that "
    + "activity in diary table 1 and diary table 2 are aggregated weighted by 5/7 and 2/7 "
    + "respectively, producing the main indicators calculated over a seven-day week, namely the "
    + "daily average time of residents, the daily average time of participants and the "
    + "activity participation rate.",
  six_domains:
    "Footnote [2]: residents' main activity domains include six domains: personal necessities, "
    + "paid work, unpaid work, personal discretionary activities, education and training, and "
    + "transport.",
  sample_scope:
    "The subjects of the Third National Time Use Survey were the sampled households and their "
    + "usual residents aged 6 and over. Nationwide the survey covered 38,500 households and "
    + "107,000 people, of whom about 53,000 were men and about 54,000 were women; about 64,000 "
    + "were in urban areas and about 43,000 were in rural areas.",
  age_paid_caution:
    "Footnote [1]: in the actual survey, residents aged 6-15 had no activities in the paid-work "
    + "domain.",
};

export const TRANSLATION_NOTE = {
  zh: "官方公报仅有中文文本；下列英文为译者译文，不是官方英文版本。",
  en: "The official bulletins exist in Chinese only. The English lines below are our "
    + "translation of the quoted official footnotes, not an official English version.",
};

export default OFFICIAL_EN;
