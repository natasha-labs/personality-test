(() => {
  "use strict";

  const data = window.TEST_DATA;

  if (!data || !Array.isArray(data.questions) || !data.strategies || !Array.isArray(data.answers)) {
    console.error("TEST_DATA не загрузился или имеет неверную структуру.");
    return;
  }

  const { questions, strategies, answers } = data;

  const state = {
    index: 0,
    responses: Array(questions.length).fill(null),
    result: null,
    tab: "about",
    locked: false,
    analysisTimers: []
  };

  const elements = {
    screens: [...document.querySelectorAll(".screen")],
    answers: document.getElementById("answers"),
    questionCounter: document.getElementById("question-counter"),
    questionPercent: document.getElementById("question-percent"),
    progressBar: document.getElementById("progress-bar"),
    questionText: document.getElementById("question-text"),
    resultTitle: document.getElementById("result-title"),
    resultTagline: document.getElementById("result-tagline"),
    resultDriver: document.getElementById("result-driver"),
    resultRepeat: document.getElementById("result-repeat"),
    resultStrength: document.getElementById("result-strength"),
    resultRisk: document.getElementById("result-risk"),
    detailsContent: document.getElementById("details-content")
  };

  const show = (screenId) => {
    elements.screens.forEach((screen) => {
      screen.classList.toggle("active", screen.id === screenId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAnalysisTimers = () => {
    state.analysisTimers.forEach((timer) => clearTimeout(timer));
    state.analysisTimers = [];
  };

  const renderQuestion = () => {
    state.locked = false;

    const question = questions[state.index];
    const percent = Math.round(((state.index + 1) / questions.length) * 100);
    const selectedScore = state.responses[state.index];

    elements.questionCounter.textContent = `Вопрос ${state.index + 1} из ${questions.length}`;
    elements.questionPercent.textContent = `${percent}%`;
    elements.progressBar.style.width = `${percent}%`;
    elements.questionText.textContent = question.text;
    elements.answers.innerHTML = "";

    answers.forEach((answer) => {
      const button = document.createElement("button");
      const selected = selectedScore === answer.score;

      button.type = "button";
      button.className = `answer${selected ? " selected" : ""}`;
      button.innerHTML = `
        <span class="radio">${selected ? "✓" : ""}</span>
        <span>${answer.label}</span>
        <span class="answer-check">${selected ? "✓" : ""}</span>
      `;

      button.addEventListener("click", () => chooseAnswer(answer.score, button));
      elements.answers.appendChild(button);
    });

    elements.questionText.classList.remove("question-enter");
    void elements.questionText.offsetWidth;
    elements.questionText.classList.add("question-enter");
  };

  const chooseAnswer = (score, selectedButton) => {
    if (state.locked) return;

    state.locked = true;
    state.responses[state.index] = score;

    [...elements.answers.querySelectorAll(".answer")].forEach((button) => {
      const selected = button === selectedButton;
      button.classList.toggle("selected", selected);
      button.querySelector(".radio").textContent = selected ? "✓" : "";
      button.querySelector(".answer-check").textContent = selected ? "✓" : "";
    });

    window.setTimeout(() => {
      if (state.index < questions.length - 1) {
        state.index += 1;
        renderQuestion();
        return;
      }

      calculateResult();
      startAnalysis();
    }, 380);
  };

  const calculateResult = () => {
    const scores = Object.keys(strategies).reduce((accumulator, key) => {
      accumulator[key] = 0;
      return accumulator;
    }, {});

    questions.forEach((question, index) => {
      scores[question.strategy] += Number(state.responses[index] ?? 0);
    });

    const ranking = Object.entries(scores).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return Object.keys(strategies).indexOf(a[0]) - Object.keys(strategies).indexOf(b[0]);
    });

    state.result = {
      primary: ranking[0][0],
      secondary: ranking[1][0],
      scores
    };

    try {
      localStorage.setItem("personalityTestResult", JSON.stringify(state.result));
    } catch (error) {
      console.warn("Результат не сохранен в localStorage, но тест продолжает работу.", error);
    }
  };

  const startAnalysis = () => {
    clearAnalysisTimers();

    const steps = [...document.querySelectorAll(".analysis-step")];

    steps.forEach((step) => {
      step.classList.remove("done");
      step.querySelector(".analysis-mark").textContent = "○";
    });

    show("screen-analysis");

    const delay = 700;

    steps.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        step.classList.add("done");
        step.querySelector(".analysis-mark").textContent = "✓";
      }, delay * (index + 1));

      state.analysisTimers.push(timer);
    });

    const finishTimer = window.setTimeout(() => {
      renderResult();
      show("screen-result");
    }, delay * (steps.length + 1) + 250);

    state.analysisTimers.push(finishTimer);
  };

  const renderResult = () => {
    if (!state.result || !strategies[state.result.primary]) return;

    const strategy = strategies[state.result.primary];

    elements.resultTitle.textContent = strategy.title;
    elements.resultTagline.textContent = strategy.tagline;
    elements.resultDriver.textContent = strategy.driver;
    elements.resultRepeat.textContent = strategy.repeat;
    elements.resultStrength.textContent = strategy.strength;
    elements.resultRisk.textContent = strategy.risk;
  };

  const relationships = {
    rescuer: "В отношениях вы можете быстро занимать позицию того, кто понимает, выдерживает и помогает. Равенство нарушается незаметно: другой получает поддержку, а ваши потребности отходят на второй план.",
    controller: "Близость становится спокойнее, когда вы понимаете, что происходит и можете влиять на ход событий. Неопределенность и самостоятельность партнера могут переживаться как дистанция или потеря значимости.",
    achiever: "В отношениях вы можете пытаться быть достаточно хорошим, полезным или успешным, чтобы сохранять ценность. Собственная уязвимость и несовершенство переживаются особенно болезненно.",
    avoidant: "Вы можете оставаться рядом физически, но не допускать другого человека к наиболее уязвимым переживаниям. Партнер видит вашу самостоятельность, но не всегда понимает, насколько вам трудно.",
    dependent: "Связь с другим человеком становится источником устойчивости и направления. Поэтому дистанция, несогласие или недоступность партнера могут лишать вас не только поддержки, но и способности действовать."
  };

  const renderDetails = () => {
    if (!state.result) return;

    const key = state.result.primary;
    const strategy = strategies[key];
    let html = "";

    if (state.tab === "about") {
      html = `
        <h2>О типе</h2>
        <p>${strategy.about}</p>
        <div class="note">
          <strong>Важно помнить</strong>
          <p>Это не диагноз и не окончательное определение личности. Результат показывает наиболее выраженную стратегию среди пяти исследуемых вариантов.</p>
        </div>
      `;
    }

    if (state.tab === "manifestations") {
      html = `
        <h2>Как это проявляется</h2>
        <div class="details-list">
          ${strategy.manifestations.map((item, index) => `
            <div class="detail-item">
              <b>0${index + 1}</b>
              <span>${item}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (state.tab === "relationships") {
      html = `
        <h2>В отношениях</h2>
        <p>${relationships[key]}</p>
        <div class="note">
          <strong>Вторичная стратегия</strong>
          <p>${strategies[state.result.secondary].title}. Она может включаться в отдельных ситуациях и дополнять основную.</p>
        </div>
      `;
    }

    if (state.tab === "growth") {
      html = `
        <h2>Ваш рост</h2>
        <div class="details-list">
          ${strategy.growth.map((item, index) => `
            <div class="detail-item">
              <b>0${index + 1}</b>
              <span>${item}</span>
            </div>
          `).join("")}
        </div>
        <div class="note">
          <strong>Помните</strong>
          <p>Изменение стратегии начинается не с борьбы с собой, а с появления новых способов получать поддержку, безопасность и ценность.</p>
        </div>
      `;
    }

    elements.detailsContent.innerHTML = html;
  };

  document.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-action]");
    const action = actionElement?.dataset.action;

    if (action === "to-intro") {
      show("screen-intro");
      return;
    }

    if (action === "start-test") {
      clearAnalysisTimers();
      state.index = 0;
      state.responses = Array(questions.length).fill(null);
      state.result = null;
      state.locked = false;
      renderQuestion();
      show("screen-test");
      return;
    }

    if (action === "prev") {
      if (state.locked) return;

      if (state.index === 0) {
        show("screen-intro");
      } else {
        state.index -= 1;
        renderQuestion();
      }
      return;
    }

    if (action === "open-details") {
      state.tab = "about";
      document.querySelectorAll(".tab").forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === "about");
      });
      renderDetails();
      show("screen-details");
      return;
    }

    if (action === "to-cta") {
      show("screen-cta");
      return;
    }

    const tabElement = event.target.closest("[data-tab]");
    const tab = tabElement?.dataset.tab;

    if (tab) {
      state.tab = tab;
      document.querySelectorAll(".tab").forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === tab);
      });
      renderDetails();
    }
  });
})();
