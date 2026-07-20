(() => {
  "use strict";

  const QUESTIONS = window.TEST_QUESTIONS || [];
  const STRATEGIES = window.TEST_STRATEGIES || {};
  const RESULTS = window.TEST_RESULTS || {};
  const ANSWERS = [
    { label: "Совсем не про меня", value: 0 },
    { label: "Скорее не про меня", value: 1 },
    { label: "Скорее про меня", value: 2 },
    { label: "Очень похоже на меня", value: 3 }
  ];

  const state = {
    screen: "home",
    question: 0,
    answers: new Array(QUESTIONS.length).fill(null),
    resultKey: null,
    scores: {},
    tab: "about",
    locked: false,
    timer: null
  };

  const screens = {};
  const el = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.querySelectorAll("[data-screen]").forEach(node => {
      screens[node.dataset.screen] = node;
    });

    Object.assign(el, {
      questionBack: document.getElementById("question-back"),
      questionCounter: document.getElementById("question-counter"),
      questionPercent: document.getElementById("question-percent"),
      progressTrack: document.querySelector(".progress-track"),
      progressBar: document.getElementById("progress-bar"),
      questionCard: document.getElementById("question-card"),
      questionIndex: document.getElementById("question-index"),
      questionText: document.getElementById("question-text"),
      answers: document.getElementById("answers"),
      asideNumber: document.getElementById("aside-question-number"),
      analysisSteps: [...document.querySelectorAll("[data-analysis-step]")],
      analysisPercent: document.getElementById("analysis-percent"),
      analysisBar: document.getElementById("analysis-progress-bar"),
      analysisMessage: document.getElementById("analysis-message"),
      resultTitle: document.getElementById("result-title"),
      resultTagline: document.getElementById("result-tagline"),
      resultSummary: document.getElementById("result-summary"),
      resultDriver: document.getElementById("result-driver"),
      resultRepeat: document.getElementById("result-repeat"),
      resultStrength: document.getElementById("result-strength"),
      resultRisk: document.getElementById("result-risk"),
      resultVisualTitle: document.getElementById("result-visual-title"),
      resultImage: document.getElementById("result-image"),
      resultScorePercent: document.getElementById("result-score-percent"),
      resultScoreBar: document.getElementById("result-score-bar"),
      detailsTitle: document.getElementById("details-title"),
      detailsIntro: document.getElementById("details-intro"),
      detailsContent: document.getElementById("details-content"),
      detailsPanel: document.getElementById("details-panel"),
      detailsImage: document.getElementById("details-image"),
      detailsTabs: [...document.querySelectorAll("[data-tab]")],
      restartModal: document.getElementById("restart-modal")
    });

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyboard);
    el.detailsTabs.forEach(tab => tab.addEventListener("click", () => setTab(tab.dataset.tab)));

    renderQuestion();
    showScreen("home", false);
  }

  function handleClick(event) {
    const answer = event.target.closest("[data-answer-value]");
    if (answer) {
      selectAnswer(Number(answer.dataset.answerValue));
      return;
    }

    const actionNode = event.target.closest("[data-action]");
    if (!actionNode) return;

    const action = actionNode.dataset.action;
    const map = {
      "go-home": () => showScreen("home"),
      "to-intro": () => showScreen("intro"),
      "start-test": startTest,
      "prev-question": previousQuestion,
      "restart-test": openRestart,
      "open-details": () => { renderDetails(); showScreen("details"); },
      "back-to-result": () => showScreen("result"),
      "to-cta": () => showScreen("cta"),
      "back-to-details": () => showScreen("details"),
      "close-restart-modal": closeRestart,
      "confirm-restart": confirmRestart
    };
    if (map[action]) map[action]();
  }

  function handleKeyboard(event) {
    if (!el.restartModal.hidden) {
      if (event.key === "Escape") closeRestart();
      return;
    }
    if (state.screen !== "test") return;
    const n = Number(event.key);
    if (n >= 1 && n <= 4) selectAnswer(n - 1);
    if (event.key === "ArrowLeft") previousQuestion();
  }

  function showScreen(name, animate = true) {
    if (!screens[name] || state.locked) return;
    const current = screens[state.screen];
    const next = screens[name];
    if (current === next && !next.hidden) return;

    state.locked = true;

    const complete = () => {
      Object.values(screens).forEach(screen => {
        const active = screen === next;
        screen.hidden = !active;
        screen.classList.toggle("is-active", active);
        screen.classList.remove("is-fading-out", "is-fading-in");
      });
      state.screen = name;
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        next.classList.add("is-fading-in");
        setTimeout(() => {
          next.classList.remove("is-fading-in");
          state.locked = false;
        }, animate ? 450 : 0);
      });
    };

    if (!animate || !current || current.hidden) return complete();
    current.classList.add("is-fading-out");
    setTimeout(complete, 260);
  }

  function startTest() {
    state.question = 0;
    renderQuestion();
    showScreen("test");
  }

  function renderQuestion() {
    if (!QUESTIONS.length) return;
    const q = QUESTIONS[state.question];
    const number = state.question + 1;
    const percent = Math.round(number / QUESTIONS.length * 100);
    const selected = state.answers[state.question];

    el.questionCounter.textContent = `Вопрос ${number} из ${QUESTIONS.length}`;
    el.questionPercent.textContent = `${percent}%`;
    el.progressBar.style.width = `${percent}%`;
    el.progressTrack.setAttribute("aria-valuenow", String(percent));
    el.questionIndex.textContent = String(number).padStart(2, "0");
    el.questionText.textContent = q.text;
    el.asideNumber.textContent = String(number).padStart(2, "0");
    el.questionBack.disabled = state.question === 0;

    el.answers.innerHTML = ANSWERS.map((answer, index) => `
      <button class="answer-button${selected === answer.value ? " is-selected" : ""}"
              type="button"
              role="radio"
              aria-checked="${selected === answer.value}"
              data-answer-value="${answer.value}">
        <span class="answer-number">${index + 1}</span>
        <span class="answer-label">${escapeHtml(answer.label)}</span>
        <span class="answer-check" aria-hidden="true"></span>
      </button>
    `).join("");
  }

  function selectAnswer(value) {
    if (state.screen !== "test" || state.locked || !Number.isInteger(value) || value < 0 || value > 3) return;
    state.answers[state.question] = value;

    el.answers.querySelectorAll("[data-answer-value]").forEach(button => {
      const selected = Number(button.dataset.answerValue) === value;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });

    setTimeout(() => {
      if (state.question >= QUESTIONS.length - 1) beginAnalysis();
      else changeQuestion(1);
    }, 220);
  }

  function previousQuestion() {
    if (state.screen !== "test" || state.question === 0 || state.locked) return;
    changeQuestion(-1);
  }

  function changeQuestion(direction) {
    el.questionCard.classList.remove("is-entering");
    el.questionCard.classList.add("is-leaving");
    setTimeout(() => {
      state.question += direction;
      renderQuestion();
      el.questionCard.classList.remove("is-leaving");
      void el.questionCard.offsetWidth;
      el.questionCard.classList.add("is-entering");
      setTimeout(() => el.questionCard.classList.remove("is-entering"), 430);
    }, 220);
  }

  function beginAnalysis() {
    calculateResult();
    resetAnalysis();
    showScreen("analysis");
    clearInterval(state.timer);

    let progress = 0;
    state.timer = setInterval(() => {
      progress = Math.min(100, progress + 2);
      updateAnalysis(progress);
      if (progress >= 100) {
        clearInterval(state.timer);
        state.timer = null;
        setTimeout(() => {
          renderResult();
          showScreen("result");
        }, 400);
      }
    }, 70);
  }

  function resetAnalysis() {
    el.analysisPercent.textContent = "0%";
    el.analysisBar.style.width = "0%";
    el.analysisMessage.textContent = "Это займет несколько секунд";
    el.analysisSteps.forEach(step => step.classList.remove("is-active", "is-complete"));
  }

  function updateAnalysis(progress) {
    el.analysisPercent.textContent = `${progress}%`;
    el.analysisBar.style.width = `${progress}%`;
    const active = Math.min(3, Math.floor(progress / 25));

    el.analysisSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index === active && progress < 100);
      step.classList.toggle("is-complete", index < active || progress === 100);
    });

    if (progress < 25) el.analysisMessage.textContent = "Сопоставляем ответы";
    else if (progress < 50) el.analysisMessage.textContent = "Считаем выраженность стратегий";
    else if (progress < 75) el.analysisMessage.textContent = "Определяем ведущий механизм";
    else if (progress < 100) el.analysisMessage.textContent = "Формируем интерпретацию";
    else el.analysisMessage.textContent = "Результат готов";
  }

  function calculateResult() {
    const scores = {};
    Object.keys(STRATEGIES).forEach(key => scores[key] = 0);

    QUESTIONS.forEach((question, index) => {
      const value = state.answers[index];
      if (value !== null && scores[question.strategy] !== undefined) scores[question.strategy] += value;
    });

    const sorted = Object.entries(scores).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return (STRATEGIES[a[0]].order || 99) - (STRATEGIES[b[0]].order || 99);
    });

    state.scores = scores;
    state.resultKey = sorted[0][0];
  }

  function renderResult() {
    const key = state.resultKey;
    const strategy = STRATEGIES[key];
    const result = RESULTS[key];
    const score = state.scores[key] || 0;
    const max = QUESTIONS.filter(q => q.strategy === key).length * 3;
    const percent = max ? Math.round(score / max * 100) : 0;

    el.resultTitle.textContent = strategy.title;
    el.resultTagline.textContent = result.tagline;
    el.resultSummary.textContent = result.summary;
    el.resultDriver.textContent = result.driver;
    el.resultRepeat.textContent = result.repeat;
    el.resultStrength.textContent = result.strength;
    el.resultRisk.textContent = result.risk;
    el.resultVisualTitle.textContent = strategy.title;
    el.resultImage.src = strategy.image;
    el.resultImage.alt = `Иллюстрация стратегии «${strategy.title}»`;
    el.resultScorePercent.textContent = `${percent}%`;
    el.resultScoreBar.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => el.resultScoreBar.style.width = `${percent}%`));
  }

  function renderDetails() {
    const strategy = STRATEGIES[state.resultKey];
    const result = RESULTS[state.resultKey];
    el.detailsTitle.textContent = strategy.title;
    el.detailsIntro.textContent = result.detailsIntro;
    el.detailsImage.src = strategy.image;
    el.detailsImage.alt = `Иллюстрация стратегии «${strategy.title}»`;
    setTab(state.tab);
  }

  function setTab(name) {
    const result = RESULTS[state.resultKey];
    if (!result || !result.tabs[name]) return;
    state.tab = name;
    el.detailsTabs.forEach(tab => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    el.detailsContent.innerHTML = result.tabs[name];
  }

  function openRestart() {
    el.restartModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeRestart() {
    el.restartModal.hidden = true;
    document.body.style.overflow = "";
  }

  function confirmRestart() {
    clearInterval(state.timer);
    state.question = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.resultKey = null;
    state.scores = {};
    state.tab = "about";
    closeRestart();
    renderQuestion();
    showScreen("home");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();