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
  subjectOptions: hasDocument ? document.querySelector("#subjectOptions") : null,
  subjectHint: hasDocument ? document.querySelector("#subjectHint") : null,
  chapterSelect: hasDocument ? document.querySelector("#chapterSelect") : null,
  chapterOptions: hasDocument ? document.querySelector("#chapterOptions") : null,
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
  typedAnswerForm: hasDocument ? document.querySelector("#typedAnswerForm") : null,
  typedAnswer: hasDocument ? document.querySelector("#typedAnswer") : null,
  typedAnswerButton: hasDocument ? document.querySelector("#typedAnswerButton") : null,
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
  elements.subjectOptions.innerHTML = "";

  subjects.forEach(({ subject, count }) => {
    const option = document.createElement("option");
    option.value = getSubjectLabel(subject);
    option.label = `${getSubjectLabel(subject)} (${count} questions)`;
    elements.subjectOptions.append(option);
  });

  state.selectedSubject = subjects.some(({ subject }) => subject === previousSubject)
    ? previousSubject
    : subjects[0]?.subject || "science";
  elements.subjectSelect.value = getSubjectLabel(state.selectedSubject);
  updateSubjectHint();
}

function renderChapterOptions() {
  const subjectQuestions = getQuestionsForSubject(state.allQuestions, state.selectedSubject);
  const chapters = getChapterOptions(subjectQuestions);
  elements.chapterOptions.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "All chapters";
  allOption.label = `All chapters (${subjectQuestions.length} questions)`;
  elements.chapterOptions.append(allOption);

  chapters.forEach(({ chapter, count }) => {
    const option = document.createElement("option");
    option.value = `Chapter ${chapter}`;
    option.label = `Chapter ${chapter} (${count} questions)`;
    elements.chapterOptions.append(option);
  });

  const hasSelectedChapter =
    state.selectedChapter === "all" ||
    chapters.some(({ chapter }) => String(chapter) === String(state.selectedChapter));
  state.selectedChapter = hasSelectedChapter ? state.selectedChapter : "all";
  elements.chapterSelect.value = getChapterInputValue(state.selectedChapter);
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
  state.selectedSubject = normalizeSubject(elements.subjectSelect.value);
  state.selectedChapter = normalizeChapter(elements.chapterSelect.value);
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
    elements.typedAnswerForm.classList.add("hidden");
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
  elements.typedAnswerForm.classList.remove("hidden");
  elements.typedAnswer.value = "";
  elements.typedAnswer.disabled = false;
  elements.typedAnswerButton.disabled = false;
  setFeedback("Choose the answer that best matches the question.", "");

  elements.alternatives.innerHTML = "";
  shuffle([...question.alternatives]).forEach((alternative) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = alternative;
    button.addEventListener("click", () => chooseAnswer(alternative, button));
    elements.alternatives.append(button);
  });
}

function handleTypedAnswerSubmit(event) {
  event.preventDefault();
  if (state.locked) return;

  const typedAnswer = elements.typedAnswer.value.trim();
  if (!typedAnswer) {
    setFeedback("Type an answer or choose one of the answer choices.", "error");
    elements.typedAnswer.focus();
    return;
  }

  chooseAnswer(typedAnswer);
}

function chooseAnswer(answerGiven, button = null) {
  if (state.locked) return;

  const question = getCurrentQuestion();
  const currentPlayer = getCurrentPlayer();
  const isCorrect = isCorrectAnswer(answerGiven, question.correctAnswer);
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
      answerGiven,
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
    } else if (button && answerButton === button) {
      answerButton.classList.add("incorrect");
    }
  });

  elements.typedAnswer.disabled = true;
  elements.typedAnswerButton.disabled = true;
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
  elements.typedAnswerForm.classList.add("hidden");
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
      score.textContent = `${player.score}/${getTurnsPerPlayer()}`;

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
  elements.typedAnswerForm.classList.add("hidden");
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
  return getQuestionsForChapter(
    getQuestionsForSubject(state.allQuestions, state.selectedSubject),
    state.selectedChapter,
  );
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
    chapterCounts.set(question.chapter, (chapterCounts.get(question.chapter) || 0) + 1);
    return chapterCounts;
  }, new Map());

  return [...counts.entries()]
    .sort(([chapterA], [chapterB]) => chapterA - chapterB)
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
  if (chapter === "all") return questions;
  const chapterNumber = Number(chapter);
  return questions.filter((question) => question.chapter === chapterNumber);
}

function getModeLabel(subject, chapter) {
  const subjectLabel = getSubjectLabel(subject);
  return chapter === "all" ? `${subjectLabel}: all chapters` : `${subjectLabel}: chapter ${chapter}`;
}

function getChapterInputValue(chapter) {
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

function normalizeChapter(chapter) {
  const value = String(chapter || "all").trim().toLowerCase();
  if (!value || value === "all" || value === "all chapters") return "all";
  const match = value.match(/\d+/);
  return match ? match[0] : "all";
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

function isCorrectAnswer(answerGiven, correctAnswer) {
  return normalizeAnswer(answerGiven) === normalizeAnswer(correctAnswer);
}

function normalizeAnswer(answer) {
  return String(answer)
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
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
    state.selectedSubject = normalizeSubject(elements.subjectSelect.value);
    elements.subjectSelect.value = getSubjectLabel(state.selectedSubject);
    state.selectedChapter = "all";
    elements.chapterSelect.value = getChapterInputValue(state.selectedChapter);
    updateSubjectHint();
    renderChapterOptions();
    renderQuestionCountOptions();
  });
  elements.subjectSelect.addEventListener("input", () => {
    const typedSubject = normalizeSubject(elements.subjectSelect.value);
    if (getSubjectOptions(state.allQuestions).some(({ subject }) => subject === typedSubject)) {
      state.selectedSubject = typedSubject;
      state.selectedChapter = "all";
      updateSubjectHint();
      renderChapterOptions();
      renderQuestionCountOptions();
    }
  });
  elements.chapterSelect.addEventListener("change", () => {
    state.selectedChapter = normalizeChapter(elements.chapterSelect.value);
    elements.chapterSelect.value = getChapterInputValue(state.selectedChapter);
    updateChapterHint();
    renderQuestionCountOptions();
  });
  elements.chapterSelect.addEventListener("input", () => {
    state.selectedChapter = normalizeChapter(elements.chapterSelect.value);
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
  elements.typedAnswerForm.addEventListener("submit", handleTypedAnswerSubmit);
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
    getModeLabel,
    getLeaders,
    getRoundSize,
    formatPossessive,
    getPlayerCountOptions,
    getQuestionCountOptions,
    getQuestionsForChapter,
    getQuestionsForSubject,
    getChapterInputValue,
    getSubjectLabel,
    getSubjectOptions,
    getValidQuestionCount,
    isCorrectAnswer,
    normalizeChapter,
    normalizeAnswer,
  };
}
