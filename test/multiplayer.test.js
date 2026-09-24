const assert = require("node:assert/strict");

const {
  buildPlayers,
  getChapterOptions,
  formatPossessive,
  getDefaultQuestionCount,
  getLeaders,
  getModeLabel,
  getPlayerCountOptions,
  getQuestionCountOptions,
  getQuestionsForChapter,
  getQuestionsForSubject,
  getRoundSize,
  getSubjectLabel,
  getSubjectOptions,
  isCorrectAnswer,
  normalizeAnswer,
} = require("../quiz.js");

assert.deepEqual(getPlayerCountOptions(150, 6), [1, 2, 3, 4, 5, 6]);
assert.deepEqual(getPlayerCountOptions(3, 6), [1, 2, 3]);

assert.deepEqual(getQuestionCountOptions(10, 1), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.deepEqual(getQuestionCountOptions(10, 3), [3, 6, 9]);
assert.equal(getDefaultQuestionCount(getQuestionCountOptions(10, 1), 4), 4);
assert.equal(getDefaultQuestionCount(getQuestionCountOptions(10, 3), 4), 6);
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
  { chapter: 1, subject: "civics", question: "B" },
  { chapter: 2, subject: "science", question: "C" },
  { chapter: 1, subject: "civics", question: "D" },
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
  { chapter: 1, subject: "civics", question: "B" },
  { chapter: 1, subject: "civics", question: "D" },
]);
assert.equal(getSubjectLabel("civics"), "Civics");
assert.equal(getSubjectLabel(undefined), "Science");
assert.equal(getModeLabel("science", "all"), "Science: all chapters");
assert.equal(getModeLabel("civics", "1"), "Civics: chapter 1");

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

assert.equal(normalizeAnswer("  The   STATES  "), "the states");
assert.equal(isCorrectAnswer(" The states ", "the states"), true);
assert.equal(isCorrectAnswer("the president", "the states"), false);

console.log("multiplayer helper tests passed");
