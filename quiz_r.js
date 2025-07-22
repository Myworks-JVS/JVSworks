
// Securely open a URL in a new tab
function openContent(url) {
    const newTab = window.open(url, '_blank', 'noopener,noreferrer');
    if (newTab) newTab.opener = null;
}

let questions = [];
let currentQuestionIndex = 0;
let userResponses = [];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadExcelFile(event) {
    const file = event.target.files[0];

    if (!file || !file.name.endsWith('.xlsx')) {
        alert('Please upload a valid Excel (.xlsx) file.');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Max allowed size is 5MB.');
        return;
    }

    const reader = new FileReader();
    reader.onerror = () => alert('Error reading the file');
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        document.getElementById('fileUpload').style.display = 'none';
        document.querySelector('.file-upload-label').style.display = 'none';
        parseExcelData(excelData);
        loadQuestion(currentQuestionIndex);
        document.getElementById('mcq-question-container').style.display = 'block';
        document.getElementById('nextButton').style.display = 'block';
    };
    reader.readAsArrayBuffer(file);
}

document.getElementById('fileUpload').addEventListener('change', loadExcelFile);

function parseExcelData(excelData) {
    questions = [];
    let skippedRows = 0;

    excelData.forEach((row, index) => {
        if (index === 0) return; // Skip header

        if (!Array.isArray(row) || row.length < 7) {
            skippedRows++;
            return;
        }

        const correctIndexInOriginal = parseInt(row[6]);
        if (isNaN(correctIndexInOriginal) || correctIndexInOriginal < 0 || correctIndexInOriginal > 3) {
            skippedRows++;
            return;
        }

        const originalOptions = [row[2], row[3], row[4], row[5]];
        const correctOption = originalOptions[correctIndexInOriginal];
        const shuffledOptions = [...originalOptions];
        shuffleArray(shuffledOptions);

        questions.push({
            question: row[1],
            options: shuffledOptions,
            correctAnswer: correctOption,
            image: row[0] || ""
        });
    });

    if (skippedRows > 0) {
        alert(`${skippedRows} rows were skipped due to invalid data.`);
    }
}

function loadQuestion(index) {
    const q = questions[index];
    const container = document.getElementById("mcq-question-container");

    let html = q.image ? `<img src="${q.image}" alt="Question Image" class="question-image">` : "";
    html += `<p class="question">${q.question}</p>`;

    q.options.forEach((option, i) => {
        html += `
            <label class="option">
                <input type="radio" name="answer" value="${option}">
                ${option}
            </label>
        `;
    });

    container.innerHTML = html;

    if (userResponses[index]) {
        const radios = container.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            if (radio.value === userResponses[index]) {
                radio.checked = true;
            }
        });
    }
}

function nextQuestion() {
    const selectedOption = document.querySelector('input[name="question"]:checked');
    if (!selectedOption) {
        alert("Please select an answer before moving to the next question!");
        return;
    }
    userResponses[currentQuestionIndex] = parseInt(selectedOption.value);
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        loadQuestion(currentQuestionIndex);
    }
    startTimer();
}


function submitQuiz() {
    const selectedOption = document.querySelector('input[name="question"]:checked');
    if (!selectedOption) {
        alert("Please select an answer before submitting!");
        return;
    }
    
    userResponses[currentQuestionIndex] = parseInt(selectedOption.value);
    displayResults();
    stopTimer();
}


function displayResults() {
const resultsContainer = document.getElementById('results-container');
const resultsDiv = document.getElementById('results');
resultsDiv.innerHTML = ''; // Clear previous results

let correctAnswers = 0;

questions.forEach((q, index) => {
const userAnswer = userResponses[index];
if (userAnswer === q.correct) correctAnswers++;
});

const totalQuestions = questions.length;
const wrongAnswers = totalQuestions - correctAnswers;
const score = (correctAnswers / totalQuestions) * 100;


document.getElementById('mcq-question-container').style.display = 'none';

// Display result summary
resultsDiv.innerHTML += `<p style="color: green;">Correct Answers: ${correctAnswers}</p>`;
resultsDiv.innerHTML += `<p style="color: red;">Wrong Answers: ${wrongAnswers}</p>`;
resultsDiv.innerHTML += `<h3>Your Score: ${score.toFixed(2)}%</h3>`;

// ✅ Display congratulations message if 100%
if (score === 100) {
resultsDiv.innerHTML += `<p style="color: darkblue; font-weight: bold;">🎉 Congratulations! You scored 100%!</p>`;
}

resultsContainer.style.display = 'block'; // Show results
document.getElementById('submitButton').style.display = 'none'; // Hide submit button
}


function saveResults() {
const totalQuestions = questions.length;
const correctAnswers = userResponses.filter((response, index) => response === questions[index].correct).length;
const wrongAnswers = totalQuestions - correctAnswers;
const percentage = (correctAnswers / totalQuestions) * 100;


const date = new Date();
const dateTimeStamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;


let fileContent = `Quiz Results\n\n`;
fileContent += `userid: ${username}\n\n`;
fileContent += `Date & Time: ${dateTimeStamp}\n\n`;
fileContent += `Total Questions: ${totalQuestions}\n`;
fileContent += `Questions Attempted: ${totalQuestions}\n`;
fileContent += `Correct Answers: ${correctAnswers}\n`;
fileContent += `Wrong Answers: ${wrongAnswers}\n`;
fileContent += `Score: ${percentage.toFixed(2)}%\n\n`;


questions.forEach((q, index) => {
const userAnswer = userResponses[index];
fileContent += `Question: ${q.question}\n`;
fileContent += `Your Answer: ${q.options[userAnswer] || 'No answer'}\n`;
fileContent += `Correct Answer: ${q.options[q.correct]}\n\n`;
});


const blob = new Blob([fileContent], { type: 'text/plain' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = `quiz_results_${date.getTime()}.txt`;
link.click();
}


