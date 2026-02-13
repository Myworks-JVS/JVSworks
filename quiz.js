// ==============================
// GLOBAL VARIABLES
// ==============================
let questions = [];
let currentQuestionIndex = 0;
let userResponses = [];

// ==============================
// OPEN EXTERNAL LINK SAFELY
// ==============================
function openContent(url) {
    const newTab = window.open(url, "_blank", "noopener,noreferrer");
    if (newTab) newTab.opener = null;
}

// ==============================
// SHUFFLE FUNCTION
// ==============================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ==============================
// LOAD EXCEL FILE
// ==============================
function loadExcelFile(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
        alert("Please upload a valid .xlsx file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);

            if (typeof XLSX === "undefined") {
                alert("XLSX library not loaded!");
                return;
            }

            const workbook = XLSX.read(data, { type: "array" });

            if (!workbook.SheetNames.length) {
                alert("No sheets found in Excel file.");
                return;
            }

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const excelData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: ""
            });

            if (!excelData.length) {
                alert("Excel file is empty.");
                return;
            }

            parseExcelData(excelData);

            if (!questions.length) {
                alert("No valid questions found.");
                return;
            }

            document.getElementById("fileUpload").style.display = "none";
            document.querySelector(".file-upload-label").style.display = "none";

            loadQuestion(0);

            document.getElementById("mcq-question-container").style.display = "block";
            document.getElementById("nextButton").style.display = "block";

        } catch (error) {
            console.error(error);
            alert("Error reading Excel file.");
        }
    };

    reader.readAsArrayBuffer(file);
}

document.getElementById("fileUpload")
    .addEventListener("change", loadExcelFile);

// ==============================
// PARSE EXCEL DATA
// Expected Columns:
// 0: Topic
// 1: Question
// 2-5: Options
// 6: Correct Option (1-4)
// 7: Image (optional)
// ==============================
function parseExcelData(excelData) {
    questions = [];
    currentQuestionIndex = 0;
    userResponses = [];

    let invalidRows = 0;

    excelData.forEach((row, index) => {

        if (index === 0) return; // Skip header

        if (!Array.isArray(row) || row.length < 7) {
            invalidRows++;
            return;
        }

        const topic = String(row[0]).trim();
        const questionText = String(row[1]).trim();

        const options = [
            String(row[2]).trim(),
            String(row[3]).trim(),
            String(row[4]).trim(),
            String(row[5]).trim()
        ];

        const correctFromExcel = parseInt(row[6]);

        // Validate correct option (must be 1-4)
        if (
            !topic ||
            !questionText ||
            options.some(opt => !opt) ||
            isNaN(correctFromExcel) ||
            correctFromExcel < 1 ||
            correctFromExcel > 4
        ) {
            invalidRows++;
            return;
        }

        const correctIndexOriginal = correctFromExcel - 1;
        const correctAnswerText = options[correctIndexOriginal];

        shuffleArray(options);

        const shuffledCorrectIndex = options.indexOf(correctAnswerText);

        questions.push({
            topic: topic,
            question: questionText,
            options: options,
            correct: shuffledCorrectIndex,
            image: row[7] ? String(row[7]).trim() : null
        });
    });

    if (invalidRows > 0) {
        alert(`${invalidRows} invalid rows were skipped.`);
    }
}

// ==============================
// LOAD QUESTION
// ==============================
function loadQuestion(index) {
    const questionTitle = document.getElementById("question-title");
    const questionOptions = document.getElementById("question-options");

    const q = questions[index];

    questionTitle.innerHTML = `${q.topic}: ${q.question}`;
    questionOptions.innerHTML = "";

    q.options.forEach((option, i) => {
        const label = document.createElement("label");
        label.innerHTML = `
            <input type="radio" name="question" value="${i}">
            ${i + 1}. ${option}
        `;
        questionOptions.appendChild(label);
        questionOptions.appendChild(document.createElement("br"));
    });

    document.getElementById("submitButton").style.display =
        (index === questions.length - 1) ? "block" : "none";

    document.getElementById("nextButton").style.display =
        (index === questions.length - 1) ? "none" : "block";
}

// ==============================
// NEXT QUESTION
// ==============================
function nextQuestion() {
    const selected = document.querySelector('input[name="question"]:checked');

    if (!selected) {
        alert("Please select an answer first.");
        return;
    }

    userResponses[currentQuestionIndex] = parseInt(selected.value);
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        loadQuestion(currentQuestionIndex);
    }
}

// ==============================
// SUBMIT QUIZ
// ==============================
function submitQuiz() {
    const selected = document.querySelector('input[name="question"]:checked');

    if (!selected) {
        alert("Please select an answer before submitting.");
        return;
    }

    userResponses[currentQuestionIndex] = parseInt(selected.value);

    displayResults();
}

// ==============================
// DISPLAY RESULTS
// ==============================
function displayResults() {

    const resultsContainer = document.getElementById("results-container");
    const resultsDiv = document.getElementById("results");

    let correct = 0;

    questions.forEach((q, i) => {
        if (userResponses[i] === q.correct) correct++;
    });

    const total = questions.length;
    const wrong = total - correct;
    const score = ((correct / total) * 100).toFixed(2);

    document.getElementById("mcq-question-container").style.display = "none";

    resultsDiv.innerHTML = `
        <p style="color:green;">Correct Answers: ${correct}</p>
        <p style="color:red;">Wrong Answers: ${wrong}</p>
        <h3>Score: ${score}%</h3>
    `;

    if (score == 100) {
        resultsDiv.innerHTML += `
            <p style="color:darkblue;font-weight:bold;">
                🎉 Congratulations! Perfect Score!
            </p>
        `;
    }

    resultsContainer.style.display = "block";
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

