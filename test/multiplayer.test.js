const assert = require("node:assert/strict");

const {
  buildPlayers,
  getChapterOptions,
  formatPossessive,
  getDefaultQuestionCount,
  getLeaders,
  getModeLabel,
  getChapterInputValue,
  getQuestionUnit,
  getPlayerCountOptions,
  getQuestionCountOptions,
  getQuestionsForChapter,
  getQuestionsForUnit,
  getQuestionsForSubject,
  getRoundSize,
  getSubjectLabel,
  getSubjectOptions,
  getUnitOptions,
  getValidQuestionCount,
  normalizeChapter,
  usesUnits,
} = require("../quiz.js");

assert.deepEqual(getPlayerCountOptions(150, 6), [1, 2, 3, 4, 5, 6]);
assert.deepEqual(getPlayerCountOptions(3, 6), [1, 2, 3]);

assert.deepEqual(getQuestionCountOptions(10, 1), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.deepEqual(getQuestionCountOptions(10, 3), [3, 6, 9]);
assert.equal(getDefaultQuestionCount(getQuestionCountOptions(10, 1), 4), 4);
assert.equal(getDefaultQuestionCount(getQuestionCountOptions(10, 3), 4), 6);
assert.equal(getValidQuestionCount(8, [3, 6, 9], 6), 6);
assert.equal(getValidQuestionCount(9, [3, 6, 9], 6), 9);
assert.equal(getRoundSize(150, 6, 3), 6);
assert.equal(getRoundSize(5, 6, 3), 3);
assert.equal(getRoundSize(2, 6, 3), 0);

const chapterFixtures = [
  { chapter: 2, subject: "science", question: "A" },
  { chapter: 1, subject: "science", question: "B" },
  { chapter: 2, subject: "science", question: "C" },
];
assert.deepEqual(getChapterOptions(chapterFixtures), [
  { chapter: 1, count: 1 },
  { chapter: 2, count: 2 },
]);
assert.deepEqual(getQuestionsForChapter(chapterFixtures, "all"), chapterFixtures);
assert.deepEqual(getQuestionsForChapter(chapterFixtures, "2"), [
  { chapter: 2, subject: "science", question: "A" },
  { chapter: 2, subject: "science", question: "C" },
]);

const subjectFixtures = [
  { chapter: 1, question: "A" },
  { chapter: 1, subject: "civics", unit: "1.3", question: "B" },
  { chapter: 2, subject: "science", question: "C" },
  { chapter: 1, subject: "civics", unit: "1.3", question: "D" },
];
assert.deepEqual(getSubjectOptions(subjectFixtures), [
  { subject: "science", count: 2 },
  { subject: "civics", count: 2 },
]);
assert.deepEqual(getQuestionsForSubject(subjectFixtures, "science"), [
  { chapter: 1, question: "A" },
  { chapter: 2, subject: "science", question: "C" },
]);
assert.deepEqual(getQuestionsForSubject(subjectFixtures, "civics"), [
  { chapter: 1, subject: "civics", unit: "1.3", question: "B" },
  { chapter: 1, subject: "civics", unit: "1.3", question: "D" },
]);
assert.deepEqual(getUnitOptions(getQuestionsForSubject(subjectFixtures, "civics")), [{ chapter: "1.3", count: 2 }]);
assert.deepEqual(getQuestionsForUnit(getQuestionsForSubject(subjectFixtures, "civics"), "1.3"), [
  { chapter: 1, subject: "civics", unit: "1.3", question: "B" },
  { chapter: 1, subject: "civics", unit: "1.3", question: "D" },
]);
assert.equal(getSubjectLabel("civics"), "Civics");
assert.equal(getSubjectLabel(undefined), "Science");
assert.equal(getModeLabel("science", "all"), "Science: all chapters");
assert.equal(getModeLabel("civics", "1.3"), "Civics: unit 1.3");
assert.equal(getChapterInputValue("all"), "All chapters");
assert.equal(getChapterInputValue("14"), "Chapter 14");
assert.equal(getChapterInputValue("all", "civics"), "All units");
assert.equal(getChapterInputValue("1.3", "civics"), "Unit 1.3");
assert.equal(normalizeChapter("Chapter 14"), "14");
assert.equal(normalizeChapter("14"), "14");
assert.equal(normalizeChapter("Unit 1.3", "civics"), "1.3");
assert.equal(normalizeChapter("1.3", "civics"), "1.3");
assert.equal(normalizeChapter("All chapters"), "all");
assert.equal(normalizeChapter("All units", "civics"), "all");
assert.equal(getQuestionUnit({ chapter: 1, subject: "civics", unit: "1.3" }), "1.3");
assert.equal(usesUnits("civics"), true);
assert.equal(usesUnits("science"), false);

const scienceQuestions = getQuestionsForSubject(require("../data/free-studies.json"), "science");
const chapter15 = getQuestionsForChapter(scienceQuestions, "15");
const unit14 = getQuestionsForChapter(scienceQuestions, "15:1.4");
const unit21 = getQuestionsForChapter(scienceQuestions, "15:2.1");
assert.equal(unit14.length, 20);
assert.equal(unit21.length, 20);
assert.equal(chapter15.length, unit14.length + unit21.length);
assert.equal(unit21.filter((question) => question.id >= 801).length, 15);
assert.deepEqual(getChapterOptions(chapter15), [
  { chapter: 15, count: 40 },
]);
for (const selection of ["15:1.4", "15:2.1"]) {
  assert.equal(normalizeChapter(selection), selection);
  assert.equal(normalizeChapter(getChapterInputValue(selection)), selection);
}
assert.equal(getChapterInputValue("15:1.4"), "Chapter 15 — Unit 1.4 (pages 143–149)");
assert.equal(getModeLabel("science", "15:2.1"), "Science: chapter 15 — Unit 2.1 (pages 150–157)");
assert.ok(getQuestionsForChapter(scienceQuestions, "all").includes(unit21[0]));
assert.ok(getQuestionsForChapter(scienceQuestions, "study-guide").every((question) => question.studyGuide === "waves"));

assert.deepEqual(buildPlayers(1, [""]), [{ name: "You", score: 0 }]);
assert.deepEqual(buildPlayers(3, ["Ana", "", "Mia"]), [
  { name: "Ana", score: 0 },
  { name: "Player 2", score: 0 },
  { name: "Mia", score: 0 },
]);

assert.deepEqual(
  getLeaders([
    { name: "Ana", score: 1 },
    { name: "Bia", score: 3 },
    { name: "Cam", score: 3 },
  ]).map((player) => player.name),
  ["Bia", "Cam"],
);

assert.equal(formatPossessive("You"), "Your");
assert.equal(formatPossessive("Ana"), "Ana's");
assert.equal(formatPossessive("James"), "James'");

console.log("multiplayer helper tests passed");

const data = require('../data/free-studies.json');
const guide = getQuestionsForChapter(data, 'study-guide');
assert.equal(guide.length, 200);
assert.ok(guide.every((question) => question.studyGuide === 'waves'));
assert.ok(getQuestionsForChapter(data, 'all').every((question) => !question.studyGuide));
assert.ok(getQuestionsForChapter(data, '14').every((question) => !question.studyGuide));
assert.equal(getModeLabel('science', 'study-guide'), 'Study Guide: Waves');

// The round limit preserves unique questions and equal player turns.
assert.equal(getQuestionCountOptions(500, 1).at(-1), 200);
assert.equal(getQuestionCountOptions(500, 3).at(-1), 198);
assert.equal(getRoundSize(500, 250, 1), 200);
assert.equal(getRoundSize(500, 250, 3), 198);
assert.equal(getQuestionCountOptions(10, 1).at(-1), 10);
assert.equal(getRoundSize(10, 200, 1), 10);
assert.deepEqual(getQuestionCountOptions(0, 1), []);
