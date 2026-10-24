const assert = require('node:assert/strict');
const questions = require('../data/free-studies.json');
const {
  getQuestionsForSubject, getQuestionsForChapter, getQuestionsForUnit,
  getChapterOptions, getUnitOptions, getQuestionCountOptions, getRoundSize,
} = require('../quiz.js');

assert.equal(questions.length, 4600);
assert.equal(new Set(questions.map(q => q.id)).size, questions.length, 'IDs must remain unique');
const buckets = new Map();
for (const q of questions) {
  const key = [q.subject || 'science', q.chapter, q.unit || '', q.studyGuide || ''].join(':');
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(q);
  assert.equal(q.alternatives.length, 4, `Question ${q.id}: four choices required`);
  assert.equal(new Set(q.alternatives).size, 4, `Question ${q.id}: duplicate choices`);
  assert.ok(q.alternatives.includes(q.correctAnswer), `Question ${q.id}: answer must match a choice`);
  for (const field of ['question', 'usageExample', 'tip']) {
    assert.ok(typeof q[field] === 'string' && q[field].trim(), `Question ${q.id}: missing ${field}`);
  }
  if (q.id > 865) assert.ok(q.explanation?.trim(), `Question ${q.id}: new questions need explanations`);
}
assert.equal(buckets.size, 23);
for (const [key, pool] of buckets) {
  assert.equal(pool.length, 200, `${key}: each practice set needs 200 questions`);
  assert.equal(new Set(pool.map(q => q.question.toLowerCase().trim())).size, 200, `${key}: repeated prompt`);
}

// Check the actual app selections, including all-chapter pools and split units.
for (const subject of ['science', 'civics', 'math']) {
  const all = getQuestionsForSubject(questions, subject);
  const regular = all.filter(q => !q.studyGuide);
  assert.equal(new Set(regular.map(q => q.question.toLowerCase().trim())).size, regular.length,
    `${subject}: all-chapter practice must not contain repeated prompts`);
  const choices = subject === 'civics' ? getUnitOptions(regular) : getChapterOptions(regular);
  for (const {chapter} of choices) {
    const pool = subject === 'civics'
      ? getQuestionsForUnit(all, String(chapter))
      : getQuestionsForChapter(all, String(chapter));
    assert.ok(pool.length >= 200, `${subject} ${chapter}: selectable pool too small`);
    assert.equal(getQuestionCountOptions(pool.length, 1).at(-1), 200);
    assert.equal(getRoundSize(pool.length, 200, 1), 200);
  }
}
for (const unit of ['15:1.4', '15:2.1']) {
  assert.equal(getQuestionsForChapter(getQuestionsForSubject(questions, 'science'), unit).length, 200);
}
console.log('Question bank: 23 sets of 200; unique prompts, valid choices, and selectable 200-question rounds verified.');
