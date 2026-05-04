const STORAGE_KEY = "kindle-vocab-lab:v1";
const SETTINGS_KEY = "kindle-vocab-lab:settings:v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_DAILY_REVIEW_GOAL = 10;

const state = {
  words: [],
  activeView: "review",
  reviewQueue: [],
  reviewIndex: 0,
  answerVisible: false,
  reviewNotice: "",
  editingId: null,
  installPrompt: null,
  settings: {
    merriamWebsterKey: "",
    dailyReviewGoal: DEFAULT_DAILY_REVIEW_GOAL,
    lastGoalCelebratedDate: "",
    lastStreakCelebrated: 0,
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const elements = {
  todayLabel: $("#todayLabel"),
  dueCount: $("#dueCount"),
  totalCount: $("#totalCount"),
  masteredCount: $("#masteredCount"),
  todayStudied: $("#todayStudied"),
  streakCount: $("#streakCount"),
  dailyGoalText: $("#dailyGoalText"),
  dailyGoalBar: $("#dailyGoalBar"),
  masteryRateText: $("#masteryRateText"),
  masteryRateBar: $("#masteryRateBar"),
  remainingDueText: $("#remainingDueText"),
  remainingDueHint: $("#remainingDueHint"),
  weeklyBars: $("#weeklyBars"),
  achievementBanner: $("#achievementBanner"),
  achievementTitle: $("#achievementTitle"),
  achievementText: $("#achievementText"),
  reviewSubtitle: $("#reviewSubtitle"),
  emptyReview: $("#emptyReview"),
  activeReview: $("#activeReview"),
  reviewBook: $("#reviewBook"),
  reviewWord: $("#reviewWord"),
  reviewPhonetic: $("#reviewPhonetic"),
  reviewSource: $("#reviewSource"),
  reviewContext: $("#reviewContext"),
  reviewAnswer: $("#reviewAnswer"),
  reviewMeaning: $("#reviewMeaning"),
  reviewDefinition: $("#reviewDefinition"),
  reviewUsage: $("#reviewUsage"),
  reviewCollocations: $("#reviewCollocations"),
  reviewExamples: $("#reviewExamples"),
  reviewProduction: $("#reviewProduction"),
  reviewNote: $("#reviewNote"),
  showAnswerButton: $("#showAnswerButton"),
  speakButton: $("#speakButton"),
  shuffleButton: $("#shuffleButton"),
  entryForm: $("#entryForm"),
  wordInput: $("#wordInput"),
  phoneticInput: $("#phoneticInput"),
  bookInput: $("#bookInput"),
  meaningInput: $("#meaningInput"),
  definitionInput: $("#definitionInput"),
  usageInput: $("#usageInput"),
  collocationsInput: $("#collocationsInput"),
  examplesInput: $("#examplesInput"),
  contextInput: $("#contextInput"),
  productionInput: $("#productionInput"),
  noteInput: $("#noteInput"),
  fetchButton: $("#fetchButton"),
  translateButton: $("#translateButton"),
  formStatus: $("#formStatus"),
  wordList: $("#wordList"),
  wordItemTemplate: $("#wordItemTemplate"),
  searchInput: $("#searchInput"),
  librarySubtitle: $("#librarySubtitle"),
  analysisSubtitle: $("#analysisSubtitle"),
  analysisDueCount: $("#analysisDueCount"),
  analysisRetentionScore: $("#analysisRetentionScore"),
  analysisRetentionBar: $("#analysisRetentionBar"),
  analysisWeakCount: $("#analysisWeakCount"),
  analysisMasteredRate: $("#analysisMasteredRate"),
  recommendationList: $("#recommendationList"),
  stageDistribution: $("#stageDistribution"),
  weakWordList: $("#weakWordList"),
  historyTimeline: $("#historyTimeline"),
  markdownOutput: $("#markdownOutput"),
  jsonOutput: $("#jsonOutput"),
  copyMarkdownButton: $("#copyMarkdownButton"),
  copyJsonButton: $("#copyJsonButton"),
  downloadMarkdownButton: $("#downloadMarkdownButton"),
  downloadJsonButton: $("#downloadJsonButton"),
  settingsForm: $("#settingsForm"),
  dailyGoalInput: $("#dailyGoalInput"),
  mwKeyInput: $("#mwKeyInput"),
  clearSettingsButton: $("#clearSettingsButton"),
  settingsStatus: $("#settingsStatus"),
  installAppButton: $("#installAppButton"),
  pwaStatus: $("#pwaStatus"),
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.words = Array.isArray(parsed.words) ? parsed.words : [];
  } catch {
    state.words = [];
  }
}

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.settings.merriamWebsterKey = parsed.merriamWebsterKey || "";
    state.settings.dailyReviewGoal = normalizeDailyGoal(parsed.dailyReviewGoal);
    state.settings.lastGoalCelebratedDate = parsed.lastGoalCelebratedDate || "";
    state.settings.lastStreakCelebrated = Number(parsed.lastStreakCelebrated) || 0;
  } catch {
    state.settings.merriamWebsterKey = "";
    state.settings.dailyReviewGoal = DEFAULT_DAILY_REVIEW_GOAL;
    state.settings.lastGoalCelebratedDate = "";
    state.settings.lastStreakCelebrated = 0;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ words: state.words }));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function normalizeWord(word) {
  return word.trim().toLowerCase();
}

function normalizeDailyGoal(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_DAILY_REVIEW_GOAL;
  return Math.min(100, Math.max(1, parsed));
}

function getDueWords() {
  const today = todayIso();
  return state.words
    .filter((word) => (word.nextReview || today) <= today)
    .sort((a, b) => (a.nextReview || "").localeCompare(b.nextReview || ""));
}

function setStatus(message) {
  elements.formStatus.textContent = message;
}

function calculateStreak() {
  const studiedDates = new Set(
    state.words
      .flatMap((word) => word.history || [])
      .map((item) => item.date)
      .filter(Boolean)
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (studiedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function countReviewsOn(dateIso) {
  return state.words.reduce((total, word) => {
    return total + (word.history || []).filter((item) => item.date === dateIso).length;
  }, 0);
}

function dateIsoOffset(daysAgo) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function renderProgressBoard() {
  const total = state.words.length;
  const mastered = state.words.filter((word) => word.status === "mastered").length;
  const due = getDueWords().length;
  const todayReviews = countReviewsOn(todayIso());
  const dailyGoal = normalizeDailyGoal(state.settings.dailyReviewGoal);
  const dailyPercent = Math.min(100, Math.round((todayReviews / dailyGoal) * 100));
  const masteryPercent = total ? Math.round((mastered / total) * 100) : 0;

  elements.dailyGoalText.textContent = `${todayReviews} / ${dailyGoal}`;
  elements.dailyGoalBar.style.width = `${dailyPercent}%`;
  elements.masteryRateText.textContent = `${masteryPercent}%`;
  elements.masteryRateBar.style.width = `${masteryPercent}%`;
  elements.remainingDueText.textContent = `${due}語`;
  elements.remainingDueHint.textContent = due
    ? "今日の山を少しずつ崩しましょう。"
    : "今日の復習は完了です。";

  const days = Array.from({ length: 7 }, (_, index) => {
    const daysAgo = 6 - index;
    const iso = dateIsoOffset(daysAgo);
    return {
      iso,
      label: daysAgo === 0 ? "今日" : new Date(iso).toLocaleDateString("ja-JP", { weekday: "short" }),
      count: countReviewsOn(iso),
    };
  });
  const maxCount = Math.max(dailyGoal, ...days.map((day) => day.count), 1);

  elements.weeklyBars.textContent = "";
  for (const day of days) {
    const item = document.createElement("div");
    item.className = "weekly-bar-item";

    const bar = document.createElement("span");
    bar.className = "weekly-bar";
    bar.style.height = `${Math.max(8, Math.round((day.count / maxCount) * 58))}px`;
    bar.title = `${day.iso}: ${day.count}回`;

    const label = document.createElement("small");
    label.textContent = day.label;

    item.append(bar, label);
    elements.weeklyBars.append(item);
  }

  renderAchievement(todayReviews, dailyGoal);
}

function renderAchievement(todayReviews, dailyGoal) {
  const today = todayIso();
  const streak = calculateStreak();
  const goalReached = todayReviews >= dailyGoal;
  let title = "";
  let text = "";

  if (goalReached && state.settings.lastGoalCelebratedDate !== today) {
    title = "今日の目標達成";
    text = `${todayReviews}回復習しました。このまま止めても、もう今日は勝ちです。`;
    state.settings.lastGoalCelebratedDate = today;
    saveSettings();
  } else if (streak > 1 && streak > (Number(state.settings.lastStreakCelebrated) || 0)) {
    title = `${streak}日連続`;
    text = "連続記録が伸びています。短くても毎日触れるのが強いです。";
    state.settings.lastStreakCelebrated = streak;
    saveSettings();
  } else if (goalReached) {
    title = "目標クリア済み";
    text = "追加で進めるなら、弱い単語だけ軽く触るのがおすすめです。";
  }

  elements.achievementBanner.classList.toggle("is-hidden", !title);
  elements.achievementTitle.textContent = title;
  elements.achievementText.textContent = text;
}

function renderShell() {
  const due = getDueWords().length;
  const today = todayIso();
  const todayReviews = countReviewsOn(today);

  elements.todayLabel.textContent = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
  elements.dueCount.textContent = due;
  elements.totalCount.textContent = state.words.length;
  elements.masteredCount.textContent = state.words.filter((word) => word.status === "mastered").length;
  elements.todayStudied.textContent = todayReviews;
  elements.streakCount.textContent = calculateStreak();
  renderProgressBoard();
}

function setView(view) {
  state.activeView = view;
  $$(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === view));
  $$(".view").forEach((panel) => panel.classList.remove("is-active"));
  $(`#${view}View`).classList.add("is-active");

  if (view === "review") renderReview();
  if (view === "library") renderLibrary();
  if (view === "analysis") renderAnalysis();
  if (view === "export") renderExports();
  if (view === "settings") renderSettings();
}

function rebuildReviewQueue() {
  state.reviewQueue = getDueWords().map((word) => word.id);
  state.reviewIndex = 0;
}

function currentReviewWord() {
  const id = state.reviewQueue[state.reviewIndex];
  return state.words.find((word) => word.id === id);
}

const LEARNING_STAGES = {
  comprehension: "初回理解",
  lightRecall: "軽いリコール",
  cloze: "穴埋め",
  production: "アウトプット",
  mastered: "習得",
};

const STAGE_WEIGHTS = {
  comprehension: 20,
  lightRecall: 42,
  cloze: 62,
  production: 78,
  mastered: 92,
};

const GRADE_LABELS = {
  again: "知らない",
  hard: "微妙",
  good: "覚えた",
};

function getLearningStage(word) {
  if (word.learningStage && LEARNING_STAGES[word.learningStage]) return word.learningStage;
  if (word.status === "mastered") return "mastered";

  const history = word.history || [];
  const goodCount = history.filter((item) => item.grade === "good").length;
  const hardCount = history.filter((item) => item.grade === "hard").length;

  if (!history.length) return "comprehension";
  if (goodCount >= 4 && word.production) return "mastered";
  if (goodCount >= 3) return "production";
  if (goodCount >= 1 || hardCount >= 1) return "lightRecall";
  return "comprehension";
}

function nextStageForGrade(word, grade) {
  const stage = getLearningStage(word);
  const hasProduction = Boolean(word.production);

  if (grade === "again") {
    if (stage === "mastered" || stage === "production" || stage === "cloze") return "lightRecall";
    return "comprehension";
  }

  if (grade === "hard") {
    if (stage === "mastered") return "cloze";
    return stage === "comprehension" ? "lightRecall" : stage;
  }

  if (stage === "comprehension") return "lightRecall";
  if (stage === "lightRecall") return "cloze";
  if (stage === "cloze") return hasProduction ? "production" : "cloze";
  if (stage === "production") return hasProduction ? "mastered" : "production";
  if (stage === "mastered") return "mastered";
  return "mastered";
}

function stageHelpText(stage) {
  const text = {
    comprehension: "まず意味・型・例文を理解する段階です。",
    lightRecall: "例文を手がかりに、軽く思い出す段階です。",
    cloze: "単語を隠して、文脈から取り出す段階です。",
    production: "自分の文で使えるか確認する段階です。",
    mastered: "長めの間隔で維持する段階です。",
  };
  return text[stage] || "";
}

function renderReview() {
  if (!state.reviewQueue.length) rebuildReviewQueue();

  const due = getDueWords();
  elements.reviewSubtitle.textContent = state.reviewNotice || (due.length
    ? `${due.length}語が復習待ちです`
    : "次の復習タイミングまで、少し寝かせておけます。");
  state.reviewNotice = "";

  const word = currentReviewWord();
  if (!word) {
    elements.emptyReview.classList.remove("is-hidden");
    elements.activeReview.classList.add("is-hidden");
    return;
  }

  elements.emptyReview.classList.add("is-hidden");
  elements.activeReview.classList.remove("is-hidden");
  elements.reviewBook.textContent = word.book ? `From: ${word.book}` : "No book set";
  const stage = getLearningStage(word);
  const prompt = getReviewPrompt(word);
  const cloze = createClozePrompt(prompt.text, word.word);
  const clozeMode = (stage === "lightRecall" || stage === "cloze" || stage === "production") && !state.answerVisible && cloze.didHide;
  const productionMode = stage === "production" && !state.answerVisible;
  elements.reviewWord.textContent = clozeMode ? "What fits here?" : word.word;
  elements.reviewPhonetic.textContent = clozeMode
    ? "Active Recall"
    : `${LEARNING_STAGES[stage]} · ${stageHelpText(stage)}`;
  elements.reviewSource.textContent = clozeMode
    ? `${prompt.source} · 穴埋め`
    : productionMode
      ? `${prompt.source} · アウトプット練習`
      : prompt.source;
  elements.reviewContext.textContent = clozeMode ? cloze.text : prompt.text;
  elements.reviewMeaning.textContent = compactPreview(
    firstUsefulLine(word.meaning, ["意味の核:", "訳語候補:"]),
    "未入力"
  );
  elements.reviewDefinition.textContent = compactPreview(firstUsefulLine(word.definition), "未入力");
  elements.reviewUsage.textContent = compactPreview(firstUsefulLine(word.usage), "未入力");
  elements.reviewCollocations.textContent = compactPreview(firstUsefulLine(word.collocations), "未入力");
  elements.reviewExamples.textContent = compactPreview(firstUsefulLine(word.examples), "未入力");
  elements.reviewProduction.textContent = word.production
    ? compactPreview(word.production)
    : stage === "production"
      ? "この単語を使って、自分の生活や仕事に関係する英文を1文作ってから評価してください。"
      : "この単語を使って、自分の生活や仕事に関係する英文を1文作る";
  elements.reviewNote.textContent = compactPreview(firstUsefulLine(word.note), "未入力");
  elements.reviewAnswer.classList.toggle("is-hidden", !state.answerVisible);
  elements.showAnswerButton.textContent = state.answerVisible
    ? "もう一度隠す"
    : stage === "comprehension"
      ? "意味・使い方を見る"
      : stage === "production"
        ? "参考情報を見る"
        : "答えを見る";
}

function resetForm() {
  state.editingId = null;
  elements.entryForm.reset();
  elements.entryForm.querySelector(".primary-button").textContent = "登録";
}

function upsertWord(data) {
  const now = new Date().toISOString();
  const existing = state.editingId
    ? state.words.find((word) => word.id === state.editingId)
    : state.words.find((word) => normalizeWord(word.word) === normalizeWord(data.word));

  if (existing) {
    Object.assign(existing, data, {
      updatedAt: now,
      nextReview: existing.nextReview || todayIso(),
      learningStage: existing.learningStage || getLearningStage(existing),
    });
  } else {
    state.words.unshift({
      id: uid(),
      ...data,
      createdAt: now,
      updatedAt: now,
      nextReview: todayIso(),
      interval: 0,
      ease: 2.35,
      status: "learning",
      learningStage: "comprehension",
      history: [],
    });
  }

  saveState();
  rebuildReviewQueue();
  renderAll();
}

function collectFormData() {
  return {
    word: elements.wordInput.value.trim(),
    phonetic: elements.phoneticInput.value.trim(),
    book: elements.bookInput.value.trim(),
    meaning: elements.meaningInput.value.trim(),
    definition: elements.definitionInput.value.trim(),
    usage: elements.usageInput.value.trim(),
    collocations: elements.collocationsInput.value.trim(),
    examples: elements.examplesInput.value.trim(),
    context: isGeneratedContext(elements.contextInput.value, { examples: elements.examplesInput.value })
      ? ""
      : elements.contextInput.value.trim(),
    production: elements.productionInput.value.trim(),
    note: elements.noteInput.value.trim(),
  };
}

function handleSubmit(event) {
  event.preventDefault();
  const data = collectFormData();

  if (!data.word) {
    setStatus("単語を入れてください。");
    elements.wordInput.focus();
    return;
  }

  upsertWord(data);
  setStatus(state.editingId ? "更新しました。" : "登録しました。");
  resetForm();
  setView("review");
}

function gradeCurrentWord(grade) {
  const word = currentReviewWord();
  if (!word) return;

  const currentStage = getLearningStage(word);
  if (grade === "good" && currentStage === "production" && !word.production) {
    state.answerVisible = true;
    state.reviewNotice = "アウトプット段階です。自作文を登録してから「覚えた」に進めます。";
    renderReview();
    return;
  }

  const today = todayIso();
  const nextStage = nextStageForGrade(word, grade);
  const next = {
    again: 1,
    hard: Math.max(2, Math.round((word.interval || 1) * 1.5)),
    good: Math.max(3, Math.round((word.interval || 1) * (word.ease || 2.35))),
  }[grade];

  if (grade === "again") {
    word.ease = Math.max(1.4, (word.ease || 2.35) - 0.2);
    word.status = "learning";
  }

  if (grade === "hard") {
    word.ease = Math.max(1.6, (word.ease || 2.35) - 0.05);
    word.status = "learning";
  }

  if (grade === "good") {
    word.ease = Math.min(2.8, (word.ease || 2.35) + 0.05);
    word.status = nextStage === "mastered" || next >= 21 ? "mastered" : "learning";
  }

  if (nextStage !== "mastered") word.status = "learning";
  word.learningStage = nextStage;
  word.interval = next;
  word.nextReview = addDays(next);
  word.updatedAt = new Date().toISOString();
  word.history = [
    ...(word.history || []),
    { date: today, grade, nextReview: word.nextReview, stage: word.learningStage },
  ];

  saveState();
  state.reviewQueue.splice(state.reviewIndex, 1);
  state.answerVisible = false;

  if (state.reviewIndex >= state.reviewQueue.length) state.reviewIndex = 0;
  renderAll();
}

async function fetchDefinition() {
  const word = elements.wordInput.value.trim();
  if (!word) {
    setStatus("先に単語を入れてください。");
    elements.wordInput.focus();
    return;
  }

  setStatus("学習カードを生成中です。");

  try {
    const lookup = await lookupWord(word);
    const definitions = lookup.definitions;
    elements.phoneticInput.value = lookup.phonetic || "";
    elements.definitionInput.value = definitions
      .slice(0, 5)
      .map((item, index) => `${index + 1}. (${item.partOfSpeech || "word"}) ${item.definition}`)
      .join("\n");
    elements.meaningInput.value = await buildJapaneseMeaning(word, definitions);
    elements.examplesInput.value = mergeLines([...inferExamples(word, definitions), ...lookup.examples]);
    elements.usageInput.value = mergeLines([
      ...inferUsagePatterns(word, definitions).split("\n"),
      ...lookup.phrases.map((phrase) => `辞書フレーズ: ${phrase}`),
    ]);
    cleanGeneratedContext();
    await fetchRelatedWords(word, lookup.related);
    setStatus(`${lookup.source}から訳語、定義、型、関連語、例文をまとめて反映しました。`);
  } catch {
    setStatus("カード生成に失敗しました。訳語更新や手入力で進められます。");
  }
}

async function lookupWord(word) {
  const key = state.settings.merriamWebsterKey.trim();
  if (key) {
    try {
      return await lookupMerriamWebsterLearners(word, key);
    } catch {
      setStatus("Merriam-Websterに接続できませんでした。無料辞書へ切り替えます。");
    }
  }

  return lookupFreeDictionary(word);
}

async function lookupFreeDictionary(word) {
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!response.ok) throw new Error("dictionary lookup failed");
  const [entry] = await response.json();
  const definitions = (entry?.meanings || []).flatMap((meaning) => {
    return (meaning.definitions || []).map((definition) => ({
      partOfSpeech: meaning.partOfSpeech,
      definition: definition.definition,
      example: definition.example,
      synonyms: definition.synonyms || [],
    }));
  });

  return {
    source: "Free Dictionary",
    phonetic: entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text || "",
    definitions,
    examples: definitions.map((item) => item.example).filter(Boolean),
    phrases: [],
    related: definitions.flatMap((item) => item.synonyms || []),
  };
}

async function lookupMerriamWebsterLearners(word, key) {
  const url = new URL(`https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(word)}`);
  url.searchParams.set("key", key);
  const response = await fetch(url);
  if (!response.ok) throw new Error("merriam-webster lookup failed");
  const entries = await response.json();
  if (!Array.isArray(entries) || !entries.length || typeof entries[0] === "string") {
    throw new Error("merriam-webster entry missing");
  }

  const parsed = entries
    .filter((entry) => typeof entry === "object")
    .slice(0, 3)
    .map(parseMerriamWebsterEntry);

  const definitions = parsed.flatMap((entry) => entry.definitions);
  if (!definitions.length) throw new Error("merriam-webster definitions missing");

  return {
    source: "Merriam-Webster",
    phonetic: parsed.find((entry) => entry.phonetic)?.phonetic || "",
    definitions,
    examples: parsed.flatMap((entry) => entry.examples),
    phrases: parsed.flatMap((entry) => entry.phrases),
    related: parsed.flatMap((entry) => entry.related),
  };
}

function parseMerriamWebsterEntry(entry) {
  const definitions = [];
  const examples = [];
  const phrases = [];
  const related = [];
  const partOfSpeech = entry.fl || "word";
  const phonetic = entry.hwi?.prs?.find((item) => item.ipa)?.ipa || "";

  for (const shortDefinition of entry.shortdef || []) {
    definitions.push({ partOfSpeech, definition: cleanMwText(shortDefinition), example: "" });
  }

  for (const stem of entry.meta?.stems || []) {
    if (stem.includes(" ") || stem.includes("/")) phrases.push(cleanMwText(stem));
  }

  walkMwNode(entry.def, (sense) => {
    const data = parseMwSense(sense, partOfSpeech);
    if (data.definition) definitions.push({ partOfSpeech, definition: data.definition, example: data.examples[0] || "" });
    examples.push(...data.examples);
  });

  walkMwNode(entry.dros, (sense) => {
    const data = parseMwSense(sense, partOfSpeech);
    if (data.definition) definitions.push({ partOfSpeech, definition: data.definition, example: data.examples[0] || "" });
    examples.push(...data.examples);
  });

  related.push(...phrases);

  return {
    phonetic,
    definitions: uniqueDefinitions(definitions),
    examples: [...new Set(examples.map(cleanMwText).filter(Boolean))],
    phrases: [...new Set(phrases.filter(Boolean))],
    related: [...new Set(related.filter(Boolean))],
  };
}

function walkMwNode(node, onSense) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) walkMwNode(item, onSense);
    return;
  }
  if (typeof node !== "object") return;

  if (Array.isArray(node.dt)) onSense(node);
  for (const value of Object.values(node)) walkMwNode(value, onSense);
}

function parseMwSense(sense, partOfSpeech) {
  const definitions = [];
  const examples = [];

  for (const item of sense.dt || []) {
    const [type, value] = item;
    if (type === "text") definitions.push(cleanMwText(value));
    if (type === "vis") {
      for (const example of value || []) {
        if (example.t) examples.push(cleanMwText(example.t));
      }
    }
    if (type === "uns") {
      walkMwNode(value, (nestedSense) => {
        const nested = parseMwSense(nestedSense, partOfSpeech);
        definitions.push(nested.definition);
        examples.push(...nested.examples);
      });
    }
  }

  return {
    definition: cleanMwText(definitions.filter(Boolean).join(" ")),
    examples,
  };
}

function cleanMwText(text) {
  return String(text || "")
    .replace(/\{bc\}/g, "")
    .replace(/\{\/?it\}/g, "")
    .replace(/\{\/?b\}/g, "")
    .replace(/\{sc\}/g, "")
    .replace(/\{\/sc\}/g, "")
    .replace(/\{(?:d_link|a_link|sx)\|([^|}]+)(?:\|[^}]*)?\}/g, "$1")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueDefinitions(definitions) {
  const seen = new Set();
  return definitions.filter((item) => {
    const key = `${item.partOfSpeech}:${item.definition}`;
    if (!item.definition || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeLines(lines) {
  return [...new Set(lines.filter(Boolean).map((line) => line.trim()))].join("\n");
}

function isGeneratedMeaningLine(line) {
  return line === "集約する" || /^(意味の核|訳語候補|定義訳\d+|注意):/.test(line);
}

function mergeMeaningHint(current, generatedLines) {
  const lines = (current || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !isGeneratedMeaningLine(line));
  return mergeLines([...generatedLines, ...lines]);
}

async function buildJapaneseMeaning(word, definitions) {
  const generated = [];
  const coreMeaning = inferCoreMeaning(word)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const curatedTranslation = getCuratedTranslation(word);

  generated.push(...coreMeaning);

  if (curatedTranslation) {
    generated.push(`訳語候補: ${curatedTranslation}`);
  } else {
    const translatedWord = await translateEnglishToJapanese(word);
    if (translatedWord) generated.push(`訳語候補: ${translatedWord}`);
  }

  const definitionsToTranslate = definitions
    .map((item) => item.definition)
    .filter(Boolean)
    .slice(0, 3);
  const translatedDefinitions = await Promise.all(
    definitionsToTranslate.map((definition) => translateEnglishToJapanese(definition))
  );

  translatedDefinitions.forEach((definition, index) => {
    if (definition) generated.push(`定義訳${index + 1}: ${definition}`);
  });

  if (!generated.length) {
    generated.push("意味の核: 英英定義と例文から、中心イメージを自分の言葉で1行にまとめる。");
  }

  return mergeMeaningHint(elements.meaningInput.value, generated);
}

function inferCoreMeaning(word) {
  const manualHints = {
    accommodate: [
      "意味の核: 人・物・要望・状況を受け入れられるように、場所・条件・予定などを合わせる。",
      "訳語候補: 収容する、宿泊させる、対応する、要望に応じる、適応させる。",
      "注意: 「収容する」だけで覚えると、accommodate a request / accommodate needs の意味を取り逃がしやすい。",
    ],
  };

  return (manualHints[word.toLowerCase()] || []).join("\n");
}

function inferExamples(word, definitions) {
  return [
    ...definitions.map((item) => item.example).filter(Boolean),
  ].slice(0, 10);
}

function normalizedSentence(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function generatedContextCandidates(word) {
  return new Set([
    "Mary danced into the house.",
    "to accommodate ourselves to circumstances",
    "to accommodate differences",
    "to accommodate an old friend for a week",
    "to accommodate a friend with a loan",
    "to accommodate prophecy to events",
    "The hotel can accommodate 200 guests.",
    "We can accommodate your request if you contact us in advance.",
    "The schedule was changed to accommodate the visiting team.",
    "The classroom was adapted to accommodate students with different needs.",
    ...(word?.examples || "").split("\n"),
  ].map(normalizedSentence));
}

function isGeneratedContext(context, word) {
  const normalized = normalizedSentence(context);
  return !normalized || generatedContextCandidates(word).has(normalized);
}

function getReviewPrompt(word) {
  if (!isGeneratedContext(word.context, word)) {
    return {
      source: "Kindle本文",
      text: word.context,
    };
  }

  const example = firstUsefulLine(word.examples);
  if (example) {
    return {
      source: "収録例文",
      text: example,
    };
  }

  return {
    source: "例文なし",
    text: "例文を生成または登録すると、ここに出題文として表示されます。",
  };
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inflectedForms(word) {
  const lower = String(word || "").toLowerCase();
  const forms = new Set([lower]);
  if (!lower) return [];

  forms.add(`${lower}s`);
  forms.add(`${lower}ed`);
  forms.add(`${lower}ing`);

  if (lower.endsWith("e")) {
    forms.add(`${lower}d`);
    forms.add(`${lower.slice(0, -1)}ing`);
  }

  return [...forms].sort((a, b) => b.length - a.length);
}

function createClozePrompt(sentence, word) {
  const forms = inflectedForms(word);
  if (!sentence || !forms.length) return { text: sentence || "", didHide: false };

  const pattern = new RegExp(`\\b(${forms.map(escapeRegExp).join("|")})\\b`, "i");
  if (!pattern.test(sentence)) return { text: sentence, didHide: false };

  return {
    text: sentence.replace(pattern, "_____"),
    didHide: true,
  };
}

function cleanGeneratedContext() {
  const current = elements.contextInput.value.trim();

  if (isGeneratedContext(current, { examples: elements.examplesInput.value })) {
    elements.contextInput.value = "";
  }
}

function inferUsagePatterns(word, definitions) {
  const lowerWord = word.toLowerCase();
  const examplePatterns = definitions
    .map((item) => item.example)
    .filter(Boolean)
    .map((example) => example.replace(new RegExp(`\\b${lowerWord}\\b`, "i"), lowerWord))
    .slice(0, 5);

  const manualHints = {
    accommodate: [
      "accommodate guests/customers/people = 人を収容する・泊める",
      "accommodate a request/need/preference = 要望や必要に応じる",
      "accommodate A to B = AをBに合わせる",
      "be accommodated in/at = 宿泊・収容される",
    ],
  };

  return [...(manualHints[lowerWord] || []), ...examplePatterns].join("\n");
}

async function fetchRelatedWords(word, sourceRelated = []) {
  const lowerWord = word.toLowerCase();
  const manualRelated = {
    accommodate: [
      "目的語: guests, visitors, customers, people, students",
      "要望: request, needs, preferences, schedule, changes",
      "類義語: adapt, adjust, make room for, allow for",
      "注意: accommodate は他動詞として使うことが多い。accommodate to は「適応する/させる」の型。",
    ],
  };

  const urls = [
    `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=8`,
    `https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=8`,
    `https://api.datamuse.com/words?rel_jja=${encodeURIComponent(word)}&max=8`,
  ];
  const responses = await Promise.all(urls.map((url) => fetch(url)));
  const [similar, triggered, modifiedBy] = await Promise.all(responses.map((response) => response.ok ? response.json() : []));
  const apiRelated = [
    similar.length ? `類義語候補: ${similar.map((item) => item.word).join(", ")}` : "",
    triggered.length ? `連想語候補: ${triggered.map((item) => item.word).join(", ")}` : "",
    modifiedBy.length ? `一緒に出やすい語候補: ${modifiedBy.map((item) => item.word).join(", ")}` : "",
  ];
  const sourceLines = sourceRelated.length ? [`辞書由来: ${sourceRelated.slice(0, 12).join(", ")}`] : [];
  elements.collocationsInput.value = mergeLines([...(manualRelated[lowerWord] || []), ...sourceLines, ...apiRelated]);
}

function setTranslationCandidate(translated) {
  const existing = elements.meaningInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !isGeneratedMeaningLine(line));
  elements.meaningInput.value = mergeLines([...existing, `訳語候補: ${translated}`]);
}

function getCuratedTranslation(word) {
  const translations = {
    accommodate: "収容する、宿泊させる、要望に応じる、都合をつける、適応させる",
  };

  return translations[word.toLowerCase()] || "";
}

async function translateEnglishToJapanese(text) {
  if (!text) return "";

  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", "en|ja");
    const response = await fetch(url);
    if (!response.ok) throw new Error("translation lookup failed");
    const result = await response.json();
    return result?.responseData?.translatedText?.trim() || "";
  } catch {
    return "";
  }
}

async function fetchJapaneseMeaning(options = {}) {
  const word = elements.wordInput.value.trim();
  if (!word) {
    setStatus("先に単語を入れてください。");
    elements.wordInput.focus();
    return;
  }

  if (!options.silent) setStatus("日本語訳を取得中です。");

  try {
    const curated = getCuratedTranslation(word);
    if (curated) {
      setTranslationCandidate(curated);
      if (!options.silent) setStatus("訳語候補を更新しました。同じ候補は重複しません。");
      return;
    }

    const translated = await translateEnglishToJapanese(word);
    if (!translated) throw new Error("translation missing");

    setTranslationCandidate(translated);
    if (!options.silent) setStatus("訳語候補を更新しました。同じ候補は重複しません。");
  } catch {
    if (!options.silent) setStatus("日本語訳を取得できませんでした。手入力で進められます。");
  }
}

function speakWord() {
  const word = currentReviewWord();
  if (!word || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(word.word);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function firstUsefulLine(text, prefixesToPrefer = []) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const prefix of prefixesToPrefer) {
    const found = lines.find((line) => line.startsWith(prefix));
    if (found) return found.replace(prefix, "").trim();
  }

  return lines[0] || "";
}

function compactPreview(text, fallback = "未入力") {
  const cleaned = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > 130 ? `${cleaned.slice(0, 130)}...` : cleaned;
}

function renderLibrary() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const words = state.words.filter((word) => {
    const haystack = [
      word.word,
      word.meaning,
      word.definition,
      word.usage,
      word.collocations,
      word.examples,
      word.book,
      word.context,
      word.production,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  elements.librarySubtitle.textContent = `${words.length} / ${state.words.length}語`;
  elements.wordList.textContent = "";

  if (!words.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<h3>該当なし</h3><p>検索条件を変えるか、新しい単語を登録してください。</p>";
    elements.wordList.append(empty);
    return;
  }

  for (const word of words) {
    const node = elements.wordItemTemplate.content.cloneNode(true);
    const item = node.querySelector(".word-item");
    item.dataset.id = word.id;
    node.querySelector("h3").textContent = word.word;
    node.querySelector(".item-meta").textContent = [
      word.book || "No book",
      `次回 ${word.nextReview || todayIso()}`,
      LEARNING_STAGES[getLearningStage(word)],
    ].join(" · ");
    node.querySelector(".status-pill").textContent = LEARNING_STAGES[getLearningStage(word)];
    node.querySelector(".status-pill").classList.toggle("is-mastered", word.status === "mastered");
    node.querySelector(".item-core").textContent = compactPreview(
      firstUsefulLine(word.meaning, ["意味の核:", "訳語候補:"]) || word.definition
    );
    node.querySelector(".item-usage").textContent = compactPreview(firstUsefulLine(word.usage), "型は未入力");
    node.querySelector(".item-example").textContent = compactPreview(firstUsefulLine(word.examples || word.context), "例文は未入力");
    node.querySelector(".detail-meaning").textContent = word.meaning || "未入力";
    node.querySelector(".detail-usage").textContent = word.usage || "未入力";
    node.querySelector(".detail-examples").textContent = word.examples || "未入力";
    node.querySelector(".detail-definition").textContent = word.definition || "未入力";
    node.querySelector(".detail-collocations").textContent = word.collocations || "未入力";
    node.querySelector(".detail-context").textContent = word.context || "未入力";
    node.querySelector(".detail-production").textContent = word.production || "未入力";
    elements.wordList.append(node);
  }
}

function getMissingLearningFields(word) {
  return [
    ["meaning", "意味"],
    ["usage", "型"],
    ["examples", "例文"],
    ["production", "自作文"],
  ]
    .filter(([key]) => !String(word[key] || "").trim())
    .map(([, label]) => label);
}

function daysUntil(dateIso) {
  if (!dateIso) return 0;
  const today = new Date(todayIso());
  const target = new Date(dateIso);
  return Math.round((target - today) / MS_PER_DAY);
}

function weakScoreForWord(word) {
  const history = word.history || [];
  const recent = history.slice(-5);
  const againCount = history.filter((item) => item.grade === "again").length;
  const hardCount = history.filter((item) => item.grade === "hard").length;
  const recentMisses = recent.filter((item) => item.grade !== "good").length;
  const stage = getLearningStage(word);
  const dueBoost = (word.nextReview || todayIso()) <= todayIso() ? 1.6 : 0;
  const missingBoost = Math.min(2.4, getMissingLearningFields(word).length * 0.6);
  const easePenalty = Math.max(0, 2.35 - (Number(word.ease) || 2.35));
  const stagePenalty = stage === "comprehension" ? 0.8 : stage === "lightRecall" ? 0.5 : 0;

  return Number(
    (
      againCount * 2.4 +
      hardCount * 1.15 +
      recentMisses * 1.35 +
      dueBoost +
      missingBoost +
      easePenalty +
      stagePenalty
    ).toFixed(1)
  );
}

function buildLearningEvents() {
  return state.words
    .flatMap((word) =>
      (word.history || []).map((item, index) => ({
        word,
        index,
        date: item.date || "",
        grade: item.grade || "",
        stage: item.stage || getLearningStage(word),
        nextReview: item.nextReview || word.nextReview || "",
      }))
    )
    .sort((a, b) => {
      const dateOrder = b.date.localeCompare(a.date);
      return dateOrder || b.index - a.index || a.word.word.localeCompare(b.word.word);
    });
}

function buildAnalysisStats() {
  const total = state.words.length;
  const dueWords = getDueWords();
  const mastered = state.words.filter((word) => getLearningStage(word) === "mastered").length;
  const stageCounts = Object.fromEntries(Object.keys(LEARNING_STAGES).map((stage) => [stage, 0]));
  let readinessTotal = 0;

  for (const word of state.words) {
    const stage = getLearningStage(word);
    stageCounts[stage] += 1;
    readinessTotal += STAGE_WEIGHTS[stage] || 0;
  }

  const weakWords = state.words
    .map((word) => ({ word, score: weakScoreForWord(word) }))
    .filter((item) => item.score >= 2.5)
    .sort((a, b) => b.score - a.score || a.word.word.localeCompare(b.word.word));

  const averageReadiness = total ? readinessTotal / total : 0;
  const weakPenalty = total ? Math.min(18, (weakWords.length / total) * 16) : 0;
  const retentionScore = Math.max(0, Math.min(100, Math.round(averageReadiness - weakPenalty)));

  return {
    total,
    dueWords,
    mastered,
    masteredRate: total ? Math.round((mastered / total) * 100) : 0,
    stageCounts,
    weakWords,
    retentionScore,
    events: buildLearningEvents(),
  };
}

function makeActionButton(label, action, id = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ghost-button compact-action";
  button.dataset.analysisAction = action;
  if (id) button.dataset.id = id;
  button.textContent = label;
  return button;
}

function renderRecommendations(stats) {
  const cards = [];
  const productionTargets = state.words.filter((word) => getLearningStage(word) === "production" && !word.production);
  const incompleteCards = state.words.filter((word) => getMissingLearningFields(word).length >= 2);
  const todayReviews = countReviewsOn(todayIso());
  const dailyGoal = normalizeDailyGoal(state.settings.dailyReviewGoal);

  if (!stats.total) {
    cards.push({
      title: "まずは1語だけ登録",
      text: "Kindle本文で出会った文と一緒に保存すると、あとで理解モードから始められます。",
      action: "add",
      label: "登録へ",
    });
  } else if (stats.dueWords.length) {
    cards.push({
      title: "期限が来た単語を先に復習",
      text: `${stats.dueWords.length}語が今日の復習対象です。短時間でも間隔反復の効果が出やすい部分です。`,
      action: "review",
      label: "復習へ",
    });
  }

  if (stats.weakWords.length) {
    const top = stats.weakWords[0].word;
    cards.push({
      title: `弱点トップは「${top.word}」`,
      text: "いきなり穴埋めで押し切らず、意味の核・型・例文を一度見直すのがおすすめです。",
      action: "edit",
      id: top.id,
      label: "カードを見る",
    });
  }

  if (productionTargets.length) {
    cards.push({
      title: "アウトプット前の準備",
      text: `${productionTargets.length}語は自作文が未登録です。自分の生活や仕事に寄せると記憶に残りやすくなります。`,
      action: "edit",
      id: productionTargets[0].id,
      label: "自作文を書く",
    });
  }

  if (incompleteCards.length) {
    cards.push({
      title: "カードの材料を補強",
      text: `${incompleteCards.length}語は意味・型・例文などが薄めです。復習前に材料を足すと負荷が自然になります。`,
      action: "edit",
      id: incompleteCards[0].id,
      label: "補強する",
    });
  }

  if (stats.total && todayReviews < dailyGoal && !stats.dueWords.length) {
    cards.push({
      title: "今日は新規登録もあり",
      text: `今日の学習は ${todayReviews} / ${dailyGoal} 回です。復習が空なら、Kindleから新しい1語を追加する日です。`,
      action: "add",
      label: "登録へ",
    });
  }

  elements.recommendationList.textContent = "";
  for (const card of cards.slice(0, 4)) {
    const item = document.createElement("article");
    item.className = "recommendation-card";
    const title = document.createElement("h4");
    title.textContent = card.title;
    const text = document.createElement("p");
    text.textContent = card.text;
    item.append(title, text, makeActionButton(card.label, card.action, card.id));
    elements.recommendationList.append(item);
  }
}

function renderStageDistribution(stats) {
  elements.stageDistribution.textContent = "";

  if (!stats.total) {
    const empty = document.createElement("p");
    empty.className = "analysis-empty";
    empty.textContent = "単語を登録すると、ステージ分布が表示されます。";
    elements.stageDistribution.append(empty);
    return;
  }

  for (const [stage, label] of Object.entries(LEARNING_STAGES)) {
    const count = stats.stageCounts[stage] || 0;
    const percent = Math.round((count / stats.total) * 100);
    const row = document.createElement("div");
    row.className = "stage-row";

    const top = document.createElement("div");
    top.className = "stage-row-top";
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("strong");
    value.textContent = `${count}語`;
    top.append(name, value);

    const track = document.createElement("div");
    track.className = "mini-track";
    const bar = document.createElement("div");
    bar.style.width = `${percent}%`;
    track.append(bar);

    row.append(top, track);
    elements.stageDistribution.append(row);
  }
}

function renderWeakWords(stats) {
  elements.weakWordList.textContent = "";

  if (!stats.weakWords.length) {
    const empty = document.createElement("p");
    empty.className = "analysis-empty";
    empty.textContent = stats.total
      ? "大きな弱点候補はまだありません。復習履歴が増えるほど精度が上がります。"
      : "単語を登録すると、弱点ランキングが表示されます。";
    elements.weakWordList.append(empty);
    return;
  }

  for (const { word, score } of stats.weakWords.slice(0, 6)) {
    const row = document.createElement("article");
    row.className = "weak-word-card";

    const main = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = word.word;
    const meta = document.createElement("p");
    const missing = getMissingLearningFields(word);
    meta.textContent = [
      LEARNING_STAGES[getLearningStage(word)],
      (word.nextReview || todayIso()) <= todayIso() ? "今日復習" : `あと${Math.max(0, daysUntil(word.nextReview))}日`,
      missing.length ? `不足: ${missing.join("・")}` : "材料あり",
    ].join(" · ");
    main.append(title, meta);

    const scoreBox = document.createElement("div");
    scoreBox.className = "weak-score";
    const scoreLabel = document.createElement("span");
    scoreLabel.textContent = "弱点";
    const scoreValue = document.createElement("strong");
    scoreValue.textContent = score;
    scoreBox.append(scoreLabel, scoreValue);

    const actions = document.createElement("div");
    actions.className = "analysis-actions";
    actions.append(
      makeActionButton("復習へ", "review-word", word.id),
      makeActionButton("編集", "edit", word.id)
    );

    row.append(main, scoreBox, actions);
    elements.weakWordList.append(row);
  }
}

function renderHistoryTimeline(stats) {
  elements.historyTimeline.textContent = "";

  if (!stats.events.length) {
    const empty = document.createElement("p");
    empty.className = "analysis-empty";
    empty.textContent = "復習すると、ここに評価ログが積み上がります。";
    elements.historyTimeline.append(empty);
    return;
  }

  for (const event of stats.events.slice(0, 10)) {
    const row = document.createElement("article");
    row.className = `history-row grade-${event.grade}`;

    const mark = document.createElement("span");
    mark.className = "history-mark";
    mark.textContent = GRADE_LABELS[event.grade]?.slice(0, 1) || "・";

    const body = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = event.word.word;
    const meta = document.createElement("p");
    meta.textContent = [
      event.date || "日付なし",
      GRADE_LABELS[event.grade] || event.grade || "評価なし",
      LEARNING_STAGES[event.stage] || event.stage,
      event.nextReview ? `次回 ${event.nextReview}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    body.append(title, meta);

    row.append(mark, body);
    elements.historyTimeline.append(row);
  }
}

function renderAnalysis() {
  const stats = buildAnalysisStats();
  const todayReviews = countReviewsOn(todayIso());
  const dailyGoal = normalizeDailyGoal(state.settings.dailyReviewGoal);

  elements.analysisSubtitle.textContent = stats.total
    ? `${stats.total}語の履歴から、今日の優先順位と弱点を見ています。`
    : "単語を登録すると、進捗・弱点・おすすめ学習が見えるようになります。";
  elements.analysisDueCount.textContent = `${stats.dueWords.length}語`;
  elements.analysisRetentionScore.textContent = `${stats.retentionScore}%`;
  elements.analysisRetentionBar.style.width = `${stats.retentionScore}%`;
  elements.analysisWeakCount.textContent = `${stats.weakWords.length}語`;
  elements.analysisMasteredRate.textContent = `${stats.masteredRate}%`;

  renderRecommendations(stats);
  renderStageDistribution(stats);
  renderWeakWords(stats);
  renderHistoryTimeline(stats);

  if (stats.total && todayReviews >= dailyGoal) {
    elements.analysisSubtitle.textContent += " 今日の目標は達成済みです。";
  }
}

function editWord(id) {
  const word = state.words.find((item) => item.id === id);
  if (!word) return;

  state.editingId = id;
  elements.wordInput.value = word.word || "";
  elements.phoneticInput.value = word.phonetic || "";
  elements.bookInput.value = word.book || "";
  elements.meaningInput.value = word.meaning || "";
  elements.definitionInput.value = word.definition || "";
  elements.usageInput.value = word.usage || "";
  elements.collocationsInput.value = word.collocations || "";
  elements.examplesInput.value = word.examples || "";
  elements.contextInput.value = isGeneratedContext(word.context, word) ? "" : word.context || "";
  elements.productionInput.value = word.production || "";
  elements.noteInput.value = word.note || "";
  elements.entryForm.querySelector(".primary-button").textContent = "更新";
  setStatus("編集しています。");
  setView("add");
}

function resetWordReview(id) {
  const word = state.words.find((item) => item.id === id);
  if (!word) return;
  word.nextReview = todayIso();
  word.status = "learning";
  saveState();
  rebuildReviewQueue();
  renderAll();
}

function queueWordForReview(id) {
  const word = state.words.find((item) => item.id === id);
  if (!word) return;

  word.nextReview = todayIso();
  word.status = "learning";
  saveState();
  rebuildReviewQueue();
  state.reviewQueue = [id, ...state.reviewQueue.filter((itemId) => itemId !== id)];
  state.reviewIndex = 0;
  state.answerVisible = false;
  setView("review");
}

function deleteWord(id) {
  state.words = state.words.filter((word) => word.id !== id);
  saveState();
  rebuildReviewQueue();
  renderAll();
}

function wordToMarkdown(word) {
  const tags = ["#vocabulary", word.status === "mastered" ? "#mastered" : "#learning"].join(" ");
  return [
    `## ${word.word}`,
    "",
    `- Tags: ${tags}`,
    `- Book: ${word.book || ""}`,
    `- Phonetic: ${word.phonetic || ""}`,
    `- Meaning: ${word.meaning || ""}`,
    `- Definition: ${word.definition || ""}`,
    `- Usage: ${word.usage || ""}`,
    `- Collocations: ${word.collocations || ""}`,
    `- Learning stage: ${LEARNING_STAGES[getLearningStage(word)]}`,
    `- Next review: ${word.nextReview || ""}`,
    "",
    "### Examples",
    word.examples || "",
    "",
    "### Context",
    word.context || "",
    "",
    "### My Sentence",
    word.production || "",
    "",
    "### Note",
    word.note || "",
  ].join("\n");
}

function buildMarkdown() {
  const header = [
    "# Kindle Vocabulary",
    "",
    `Updated: ${new Date().toISOString()}`,
    "",
  ].join("\n");
  return header + state.words.map(wordToMarkdown).join("\n\n---\n\n");
}

function renderExports() {
  elements.markdownOutput.value = buildMarkdown();
  elements.jsonOutput.value = JSON.stringify({ words: state.words }, null, 2);
}

function renderSettings() {
  elements.dailyGoalInput.value = state.settings.dailyReviewGoal;
  elements.mwKeyInput.value = state.settings.merriamWebsterKey;
  elements.settingsStatus.textContent = state.settings.merriamWebsterKey
    ? "Merriam-Websterを優先してカード生成します。"
    : "APIキー未設定です。無料辞書にフォールバックします。";
  refreshPwaStatus();
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  state.settings.dailyReviewGoal = normalizeDailyGoal(elements.dailyGoalInput.value);
  state.settings.merriamWebsterKey = elements.mwKeyInput.value.trim();
  saveSettings();
  renderSettings();
  renderProgressBoard();
  elements.settingsStatus.textContent = "設定を保存しました。";
}

function clearSettings() {
  state.settings.merriamWebsterKey = "";
  state.settings.dailyReviewGoal = DEFAULT_DAILY_REVIEW_GOAL;
  state.settings.lastGoalCelebratedDate = "";
  state.settings.lastStreakCelebrated = 0;
  saveSettings();
  renderSettings();
  renderProgressBoard();
  elements.settingsStatus.textContent = "設定を初期化しました。";
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function refreshPwaStatus() {
  if (!elements.pwaStatus || !elements.installAppButton) return;

  if (isStandaloneApp()) {
    elements.pwaStatus.textContent = "ホーム画面からアプリとして起動中です。";
    elements.installAppButton.hidden = true;
    return;
  }

  if (state.installPrompt) {
    elements.pwaStatus.textContent = "この端末ではインストールできます。ボタンを押すとホーム画面に追加できます。";
    elements.installAppButton.hidden = false;
    return;
  }

  elements.pwaStatus.textContent = "Android Chromeで公開URLを開き、メニューから「アプリをインストール」または「ホーム画面に追加」を選べます。";
  elements.installAppButton.hidden = true;
}

async function installApp() {
  if (!state.installPrompt) {
    refreshPwaStatus();
    return;
  }

  const promptEvent = state.installPrompt;
  state.installPrompt = null;
  promptEvent.prompt();
  await promptEvent.userChoice.catch(() => null);
  refreshPwaStatus();
}

function setupPwaInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    refreshPwaStatus();
  });

  window.addEventListener("appinstalled", () => {
    state.installPrompt = null;
    refreshPwaStatus();
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      if (elements.pwaStatus) {
        elements.pwaStatus.textContent = "オフライン起動の準備に失敗しました。再読み込みしてもう一度確認してください。";
      }
    });
  });
}

async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  const label = button.textContent;
  button.textContent = "コピー済み";
  setTimeout(() => {
    button.textContent = label;
  }, 1100);
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function shuffleQueue() {
  for (let i = state.reviewQueue.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.reviewQueue[i], state.reviewQueue[j]] = [state.reviewQueue[j], state.reviewQueue[i]];
  }
  state.reviewIndex = 0;
  state.answerVisible = false;
  renderReview();
}

function bindEvents() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });

  $$("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.jump));
  });

  elements.entryForm.addEventListener("submit", handleSubmit);
  elements.fetchButton.addEventListener("click", fetchDefinition);
  elements.translateButton.addEventListener("click", fetchJapaneseMeaning);
  elements.showAnswerButton.addEventListener("click", () => {
    state.answerVisible = !state.answerVisible;
    renderReview();
  });
  elements.speakButton.addEventListener("click", speakWord);
  elements.shuffleButton.addEventListener("click", shuffleQueue);

  $$(".review-actions button").forEach((button) => {
    button.addEventListener("click", () => gradeCurrentWord(button.dataset.grade));
  });

  elements.searchInput.addEventListener("input", renderLibrary);

  elements.wordList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    const item = event.target.closest(".word-item");
    if (!button || !item) return;

    if (button.dataset.action === "edit") editWord(item.dataset.id);
    if (button.dataset.action === "reset") resetWordReview(item.dataset.id);
    if (button.dataset.action === "delete") deleteWord(item.dataset.id);
  });

  $("#analysisView").addEventListener("click", (event) => {
    const button = event.target.closest("[data-analysis-action]");
    if (!button) return;

    const { analysisAction, id } = button.dataset;
    if (analysisAction === "review") setView("review");
    if (analysisAction === "add") setView("add");
    if (analysisAction === "edit" && id) editWord(id);
    if (analysisAction === "review-word" && id) queueWordForReview(id);
  });

  elements.copyMarkdownButton.addEventListener("click", () => copyText(elements.markdownOutput.value, elements.copyMarkdownButton));
  elements.copyJsonButton.addEventListener("click", () => copyText(elements.jsonOutput.value, elements.copyJsonButton));
  elements.downloadMarkdownButton.addEventListener("click", () => downloadText("kindle-vocabulary.md", elements.markdownOutput.value, "text/markdown"));
  elements.downloadJsonButton.addEventListener("click", () => downloadText("kindle-vocabulary.json", elements.jsonOutput.value, "application/json"));
  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
  elements.clearSettingsButton.addEventListener("click", clearSettings);
  elements.installAppButton.addEventListener("click", installApp);
}

function renderAll() {
  renderShell();
  if (state.activeView === "review") renderReview();
  if (state.activeView === "library") renderLibrary();
  if (state.activeView === "analysis") renderAnalysis();
  if (state.activeView === "export") renderExports();
  if (state.activeView === "settings") renderSettings();
}

function init() {
  loadState();
  loadSettings();
  setupPwaInstallPrompt();
  registerServiceWorker();
  bindEvents();
  rebuildReviewQueue();
  renderAll();
}

init();
