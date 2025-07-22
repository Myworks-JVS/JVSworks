// Timer Display Logic
const timerElement = document.getElementById("timer");
let timerInterval = null;

function startTimer() {
  // Fetch start time from localStorage or initialize if not found
  let startTime = localStorage.getItem("quizStartTime");

  if (!startTime) {
    startTime = Date.now();
    localStorage.setItem("quizStartTime", startTime);
    localStorage.setItem("isTimerRunning", true);
  }

  // Clear any existing intervals to avoid multiple timers
  if (timerInterval) clearInterval(timerInterval);

  // Start the timer interval
  timerInterval = setInterval(() => {
    const elapsedTime = Date.now() - parseInt(startTime);

    const hours = String(Math.floor((elapsedTime / 3600000) % 24)).padStart(2, '0');
    const minutes = String(Math.floor((elapsedTime / 60000) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((elapsedTime / 1000) % 60)).padStart(2, '0');

    timerElement.style.display = 'block';
    timerElement.innerHTML = `${hours}:${minutes}:${seconds}`;
  }, 1000);
}

// Auto-start the timer if it's already running and not submitted
if (localStorage.getItem("isTimerRunning") === "true" && !localStorage.getItem("quizSubmitted")) {
  startTimer();
}

// Stop the timer and clear localStorage
function stopTimer() {
  console.log("Stopping timer and clearing localStorage...");
  clearInterval(timerInterval);
  localStorage.removeItem("isTimerRunning");
  localStorage.removeItem("quizStartTime");
  localStorage.setItem("quizSubmitted", "true");
}

// ✅ Added Event Listener to handle page close or refresh
window.addEventListener("beforeunload", (event) => {
  console.log("Page is closing or refreshing. Timer will stop.");
  stopTimer();
});

