const assert = require('node:assert/strict');
const questions = require('../data/free-studies.json');
const {
  getQuestionsForSubject, getQuestionsForChapter, getQuestionsForUnit,
  getChapterOptions, getUnitOptions, getQuestionCountOptions, getRoundSize,
} = require('../quiz.js');

assert.equal(questions.length, 5400);
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
assert.equal(buckets.size, 27);
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
for (const [unit, document, allowedPages] of [
  ['1.4', 'Copy of 1.4 bill of rights master.pdf', [7, 8, 9, 10, 11, 12, 13, 14, 15]],
  ['2.1', '2.1 Federalism master.pptx (1).pdf', [4, 5, 6, 7, 8]],
]) {
  const pool = getQuestionsForUnit(getQuestionsForSubject(questions, 'civics'), unit);
  assert.equal(pool.length, 200);
  for (const q of pool) {
    assert.equal(q.source.document, document);
    assert.ok(q.source.pages.length > 0);
    assert.ok(q.source.pages.every(page => allowedPages.includes(page)),
      `Question ${q.id}: outside the requested Civics slide boundaries`);
  }
}
for (const [chapter, firstPage, lastPage] of [[22, 228, 236], [23, 239, 248]]) {
  const pool = getQuestionsForChapter(getQuestionsForSubject(questions, 'science'), String(chapter));
  assert.equal(pool.length, 200);
  for (const q of pool) {
    assert.ok(q.source.images.length > 0);
    assert.ok(q.source.pages.length > 0);
    assert.ok(q.source.pages.every(page => page >= firstPage && page <= lastPage),
      `Question ${q.id}: outside the supplied Science pages`);
  }
}
console.log('Question bank: 27 sets of 200; unique prompts, valid choices, source boundaries, and selectable 200-question rounds verified.');
