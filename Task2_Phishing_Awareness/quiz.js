// Phishing awareness quiz.
// Runs entirely in the browser. Nothing is stored or sent anywhere.

const questions = [
  {
    question: "An email from support@examplebank-alerts.net says your account will be suspended in 24 hours unless you click a link. What is the best action?",
    options: [
      "Click the link and verify your details quickly",
      "Reply with your account number to prove who you are",
      "Open your bank's official app or type its website address yourself",
      "Forward the email to your friends as a warning"
    ],
    answer: 2,
    explanation: "Never use the link in the message. Go to the real site or app yourself. The urgency and the odd sender domain are classic warning signs."
  },
  {
    question: "In the address examplebank.com.secure-verify.net, what is the real domain?",
    options: [
      "examplebank.com",
      "secure-verify.net",
      "com.secure-verify",
      "examplebank"
    ],
    answer: 1,
    explanation: "Read the address from right to left. The real domain is the last part before the first slash: secure-verify.net."
  },
  {
    question: "A website shows a padlock icon (HTTPS). What does this prove?",
    options: [
      "The website is safe and honest",
      "The connection is encrypted, but the site could still be fake",
      "The website belongs to your bank",
      "The website has no viruses"
    ],
    answer: 1,
    explanation: "The padlock only means the connection is encrypted. Attackers can get it for fake sites too, so always check the domain."
  },
  {
    question: "Someone calls saying they are from your company's IT help desk and asks you to log in at a link they text you. What should you do?",
    options: [
      "Log in quickly so they can fix the problem",
      "Give them your password so they can do it for you",
      "Hang up and call the IT help desk on its official number",
      "Ask them to send the link by email instead"
    ],
    answer: 2,
    explanation: "Verify through a number you already know. This voice-phishing trick was used in the 2020 Twitter attack."
  },
  {
    question: "A message says: 'This is the CEO. Buy gift cards now and keep it confidential.' Which social engineering technique is mainly being used?",
    options: [
      "Curiosity",
      "Authority",
      "Greed",
      "Baiting"
    ],
    answer: 1,
    explanation: "The attacker pretends to be a powerful person. Urgency and secrecy are added to stop you from checking."
  },
  {
    question: "Your password is stolen in a phishing attack. Which protection still helps stop the attacker from logging in?",
    options: [
      "A longer email address",
      "Clearing your browser history",
      "Multi-factor authentication (MFA)",
      "Using a private browsing window"
    ],
    answer: 2,
    explanation: "With MFA, a stolen password alone is not enough, because the attacker also needs your second factor."
  },
  {
    question: "You clicked a suspicious link and typed your password. What should you do first?",
    options: [
      "Nothing, because it was probably fine",
      "Change that password right away and turn on MFA",
      "Wait a week to see if anything happens",
      "Delete your email account"
    ],
    answer: 1,
    explanation: "Act fast. Change the password (and any other account that uses it), enable MFA, check for unusual activity and report it."
  },
  {
    question: "Which of these is an example of smishing?",
    options: [
      "A phone call from a fake bank officer",
      "An email with a fake invoice attached",
      "An SMS saying your parcel is held and asking you to tap a link",
      "A USB drive left in a car park"
    ],
    answer: 2,
    explanation: "Smishing is phishing by SMS text message. The phone call is vishing, and the USB drive is baiting."
  }
];

let current = 0;
let score = 0;
let answered = false;

const container = document.getElementById("quiz-container");

// Helper: create an element with text.
// textContent is used (never innerHTML), so text is always shown as plain text.
function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text) {
    element.textContent = text;
  }
  if (className) {
    element.className = className;
  }
  return element;
}

function showQuestion() {
  answered = false;
  container.textContent = "";

  const q = questions[current];

  container.appendChild(
    makeElement("p", "Question " + (current + 1) + " of " + questions.length, "quiz-progress")
  );
  container.appendChild(makeElement("h3", q.question));

  const optionsBox = makeElement("div", "", "options");
  const feedback = makeElement("div", "", "feedback");
  const nextButton = makeElement("button", "", "next-btn");
  nextButton.hidden = true;
  nextButton.addEventListener("click", goNext);

  q.options.forEach(function (optionText, index) {
    const button = makeElement("button", optionText, "option-btn");
    button.addEventListener("click", function () {
      selectAnswer(index, optionsBox, feedback, nextButton);
    });
    optionsBox.appendChild(button);
  });

  container.appendChild(optionsBox);
  container.appendChild(feedback);
  container.appendChild(nextButton);
}

function selectAnswer(chosenIndex, optionsBox, feedback, nextButton) {
  if (answered) {
    return;
  }
  answered = true;

  const q = questions[current];
  const buttons = optionsBox.querySelectorAll("button");

  buttons.forEach(function (button, index) {
    button.disabled = true;
    if (index === q.answer) {
      button.classList.add("correct");
    } else if (index === chosenIndex) {
      button.classList.add("wrong");
    }
  });

  if (chosenIndex === q.answer) {
    score++;
    feedback.textContent = "Correct! " + q.explanation;
    feedback.className = "feedback good";
  } else {
    feedback.textContent = "Not quite. " + q.explanation;
    feedback.className = "feedback bad";
  }

  nextButton.textContent = current === questions.length - 1 ? "See my result" : "Next question";
  nextButton.hidden = false;
}

function goNext() {
  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  container.textContent = "";

  const percent = Math.round((score / questions.length) * 100);
  let message;
  if (score === questions.length) {
    message = "Excellent! You spotted every trick.";
  } else if (score >= questions.length * 0.6) {
    message = "Good job! Review the sections you missed and try again.";
  } else {
    message = "Keep learning. Re-read the sections above and try again.";
  }

  container.appendChild(makeElement("h3", "Your score: " + score + " / " + questions.length + " (" + percent + "%)"));
  container.appendChild(makeElement("p", message));

  const restart = makeElement("button", "Try again", "next-btn");
  restart.addEventListener("click", function () {
    current = 0;
    score = 0;
    showQuestion();
  });
  container.appendChild(restart);
}

showQuestion();