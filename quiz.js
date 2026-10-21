const MAX_PLAYERS = 6;
const DEFAULT_QUESTION_TARGET = 10;

const hasDocument = typeof document !== "undefined";

const state = {
  allQuestions: [],
  queue: [],
  players: [],
  currentIndex: 0,
  streak: 0,
  answered: 0,
  missedIds: new Set(),
  roundMisses: [],
  resultView: "scores",
  locked: false,
  completed: false,
  selectedQuestionCount: 0,
  selectedSubject: "science",
  selectedChapter: "all",
};

const elements = {
  setupPanel: hasDocument ? document.querySelector("#setupPanel") : null,
  gamePanel: hasDocument ? document.querySelector("#gamePanel") : null,
  setupForm: hasDocument ? document.querySelector("#setupForm") : null,
  playerCount: hasDocument ? document.querySelector("#playerCount") : null,
  playerFields: hasDocument ? document.querySelector("#playerFields") : null,
  subjectSelect: hasDocument ? document.querySelector("#subjectSelect") : null,
  subjectHint: hasDocument ? document.querySelector("#subjectHint") : null,
  chapterSelectLabel: hasDocument ? document.querySelector("#chapterSelectLabel") : null,
  chapterSelect: hasDocument ? document.querySelector("#chapterSelect") : null,
  chapterHint: hasDocument ? document.querySelector("#chapterHint") : null,
  questionCount: hasDocument ? document.querySelector("#questionCount") : null,
  questionCountHint: hasDocument ? document.querySelector("#questionCountHint") : null,
  setupError: hasDocument ? document.querySelector("#setupError") : null,
  scoreValue: hasDocument ? document.querySelector("#scoreValue") : null,
  streakValue: hasDocument ? document.querySelector("#streakValue") : null,
  progressValue: hasDocument ? document.querySelector("#progressValue") : null,
  progressBar: hasDocument ? document.querySelector("#progressBar") : null,
  resultTabs: hasDocument ? document.querySelector("#resultTabs") : null,
  questionNumber: hasDocument ? document.querySelector("#questionNumber") : null,
  turnLabel: hasDocument ? document.querySelector("#turnLabel") : null,
  modeLabel: hasDocument ? document.querySelector("#modeLabel") : null,
  questionText: hasDocument ? document.querySelector("#questionText") : null,
  usageText: hasDocument ? document.querySelector("#usageText") : null,
  choicesLabel: hasDocument ? document.querySelector("#choicesLabel") : null,
  alternatives: hasDocument ? document.querySelector("#alternatives") : null,
  roundSummary: hasDocument ? document.querySelector("#roundSummary") : null,
  missedSummary: hasDocument ? document.querySelector("#missedSummary") : null,
  feedback: hasDocument ? document.querySelector("#feedback") : null,
  tipButton: hasDocument ? document.querySelector("#tipButton") : null,
  nextButton: hasDocument ? document.querySelector("#nextButton") : null,
  settingsButton: hasDocument ? document.querySelector("#settingsButton") : null,
  shuffleButton: hasDocument ? document.querySelector("#shuffleButton") : null,
  modeButtons: hasDocument ? document.querySelectorAll(".mode-button") : [],
};

async function loadQuestions() {
  try {
    const response = await fetch("data/free-studies.json");
    if (!response.ok) {
      throw new Error("Could not load questions.");
    }

    state.allQuestions = await response.json();
    initializeSetup();
  } catch (error) {
    elements.setupError.textContent = error.message;
    elements.setupError.classList.remove("hidden");
  }
}

function initializeSetup() {
  elements.playerCount.innerHTML = "";
  getPlayerCountOptions(state.allQuestions.length, MAX_PLAYERS).forEach((count) => {
    const option = document.createElement("option");
    option.value = count;
    option.textContent = `${count} player${count === 1 ? "" : "s"}`;
    elements.playerCount.append(option);
  });

  elements.playerCount.value = "1";
  renderPlayerFields();
  renderSubjectOptions();
  renderChapterOptions();
  renderQuestionCountOptions();
}

function renderPlayerFields() {
  const existingNames = getEnteredPlayerNames();
  const playerCount = Number(elements.playerCount.value);
  elements.playerFields.innerHTML = "";

  for (let index = 0; index < playerCount; index += 1) {
    const wrapper = document.createElement("div");
    wrapper.className = "player-field";

    const label = document.createElement("label");
    label.htmlFor = `playerName${index}`;
    label.textContent = playerCount === 1 ? "Your name" : `Player ${index + 1}`;

    const input = document.createElement("input");
    input.id = `playerName${index}`;
    input.name = `playerName${index}`;
    input.type = "text";
    input.maxLength = 24;
    input.placeholder = index === 0 ? "You" : `Player ${index + 1}`;
    input.value = existingNames[index] || "";

    wrapper.append(label, input);
    elements.playerFields.append(wrapper);
  }
}

function renderQuestionCountOptions() {
  const playerCount = Number(elements.playerCount.value);
  const availableQuestions = getSelectedQuestions().length;
  const options = getQuestionCountOptions(availableQuestions, playerCount);
  const previousValue = Number(elements.questionCount.value);

  const defaultCount = getDefaultQuestionCount(options, DEFAULT_QUESTION_TARGET);
  const maxQuestions = options[options.length - 1] || 0;
  const questionCount = getValidQuestionCount(previousValue, options, defaultCount);
  elements.questionCount.min = playerCount;
  elements.questionCount.max = maxQuestions;
  elements.questionCount.step = playerCount;
  elements.questionCount.value = questionCount;

  const questionsEach = Number(elements.questionCount.value) / playerCount;
  elements.questionCount.disabled = options.length === 0;
  elements.questionCountHint.textContent =
    options.length === 0
      ? "Choose fewer players or another chapter."
      : `Type a multiple of ${playerCount}, up to ${maxQuestions}. ${questionsEach} turn${
          questionsEach === 1 ? "" : "s"
        } per player.`;
}

function renderSubjectOptions() {
  const subjects = getSubjectOptions(state.allQuestions);
  const previousSubject = state.selectedSubject;
  elements.subjectSelect.innerHTML = "";

  subjects.forEach(({ subject, count }) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = `${getSubjectLabel(subject)} (${count} questions)`;
    elements.subjectSelect.append(option);
  });

  state.selectedSubject = subjects.some(({ subject }) => subject === previousSubject)
    ? previousSubject
    : subjects[0]?.subject || "science";
  elements.subjectSelect.value = state.selectedSubject;
  updateSubjectHint();
}

function renderChapterOptions() {
  const subjectQuestions = getQuestionsForSubject(state.allQuestions, state.selectedSubject);
  const useUnits = usesUnits(state.selectedSubject);
  const chapterQuestions = subjectQuestions.filter((question) => !question.studyGuide);
  const guideCount = subjectQuestions.filter((question) => question.studyGuide === "waves").length;
  const chapters = useUnits ? getUnitOptions(subjectQuestions) : getChapterOptions(chapterQuestions);
  elements.chapterSelect.innerHTML = "";
  elements.chapterSelectLabel.textContent = useUnits ? "Choose which unit" : "Chapter";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = `${useUnits ? "All units" : "All chapters"} (${chapterQuestions.length} questions)`;
  elements.chapterSelect.append(allOption);

  chapters.forEach(({ chapter, count }) => {
    const option = document.createElement("option");
    option.value = String(chapter);
    option.textContent = `${useUnits ? `Unit ${chapter}` : getChapterInputValue(chapter)} (${count} questions)`;
    elements.chapterSelect.append(option);
  });

  if (guideCount) {
    const option = document.createElement("option");
    option.value = "study-guide";
    option.textContent = `Study Guide: Waves (${guideCount} questions)`;
    elements.chapterSelect.append(option);
  }
  const hasSelectedChapter =
    (state.selectedChapter === "study-guide" && guideCount > 0) ||
    state.selectedChapter === "all" ||
    chapters.some(({ chapter }) => String(chapter) === String(state.selectedChapter));
  state.selectedChapter = hasSelectedChapter ? state.selectedChapter : "all";
  elements.chapterSelect.value = state.selectedChapter;
  updateChapterHint();
}

function updateSubjectHint() {
  const count = getQuestionsForSubject(state.allQuestions, state.selectedSubject).length;
  elements.subjectHint.textContent = `${count} ${getSubjectLabel(state.selectedSubject).toLowerCase()} question${
    count === 1 ? "" : "s"
  } available.`;
}

function updateChapterHint() {
  const count = getSelectedQuestions().length;
  elements.chapterHint.textContent = `${count} question${count === 1 ? "" : "s"} available.`;
}

function handleSetupSubmit(event) {
  event.preventDefault();

  const playerCount = Number(elements.playerCount.value);
  const selectedQuestionCount = Math.floor(Number(elements.questionCount.value));
  state.selectedSubject = elements.subjectSelect.value;
  state.selectedChapter = elements.chapterSelect.value;
  const availableQuestions = getSelectedQuestions().length;

  if (
    !Number.isInteger(selectedQuestionCount) ||
    selectedQuestionCount < playerCount ||
    selectedQuestionCount > availableQuestions ||
    selectedQuestionCount % playerCount !== 0
  ) {
    showSetupError(`Type a question count from ${playerCount} to ${availableQuestions} that divides evenly between the players.`);
    return;
  }

  if (getSelectedQuestions().length < playerCount) {
    showSetupError("Choose a chapter with at least one question per player.");
    return;
  }

  state.players = buildPlayers(playerCount, getEnteredPlayerNames());
  state.selectedQuestionCount = selectedQuestionCount;
  elements.setupPanel.classList.add("hidden");
  elements.gamePanel.classList.remove("hidden");
  startPractice();
}

function startPractice() {
  state.currentIndex = 0;
  state.streak = 0;
  state.answered = 0;
  state.roundMisses = [];
  state.resultView = "scores";
  state.locked = false;
  state.completed = false;
  state.players = state.players.map((player) => ({ ...player, score: 0 }));
  const questionPool = getSelectedQuestions();

  const roundSize = getRoundSize(
    questionPool.length,
    state.selectedQuestionCount || questionPool.length,
    state.players.length,
  );
  state.queue = shuffle([...questionPool]).slice(0, roundSize);
  elements.resultTabs.classList.add("hidden");
  updateResultTabs();
  renderQuestion();
}

function renderQuestion() {
  updateStats();
  elements.feedback.classList.remove("hidden");
  elements.tipButton.classList.remove("hidden");
  elements.nextButton.classList.remove("hidden");
  elements.roundSummary.classList.add("hidden");
  elements.roundSummary.innerHTML = "";
  elements.missedSummary.classList.add("hidden");
  elements.missedSummary.innerHTML = "";

  if (state.queue.length === 0) {
    elements.questionNumber.textContent = "No questions";
    elements.turnLabel.textContent = "";
    elements.modeLabel.textContent = getModeLabel(state.selectedSubject, state.selectedChapter);
    elements.questionText.textContent = "No questions found";
    elements.usageText.textContent = "Check the JSON file and refresh the page.";
    elements.choicesLabel.classList.add("hidden");
    elements.alternatives.innerHTML = "";
    elements.feedback.classList.add("hidden");
    elements.tipButton.disabled = true;
    elements.nextButton.disabled = true;
    return;
  }

  const question = getCurrentQuestion();
  state.locked = false;

  elements.tipButton.disabled = false;
  elements.nextButton.disabled = true;
  elements.nextButton.textContent = "Next";
  elements.questionNumber.textContent = `Question ${state.currentIndex + 1}`;
  elements.turnLabel.textContent = `${formatPossessive(getCurrentPlayer().name)} turn`;
  elements.modeLabel.textContent = getModeLabel(state.selectedSubject, state.selectedChapter);
  elements.questionText.textContent = question.question;
  elements.usageText.textContent = question.usageExample;
  elements.choicesLabel.classList.remove("hidden");
  setFeedback("Choose the answer that best matches the question.", "");

  elements.alternatives.innerHTML = "";
  shuffle([...question.alternatives]).forEach((alternative) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = alternative;
    button.addEventListener("click", () => chooseAnswer(button, alternative));
    elements.alternatives.append(button);
  });
}

function chooseAnswer(button, alternative) {
  if (state.locked) return;

  const question = getCurrentQuestion();
  const currentPlayer = getCurrentPlayer();
  const isCorrect = alternative === question.correctAnswer;
  state.locked = true;
  state.answered += 1;

  if (isCorrect) {
    currentPlayer.score += 1;
    state.streak += 1;
    state.missedIds.delete(question.id);
    setFeedback(`Correct, ${currentPlayer.name}. ${question.tip}`, "success");
  } else {
    state.streak = 0;
    state.missedIds.add(question.id);
    state.roundMisses.push({
      question: question.question,
      usageExample: question.usageExample,
      answerGiven: alternative,
      correctAnswer: question.correctAnswer,
      playerName: currentPlayer.name,
    });
    setFeedback(
      `Not quite, ${currentPlayer.name}. Correct answer: ${question.correctAnswer}. ${question.tip}`,
      "error",
    );
  }

  elements.alternatives.querySelectorAll(".answer-button").forEach((answerButton) => {
    answerButton.disabled = true;
    if (answerButton.textContent === question.correctAnswer) {
      answerButton.classList.add("correct");
    } else if (answerButton === button) {
      answerButton.classList.add("incorrect");
    }
  });

  elements.nextButton.disabled = false;
  elements.nextButton.textContent = state.answered >= state.queue.length ? "See results" : "Next";
  updateStats();
}

function showTip() {
  if (state.completed || state.queue.length === 0) return;

  const question = getCurrentQuestion();
  setFeedback(question.tip, "");
}

function nextQuestion() {
  if (state.queue.length === 0) return;

  if (state.answered >= state.queue.length) {
    showCompletedRound();
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

function showCompletedRound() {
  state.completed = true;
  state.locked = true;
  state.currentIndex = state.queue.length - 1;

  const leaders = getLeaders(state.players);
  state.resultView = "scores";
  elements.resultTabs.classList.remove("hidden");
  updateResultTabs();
  renderScoresView(leaders);
  updateStats();
}

function renderScoresView(leaders = getLeaders(state.players)) {
  elements.questionNumber.textContent = "Round complete";
  elements.turnLabel.textContent = "";
  elements.modeLabel.textContent = "Scores";
  elements.questionText.textContent = "Final scores";
  elements.usageText.textContent =
    leaders.length === 1
      ? `${leaders[0].name} wins with ${leaders[0].score} point${leaders[0].score === 1 ? "" : "s"}.`
      : `Tie game: ${leaders.map((player) => player.name).join(", ")}.`;
  elements.choicesLabel.classList.add("hidden");
  elements.alternatives.innerHTML = "";
  elements.missedSummary.classList.add("hidden");
  elements.missedSummary.innerHTML = "";
  renderRoundSummary(leaders);
  elements.feedback.classList.add("hidden");
  elements.tipButton.classList.add("hidden");
  elements.nextButton.classList.add("hidden");
  elements.nextButton.textContent = "Finished";
}

function renderRoundSummary(leaders) {
  const leaderNames = new Set(leaders.map((player) => player.name));
  elements.roundSummary.innerHTML = "";
  elements.roundSummary.classList.remove("hidden");

  [...state.players]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .forEach((player) => {
      const row = document.createElement("div");
      row.className = leaderNames.has(player.name) ? "score-row winner" : "score-row";

      const name = document.createElement("span");
      name.textContent = player.name;

      const score = document.createElement("span");
      const turns = getTurnsPerPlayer();
      const percentage = turns > 0 ? Math.round((player.score / turns) * 100) : 0;
      score.textContent = `${player.score}/${turns} · ${percentage}% correct`;

      row.append(name, score);
      elements.roundSummary.append(row);
    });
}

function renderMissedView() {
  elements.questionNumber.textContent = "Round complete";
  elements.turnLabel.textContent = "";
  elements.modeLabel.textContent = "Missed";
  elements.questionText.textContent = "Missed answers";
  elements.usageText.textContent =
    state.roundMisses.length === 0
      ? "No missed answers this round."
      : `${state.roundMisses.length} missed answer${state.roundMisses.length === 1 ? "" : "s"} this round.`;
  elements.choicesLabel.classList.add("hidden");
  elements.alternatives.innerHTML = "";
  elements.roundSummary.classList.add("hidden");
  elements.roundSummary.innerHTML = "";
  elements.feedback.classList.add("hidden");
  elements.tipButton.classList.add("hidden");
  elements.nextButton.classList.add("hidden");
  renderMissedSummary();
}

function renderMissedSummary() {
  elements.missedSummary.innerHTML = "";
  elements.missedSummary.classList.remove("hidden");

  if (state.roundMisses.length === 0) {
    const row = document.createElement("div");
    row.className = "missed-row";
    row.textContent = "Perfect round. Nothing to review here.";
    elements.missedSummary.append(row);
    return;
  }

  state.roundMisses.forEach((miss) => {
    const row = document.createElement("div");
    row.className = "missed-row";

    const question = document.createElement("div");
    question.className = "missed-question";

    const title = document.createElement("strong");
    title.textContent = miss.question;

    const prompt = document.createElement("p");
    prompt.textContent = miss.usageExample;

    question.append(title, prompt);

    const details = document.createElement("div");
    details.className = "missed-detail-grid";
    details.append(
      createMissedDetail("Player", miss.playerName),
      createMissedDetail("Answer given", miss.answerGiven),
      createMissedDetail("Correct answer", miss.correctAnswer),
    );

    row.append(question, details);
    elements.missedSummary.append(row);
  });
}

function createMissedDetail(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "missed-detail";

  const labelElement = document.createElement("span");
  labelElement.textContent = label;

  const valueElement = document.createElement("p");
  valueElement.textContent = value;

  wrapper.append(labelElement, valueElement);
  return wrapper;
}

function updateStats() {
  const answered = Math.min(state.answered, state.queue.length);
  const currentPlayer = state.players.length > 0 ? getCurrentPlayer() : null;

  elements.scoreValue.textContent = currentPlayer ? currentPlayer.score : 0;
  elements.streakValue.textContent = state.streak;
  elements.progressValue.textContent = `${answered}/${state.queue.length}`;

  const progress = state.queue.length ? (answered / state.queue.length) * 100 : 0;
  elements.progressBar.style.width = `${progress}%`;
}

function updateResultTabs() {
  elements.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.resultView);
  });
}

function showResultView(view) {
  if (!state.completed) return;

  state.resultView = view;
  updateResultTabs();

  if (view === "missed") {
    renderMissedView();
  } else {
    renderScoresView();
  }
}

function showSetupPanel() {
  state.currentIndex = 0;
  state.streak = 0;
  state.answered = 0;
  state.roundMisses = [];
  state.resultView = "scores";
  state.locked = false;
  state.completed = false;
  state.queue = [];
  state.players = [];

  elements.gamePanel.classList.add("hidden");
  elements.setupPanel.classList.remove("hidden");
  elements.resultTabs.classList.add("hidden");
  elements.feedback.classList.add("hidden");
  elements.tipButton.classList.remove("hidden");
  elements.nextButton.classList.remove("hidden");
  elements.progressBar.style.width = "0%";
  elements.scoreValue.textContent = "0";
  elements.streakValue.textContent = "0";
  elements.progressValue.textContent = "0/0";
  renderPlayerFields();
  renderQuestionCountOptions();
}

function getSelectedQuestions() {
  const subjectQuestions = getQuestionsForSubject(state.allQuestions, state.selectedSubject);
  return usesUnits(state.selectedSubject)
    ? getQuestionsForUnit(subjectQuestions, state.selectedChapter)
    : getQuestionsForChapter(subjectQuestions, state.selectedChapter);
}

function getCurrentQuestion() {
  return state.queue[state.currentIndex];
}

function getCurrentPlayer() {
  return state.players[state.currentIndex % state.players.length];
}

function getTurnsPerPlayer() {
  return state.players.length > 0 ? state.queue.length / state.players.length : 0;
}

function getEnteredPlayerNames() {
  return [...elements.playerFields.querySelectorAll("input")].map((input) => input.value.trim());
}

function buildPlayers(playerCount, names) {
  return Array.from({ length: playerCount }, (_, index) => ({
    name: names[index] || (playerCount === 1 && index === 0 ? "You" : `Player ${index + 1}`),
    score: 0,
  }));
}

function getPlayerCountOptions(totalQuestions, maxPlayers) {
  return Array.from({ length: Math.min(totalQuestions, maxPlayers) }, (_, index) => index + 1);
}

function getQuestionCountOptions(totalQuestions, playerCount) {
  return Array.from({ length: Math.floor(totalQuestions / playerCount) }, (_, index) => {
    return (index + 1) * playerCount;
  });
}

function getValidQuestionCount(value, options, fallback) {
  if (options.includes(value)) return value;
  if (Number.isFinite(value) && options.length > 0) {
    const lowerOrEqual = options.filter((option) => option <= value).at(-1);
    if (lowerOrEqual) return lowerOrEqual;
  }
  return fallback;
}

function getChapterOptions(questions) {
  const counts = questions.reduce((chapterCounts, question) => {
    const chapter = question.chapter === 15 && question.unit
      ? `15:${question.unit}` : question.chapter;
    chapterCounts.set(chapter, (chapterCounts.get(chapter) || 0) + 1);
    return chapterCounts;
  }, new Map());

  return [...counts.entries()]
    .sort(([chapterA], [chapterB]) => String(chapterA).localeCompare(String(chapterB), undefined, { numeric: true }))
    .map(([chapter, count]) => ({ chapter, count }));
}

function getUnitOptions(questions) {
  const counts = questions.reduce((unitCounts, question) => {
    const unit = getQuestionUnit(question);
    unitCounts.set(unit, (unitCounts.get(unit) || 0) + 1);
    return unitCounts;
  }, new Map());

  return [...counts.entries()]
    .sort(([unitA], [unitB]) => unitA.localeCompare(unitB, undefined, { numeric: true }))
    .map(([chapter, count]) => ({ chapter, count }));
}

function getSubjectOptions(questions) {
  const counts = questions.reduce((subjectCounts, question) => {
    const subject = normalizeSubject(question.subject);
    subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
    return subjectCounts;
  }, new Map());

  return [...counts.entries()]
    .sort(([subjectA], [subjectB]) => {
      if (subjectA === "science") return -1;
      if (subjectB === "science") return 1;
      return subjectA.localeCompare(subjectB);
    })
    .map(([subject, count]) => ({ subject, count }));
}

function getQuestionsForSubject(questions, subject) {
  return questions.filter((question) => normalizeSubject(question.subject) === subject);
}

function getQuestionsForChapter(questions, chapter) {
  if (chapter === "study-guide") return questions.filter((question) => question.studyGuide === "waves");
  questions = questions.filter((question) => !question.studyGuide);
  if (chapter === "all") return questions;
  if (String(chapter).startsWith("15:")) {
    return questions.filter((question) => question.chapter === 15 && question.unit === String(chapter).slice(3));
  }
  const chapterNumber = Number(chapter);
  return questions.filter((question) => question.chapter === chapterNumber);
}

function getQuestionsForUnit(questions, unit) {
  if (unit === "all") return questions;
  return questions.filter((question) => getQuestionUnit(question) === unit);
}

function getQuestionUnit(question) {
  return String(question.unit || question.chapter);
}

function getModeLabel(subject, chapter) {
  if (chapter === "study-guide") return "Study Guide: Waves";
  const subjectLabel = getSubjectLabel(subject);
  if (usesUnits(subject)) {
    return chapter === "all" ? `${subjectLabel}: all units` : `${subjectLabel}: unit ${chapter}`;
  }
  return chapter === "all" ? `${subjectLabel}: all chapters` : `${subjectLabel}: ${getChapterInputValue(chapter).replace(/^Chapter/, "chapter")}`;
}

function getChapterInputValue(chapter, subject = "science") {
  if (usesUnits(subject)) {
    return chapter === "all" ? "All units" : `Unit ${chapter}`;
  }
  if (chapter === "15:1.4") return "Chapter 15 — Unit 1.4 (pages 143–149)";
  if (chapter === "15:2.1") return "Chapter 15 — Unit 2.1 (pages 150–157)";
  return chapter === "all" ? "All chapters" : `Chapter ${chapter}`;
}

function getSubjectLabel(subject) {
  return normalizeSubject(subject)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeSubject(subject) {
  return String(subject || "science")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeChapter(chapter, subject = "science") {
  const value = String(chapter || "all").trim().toLowerCase();
  if (!value || value === "all" || value === "all chapters" || value === "all units") return "all";
  if (!usesUnits(subject)) {
    const splitChapter = value.match(/^(?:chapter\s+)?15\s*(?::|—\s*unit\s+)(1\.4|2\.1)(?:\s|$)/);
    if (splitChapter) return `15:${splitChapter[1]}`;
  }
  const match = usesUnits(subject) ? value.match(/\d+(?:\.\d+)?/) : value.match(/\d+/);
  return match ? match[0] : "all";
}

function usesUnits(subject) {
  return normalizeSubject(subject) === "civics";
}

function getDefaultQuestionCount(options, target) {
  return options.find((count) => count >= target) || options[options.length - 1] || 0;
}

function getRoundSize(totalAvailable, selectedQuestionCount, playerCount) {
  const requested = Math.min(totalAvailable, selectedQuestionCount);
  return requested - (requested % playerCount);
}

function getLeaders(players) {
  const highestScore = Math.max(...players.map((player) => player.score));
  return players.filter((player) => player.score === highestScore);
}

function formatPossessive(name) {
  if (name.toLowerCase() === "you") return "Your";
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

function showSetupError(message) {
  elements.setupError.textContent = message;
  elements.setupError.classList.remove("hidden");
}

function setFeedback(message, type) {
  elements.feedback.textContent = message;
  elements.feedback.className = type ? `feedback ${type}` : "feedback";
}

function shuffle(items) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

if (hasDocument) {
  elements.setupForm.addEventListener("submit", handleSetupSubmit);
  elements.playerCount.addEventListener("change", () => {
    renderPlayerFields();
    renderQuestionCountOptions();
  });
  elements.subjectSelect.addEventListener("change", () => {
    state.selectedSubject = elements.subjectSelect.value;
    state.selectedChapter = "all";
    updateSubjectHint();
    renderChapterOptions();
    renderQuestionCountOptions();
  });
  elements.chapterSelect.addEventListener("change", () => {
    state.selectedChapter = elements.chapterSelect.value;
    updateChapterHint();
    renderQuestionCountOptions();
  });
  elements.questionCount.addEventListener("change", renderQuestionCountOptions);
  elements.questionCount.addEventListener("input", () => {
    const playerCount = Number(elements.playerCount.value);
    const value = Number(elements.questionCount.value);
    const questionsEach = value / playerCount;
    elements.questionCountHint.textContent =
      Number.isInteger(value) && value % playerCount === 0
        ? `${questionsEach} turn${questionsEach === 1 ? "" : "s"} per player.`
        : `Type a number that divides evenly by ${playerCount}.`;
  });
  elements.nextButton.addEventListener("click", nextQuestion);
  elements.tipButton.addEventListener("click", showTip);
  elements.settingsButton.addEventListener("click", showSetupPanel);
  elements.shuffleButton.addEventListener("click", startPractice);
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => showResultView(button.dataset.view));
  });

  loadQuestions();
}

if (typeof module !== "undefined") {
  module.exports = {
    buildPlayers,
    getDefaultQuestionCount,
    getChapterOptions,
    getUnitOptions,
    getModeLabel,
    getLeaders,
    getRoundSize,
    formatPossessive,
    getPlayerCountOptions,
    getQuestionCountOptions,
    getQuestionsForChapter,
    getQuestionsForUnit,
    getQuestionsForSubject,
    getChapterInputValue,
    getQuestionUnit,
    getSubjectLabel,
    getSubjectOptions,
    getValidQuestionCount,
    normalizeChapter,
    usesUnits,
  };
}

// Keep the welcome step on each visit, with the last colors preselected.
if (hasDocument) {
  const palette = { Green: '#00966b', Blue: '#377bd4', Red: '#d94a59', Purple: '#9462d4', Pink: '#db68a2', Orange: '#df8739', Yellow: '#dcbf44', Teal: '#22999e', Brown: '#997255', Gray: '#899099', Black: '#292c32', White: '#ffffff' };
  const starbucksPalette = { Green: '#006241', Blue: '#174a8b', Purple: '#59328a', Red: '#922b3e' };
  const pastels = { 'Baby pink': '#f5c7dd', 'Baby blue': '#bdddf7', 'Baby green': '#c5ebce', 'Baby purple': '#ded0f5', 'Baby yellow': '#fff0b5', 'Baby peach': '#ffdac1' };
  let mode = 'starbucks';
  let color = palette.Green;
  try {
    const saved = JSON.parse(localStorage.getItem('free-studies-theme'));
    if (saved && ['starbucks', 'dark', 'light'].includes(saved.mode) && /^#[0-9a-f]{6}$/i.test(saved.color)) {
      mode = saved.mode;
      color = saved.color;
    }
  } catch (_) { /* Themes also work when browser storage is unavailable. */ }
  const panel = document.querySelector('#themePanel');
  const choices = document.querySelector('#colorChoices');
  const custom = document.querySelector('#customColor');
  function applyTheme() {
    const root = document.documentElement;
    root.dataset.theme = mode;
    const rgb = color.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16));
    const luminance = rgb.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    root.style.setProperty('--chosen-color', color);
    root.style.setProperty('--on-accent', luminance > 0.179 ? '#101820' : '#ffffff');
    custom.value = color;
    choices.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.color === color)));
    try { localStorage.setItem('free-studies-theme', JSON.stringify({ mode, color })); } catch (_) {}
  }
  function renderColors() {
    const colors = mode === 'starbucks' ? starbucksPalette : { ...palette, ...(mode === 'light' ? pastels : {}) };
    if (mode === 'starbucks' && !Object.values(colors).includes(color)) {
      const previousName = Object.keys(palette).find((name) => palette[name] === color);
      color = starbucksPalette[previousName] || starbucksPalette.Green;
    }
    choices.replaceChildren();
    Object.entries(colors).forEach(([name, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-choice';
      button.dataset.color = value;
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = value;
      button.append(swatch, document.createTextNode(name));
      button.addEventListener('click', () => { color = value; applyTheme(); });
      choices.append(button);
    });
    document.querySelector('#customColorLabel').classList.toggle('hidden', mode === 'starbucks');
    applyTheme();
  }
  document.querySelectorAll('[name="themeMode"]').forEach((radio) => {
    radio.checked = radio.value === mode;
    radio.addEventListener('change', () => { mode = radio.value; renderColors(); });
  });
  custom.addEventListener('input', () => { color = custom.value; applyTheme(); });
  document.querySelector('#themeForm').addEventListener('submit', (event) => {
    event.preventDefault();
    panel.classList.add('hidden');
    elements.setupPanel.classList.remove('hidden');
    elements.playerCount.focus();
  });
  document.querySelector('#changeThemeButton').addEventListener('click', () => {
    elements.setupPanel.classList.add('hidden');
    panel.classList.remove('hidden');
    panel.querySelector('input:checked').focus();
  });
  renderColors();
}
