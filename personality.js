const types = {
  spark: {
    mark: "S",
    name: "The Spark",
    group: "SPARK GROUP",
    summary: "You are willing to begin. Your courage and energy make invitations feel possible, and you help others move from thinking to doing.",
    page: "personality-spark.html",
  },
  bridge: {
    mark: "B",
    name: "The Bridge",
    group: "BRIDGE GROUP",
    summary: "You build trust before extending an invitation. People feel seen by you, and gospel conversations grow naturally from real friendship.",
    page: "personality-bridge.html",
  },
  beacon: {
    mark: "L",
    name: "The Beacon",
    group: "BEACON GROUP",
    summary: "You share through steady goodness and dependable support. Your example creates safety and makes other people's invitations stronger.",
    page: "personality-beacon.html",
  },
  seed: {
    mark: "Q",
    name: "The Seed",
    group: "SEED GROUP",
    summary: "You prefer quiet, low-pressure steps. Your sincerity and thoughtfulness can open doors that a bold approach might miss.",
    page: "personality-seed.html",
  },
};

const questions = [
  {
    text: "A church activity is coming up. What feels most natural?",
    answers: [
      ["spark", "Invite someone today before I overthink it."],
      ["bridge", "Think of a friend who would genuinely enjoy it."],
      ["beacon", "Offer to help make the activity welcoming."],
      ["seed", "Share the event online or send one careful text."],
    ],
  },
  {
    text: "A friend asks what you did this weekend. You usually...",
    answers: [
      ["bridge", "Connect my answer to something they care about."],
      ["seed", "Give a short, honest answer and see if they ask more."],
      ["spark", "Tell them about church and ask if they want to come."],
      ["beacon", "Mention church naturally without pushing the moment."],
    ],
  },
  {
    text: "Which missionary moment sounds least stressful?",
    answers: [
      ["beacon", "Helping someone feel comfortable when they arrive."],
      ["spark", "Starting a conversation with someone new."],
      ["seed", "Writing a kind message to one person I know well."],
      ["bridge", "Having a meaningful conversation over lunch."],
    ],
  },
  {
    text: "When someone says, “No thanks,” you are most likely to...",
    answers: [
      ["seed", "Feel relieved I tried, then give them plenty of space."],
      ["beacon", "Keep being kind and dependable with no awkwardness."],
      ["bridge", "Protect the friendship and stay curious about them."],
      ["spark", "Respect the answer and look for another opportunity."],
    ],
  },
  {
    text: "In a group project, which role do you naturally take?",
    answers: [
      ["spark", "Get everyone moving."],
      ["beacon", "Notice what needs doing and quietly handle it."],
      ["bridge", "Make sure everyone feels included."],
      ["seed", "Prepare carefully and contribute behind the scenes."],
    ],
  },
  {
    text: "What would help you share the gospel this week?",
    answers: [
      ["bridge", "A natural reason to reconnect with a friend."],
      ["spark", "A clear challenge and a deadline."],
      ["seed", "A tiny step with words already prepared."],
      ["beacon", "A specific way to serve or support an invitation."],
    ],
  },
  {
    text: "Someone new walks into church alone. Your first instinct is to...",
    answers: [
      ["seed", "Smile, make room, and let a more outgoing person lead."],
      ["bridge", "Learn their name and find a genuine connection."],
      ["beacon", "Help them know where to go and what to expect."],
      ["spark", "Walk right over and welcome them."],
    ],
  },
  {
    text: "Choose the sentence that sounds most like you.",
    answers: [
      ["beacon", "I show what I believe by how I live and serve."],
      ["seed", "I can be brave when the step is small and sincere."],
      ["spark", "If I believe something is good, I want to share it."],
      ["bridge", "People listen when they know you truly care."],
    ],
  },
];

const intro = document.querySelector("#intro");
const quiz = document.querySelector("#quiz");
const result = document.querySelector("#result");
const question = document.querySelector("#question");
const answers = document.querySelector("#answers");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");
const selections = new Array(questions.length).fill(null);
let currentQuestion = 0;

document.querySelector("#start-button").addEventListener("click", startQuiz);
document.querySelector("#retake-button").addEventListener("click", startQuiz);
backButton.addEventListener("click", goBack);
nextButton.addEventListener("click", goNext);

function startQuiz() {
  selections.fill(null);
  currentQuestion = 0;
  intro.hidden = true;
  result.hidden = true;
  quiz.hidden = false;
  renderQuestion();
}

function renderQuestion() {
  const item = questions[currentQuestion];
  const percent = Math.round(((currentQuestion + 1) / questions.length) * 100);
  question.textContent = item.text;
  document.querySelector("#progress-text").textContent =
    `Question ${currentQuestion + 1} of ${questions.length}`;
  document.querySelector("#progress-percent").textContent = `${percent}%`;
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  answers.replaceChildren();

  item.answers.forEach(([type, label]) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.type = "button";
    button.textContent = label;
    button.dataset.type = type;
    button.setAttribute("aria-pressed", String(selections[currentQuestion] === type));
    button.addEventListener("click", () => selectAnswer(type));
    answers.append(button);
  });

  backButton.disabled = currentQuestion === 0;
  nextButton.disabled = selections[currentQuestion] === null;
  nextButton.textContent = currentQuestion === questions.length - 1 ? "See my result" : "Next";
  question.focus();
}

function selectAnswer(type) {
  selections[currentQuestion] = type;
  answers.querySelectorAll(".answer").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.type === type));
  });
  nextButton.disabled = false;
}

function goBack() {
  if (currentQuestion > 0) {
    currentQuestion -= 1;
    renderQuestion();
  }
}

function goNext() {
  if (!selections[currentQuestion]) return;
  if (currentQuestion < questions.length - 1) {
    currentQuestion += 1;
    renderQuestion();
    return;
  }
  showResult();
}

function showResult() {
  const scores = Object.fromEntries(Object.keys(types).map((type) => [type, 0]));
  selections.forEach((type, index) => {
    scores[type] += index >= questions.length - 2 ? 2 : 1;
  });

  const highest = Math.max(...Object.values(scores));
  const tied = Object.keys(scores).filter((type) => scores[type] === highest);
  const type = [...selections].reverse().find((selection) => tied.includes(selection));
  const profile = types[type];

  document.querySelector("#result-mark").textContent = profile.mark;
  document.querySelector("#result-title").textContent = profile.name;
  document.querySelector("#result-summary").textContent = profile.summary;
  document.querySelector("#group-name").textContent = profile.group;
  document.querySelector("#tips-link").href = profile.page;

  quiz.hidden = true;
  result.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("#result-title").focus();
}
