(() => {
  const questions = window.TEST_QUESTIONS;
  const { strategies, answers } = window.TEST_DATA;

  const state = {
    index: 0,
    responses: Array(questions.length).fill(null),
    result: null,
    tab: "about",
    locked: false,
    analysisTimers: []
  };

  const screens = [...document.querySelectorAll(".screen")];

  function show(id) {
    screens.forEach(screen => screen.classList.toggle("active", screen.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuestion() {
    state.locked = false;
    const question = questions[state.index];
    const progress = ((state.index + 1) / questions.length) * 100;

    document.getElementById("question-counter").textContent = `Вопрос ${state.index + 1} из ${questions.length}`;
    document.getElementById("progress-bar").style.width = `${progress}%`;
    document.getElementById("question-text").textContent = question.text;

    const answersContainer = document.getElementById("answers");
    answersContainer.innerHTML = "";

    answers.forEach(answer => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer";
      button.innerHTML = `<span class="radio" aria-hidden="true"></span><span>${answer.label}</span><span class="answer-check" aria-hidden="true">✓</span>`;
      button.addEventListener("click", () => chooseAnswer(button, answer.score));
      answersContainer.appendChild(button);
    });
  }

  function chooseAnswer(button, score) {
    if (state.locked) return;
    state.locked = true;
    state.responses[state.index] = score;

    document.querySelectorAll(".answer").forEach(item => {
      item.disabled = true;
      item.classList.toggle("selected", item === button);
    });

    window.setTimeout(() => {
      if (state.index < questions.length - 1) {
        state.index += 1;
        renderQuestion();
      } else {
        calculateResult();
        runAnalysis();
      }
    }, 550);
  }

  function calculateResult() {
    const scores = Object.fromEntries(Object.keys(strategies).map(key => [key, 0]));
    questions.forEach((question, index) => {
      scores[question.strategy] += state.responses[index] ?? 0;
    });

    const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    state.result = {
      primary: ranking[0][0],
      secondary: ranking[1][0],
      scores
    };
    localStorage.setItem("personalityTestResult", JSON.stringify(state.result));
  }

  function resetAnalysis() {
    state.analysisTimers.forEach(clearTimeout);
    state.analysisTimers = [];
    document.querySelectorAll(".analysis-step").forEach(step => {
      step.classList.remove("done", "active");
      step.querySelector(".step-icon").textContent = "○";
    });
    document.getElementById("analysis-progress").style.width = "0%";
  }

  function runAnalysis() {
    resetAnalysis();
    show("screen-analysis");

    const steps = [...document.querySelectorAll(".analysis-step")];
    const delays = [700, 1900, 3100, 4300];

    steps.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        step.classList.add("active", "done");
        step.querySelector(".step-icon").textContent = "✓";
        document.getElementById("analysis-progress").style.width = `${((index + 1) / steps.length) * 100}%`;
      }, delays[index]);
      state.analysisTimers.push(timer);
    });

    state.analysisTimers.push(window.setTimeout(() => {
      renderResult();
      show("screen-result");
    }, 5400));
  }

  function renderResult() {
    const strategy = strategies[state.result.primary];
    document.getElementById("result-title").textContent = strategy.title;
    document.getElementById("result-tagline").textContent = strategy.tagline;
    document.getElementById("result-driver").textContent = strategy.driver;
    document.getElementById("result-repeat").textContent = strategy.repeat;
    document.getElementById("result-strength").textContent = strategy.strength;
    document.getElementById("result-risk").textContent = strategy.risk;
  }

  function relationshipsText(key) {
    const texts = {
      rescuer: "В отношениях вы можете быстро занимать позицию того, кто понимает, выдерживает и помогает. Равенство нарушается незаметно: другой получает поддержку, а ваши потребности отходят на второй план.",
      controller: "Близость становится спокойнее, когда вы понимаете, что происходит и можете влиять на ход событий. Неопределенность и самостоятельность партнера могут переживаться как потеря устойчивости или значимости.",
      achiever: "В отношениях вы можете пытаться быть достаточно хорошим, полезным или успешным, чтобы сохранять ценность. Собственная уязвимость и несовершенство переживаются особенно болезненно.",
      avoidant: "Вы можете оставаться рядом физически, но не допускать другого человека к наиболее уязвимым переживаниям. Партнер видит вашу самостоятельность, но не всегда понимает, насколько вам трудно.",
      dependent: "Связь с другим человеком становится источником устойчивости и направления. Поэтому дистанция, несогласие или недоступность партнера могут лишать вас не только поддержки, но и способности действовать."
    };
    return texts[key];
  }

  function renderDetails() {
    const key = state.result.primary;
    const strategy = strategies[key];
    const container = document.getElementById("details-content");

    if (state.tab === "about") {
      container.innerHTML = `<h2>О типе</h2><p>${strategy.about}</p><div class="note"><strong>Важно помнить</strong><p>Это не диагноз и не окончательное определение личности. Результат показывает наиболее выраженную стратегию среди пяти исследуемых вариантов.</p></div>`;
      return;
    }

    if (state.tab === "manifestations") {
      container.innerHTML = `<h2>Как это проявляется</h2><div class="details-list">${strategy.manifestations.map((text, index) => `<div class="detail-item"><b>0${index + 1}</b><span>${text}</span></div>`).join("")}</div>`;
      return;
    }

    if (state.tab === "relationships") {
      container.innerHTML = `<h2>В отношениях</h2><p>${relationshipsText(key)}</p><div class="note"><strong>Вторичная стратегия</strong><p>${strategies[state.result.secondary].title}. Она может включаться в отдельных ситуациях и дополнять основную.</p></div>`;
      return;
    }

    container.innerHTML = `<h2>Ваш рост</h2><div class="details-list">${strategy.growth.map((text, index) => `<div class="detail-item"><b>0${index + 1}</b><span>${text}</span></div>`).join("")}</div><div class="note"><strong>Помните</strong><p>Изменение стратегии начинается не с борьбы с собой, а с появления новых способов получать поддержку, безопасность и ценность.</p></div>`;
  }

  document.addEventListener("click", event => {
    const action = event.target.closest("[data-action]")?.dataset.action;

    if (action === "to-intro") show("screen-intro");
    if (action === "start-test") {
      state.index = 0;
      state.responses.fill(null);
      renderQuestion();
      show("screen-test");
    }
    if (action === "prev") {
      if (state.locked) return;
      if (state.index === 0) show("screen-intro");
      else {
        state.index -= 1;
        renderQuestion();
      }
    }
    if (action === "open-details") {
      state.tab = "about";
      document.querySelectorAll(".tab").forEach(button => button.classList.toggle("active", button.dataset.tab === "about"));
      renderDetails();
      show("screen-details");
    }
    if (action === "to-cta") show("screen-cta");

    const tab = event.target.closest("[data-tab]")?.dataset.tab;
    if (tab) {
      state.tab = tab;
      document.querySelectorAll(".tab").forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
      renderDetails();
    }
  });
})();
