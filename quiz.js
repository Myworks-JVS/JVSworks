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
    const reader = new FileReader();
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
    let invalidRows = 0;

    excelData.forEach((row, index) => {
        if (index === 0) return; // Skip header row

        // ✅ Validate: must be an array with at least 7 elements
        if (!Array.isArray(row) || row.length < 7) {
            invalidRows++;
            return;
        }

        const correctIndexInOriginal = parseInt(row[6]);
        if (isNaN(correctIndexInOriginal) || correctIndexInOriginal < 0 || correctIndexInOriginal > 3) {
            invalidRows++;
            return;
        }

        const options = [row[2], row[3], row[4], row[5]];
        shuffleArray(options);

        const correctOption = row[2 + correctIndexInOriginal];
        const shuffledCorrectIndex = options.indexOf(correctOption);

        const question = {
            topic: row[0],
            question: row[1],
            options: options,
            correct: shuffledCorrectIndex,
            image: row[7] || null
        };

        questions.push(question);
    });

    // ✅ Alert if no valid questions loaded
    if (invalidRows > 0) {
        alert(`${invalidRows} invalid rows were skipped while loading questions.`);
    }
}



function loadQuestion(index) {
    const questionTitle = document.getElementById('question-title');
    const questionOptions = document.getElementById('question-options');
 

    const currentQuestion = questions[index];
    questionTitle.innerHTML = `${currentQuestion.topic}: ${currentQuestion.question}`;
    questionOptions.innerHTML = '';

    currentQuestion.options.forEach((option, optIndex) => {
        const optionLabel = document.createElement('label');
        optionLabel.innerHTML = `
            <input type="radio" name="question" value="${optIndex}">
            ${option}
        `;
        questionOptions.appendChild(optionLabel);
        questionOptions.appendChild(document.createElement('br'));
    });

    document.getElementById('submitButton').style.display = (index === questions.length - 1) ? 'block' : 'none';
    document.getElementById('nextButton').style.display = (index === questions.length - 1) ? 'none' : 'block';
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


