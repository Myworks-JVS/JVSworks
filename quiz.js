// ==============================
// GLOBAL STATE
// ==============================
let questions = [];
let currentQuestionIndex = 0;
let userResponses = [];

// ==============================
// SAFE TIMER CALL
// ==============================
function safeStopTimer() {
    if (typeof stopTimer === "function") stopTimer();
}

// ==============================
// START QUIZ (called from HTML)
// ==============================
function startQuiz(username) {
    localStorage.setItem("quizUsername", username);

    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");

    document.getElementById("user-info").innerText =
        "Logged in as: " + username;
}

// ==============================
// SHUFFLE
// ==============================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ==============================
// LOAD EXCEL FILE (FIXED)
// ==============================
function loadExcelFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);

            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const rows = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
                blankrows: false
            });

            parseExcelData(rows);

            if (!questions.length) {
                alert("No valid questions found in file.");
                return;
            }

            document.querySelector(".file-section").style.display = "none";
            document.getElementById("mcq-question-container").style.display = "block";
            document.getElementById("nextButton").style.display = "block";

            loadQuestion(0);

        } catch (err) {
            console.error(err);
            alert("Excel parsing failed. Check template format.");
        }
    };

    reader.readAsArrayBuffer(file);
}

// ==============================
// PARSE EXCEL (ROBUST)
// Accepts extra columns like image URL
// ==============================
function parseExcelData(rows) {

    questions = [];
    currentQuestionIndex = 0;
    userResponses = [];

    if (!rows || rows.length === 0) return;

    let startRow = 0;

    if (String(rows[0][0]).toLowerCase().includes("question"))
        startRow = 1;

    for (let i = startRow; i < rows.length; i++) {

        const r = rows[i];

        const question = String(r[0] || "").trim();
        const options = [
            String(r[1] || "").trim(),
            String(r[2] || "").trim(),
            String(r[3] || "").trim(),
            String(r[4] || "").trim()
        ];

        const correctIndex = parseInt(r[5], 10) - 1;

        if (!question) continue;
        if (options.some(o => !o)) continue;
        if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) continue;

        const correctText = options[correctIndex];

        shuffleArray(options);

        questions.push({
            question: question,
            options: options,
            correct: options.indexOf(correctText)
        });
    }
}

// ==============================
// LOAD QUESTION
// ==============================
function loadQuestion(index) {
    startTimer()
    const q = questions[index];

    document.getElementById("question-title").textContent =
        `Q${index + 1}. ${q.question}`;

    const container = document.getElementById("question-options");
    container.innerHTML = "";

    q.options.forEach((option, i) => {
        const row = document.createElement("label");
        row.className = "option-row";

        row.innerHTML = `
            <input type="radio" name="question" value="${i}">
            <span class="option-text">${option}</span>
        `;

        container.appendChild(row);
    });

    if (userResponses[index] !== undefined) {
        const selected = document.querySelector(
            `input[value="${userResponses[index]}"]`
        );
        if (selected) selected.checked = true;
    }

    document.getElementById("submitButton").style.display =
        index === questions.length - 1 ? "block" : "none";

    document.getElementById("nextButton").style.display =
        index === questions.length - 1 ? "none" : "block";
}

// ==============================
// NEXT
// ==============================
function nextQuestion() {
    const selected = document.querySelector('input[name="question"]:checked');
    if (!selected) {
        alert("Select an answer.");
        return;
    }

    userResponses[currentQuestionIndex] = Number(selected.value);
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
}

// ==============================
// SUBMIT
// ==============================
function submitQuiz() {
    const selected = document.querySelector('input[name="question"]:checked');
    if (!selected) {
        alert("Select an answer.");
        return;
    }

    userResponses[currentQuestionIndex] = Number(selected.value);
    displayResults();
}

// ==============================
// RESULTS
// ==============================
function displayResults() {
    safeStopTimer();

    const correct = questions.filter(
        (q, i) => userResponses[i] === q.correct
    ).length;

    const total = questions.length;
    const wrong = total - correct;
    const score = ((correct / total) * 100).toFixed(2);

    document.getElementById("mcq-question-container").style.display = "none";
    document.getElementById("submitButton").style.display = "none";

    document.getElementById("results").innerHTML = `
        <p style="color:green;">Correct: ${correct}</p>
        <p style="color:red;">Wrong: ${wrong}</p>
        <h3>Score: ${score}%</h3>
    `;

    document.getElementById("results-container").style.display = "block";
}

// ==============================
// SAVE RESULTS
// ==============================
function saveResults() {
    const total = questions.length;
    const correct = userResponses.filter(
        (ans, i) => ans === questions[i].correct
    ).length;

    const wrong = total - correct;
    const percentage = ((correct / total) * 100).toFixed(2);

    const date = new Date();
    const timestamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    let content = `
Quiz Results
-------------------------
Date: ${timestamp}
Total Questions: ${total}
Correct: ${correct}
Wrong: ${wrong}
Score: ${percentage}%

Detailed Results:
`;

    questions.forEach((q, i) => {
        content += `
Question: ${q.question}
Your Answer: ${q.options[userResponses[i]] || "Not Answered"}
Correct Answer: ${q.options[q.correct]}
`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `quiz_results_${Date.now()}.txt`;
    link.click();
}


