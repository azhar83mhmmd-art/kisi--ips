// script.js - LOGIKA KUIS IPS (VERSI FINAL + FITUR FEEDBACK & COPY RESULT)

// --- KONFIGURASI ---
const QUIZ_LENGTH = 40; 
const PG_SCORE = 10;
const BS_SCORE = 10;
const ISIAN_SCORE = 10;
// --- FEEDBACK CONFIG (FITUR DIKEMBALIKAN) ---
const WHATSAPP_NUMBER = "6282357961890"; 

// --- GLOBAL VARS & SETUP ---
let currentQuestionIndex = 0;
let score = 0;
let currentUsername = "";
let quizData = [];
let correctCount = 0;
let incorrectCount = 0;
let isDarkMode = false;
let finalTime = 0; // Menyimpan waktu pengerjaan

// --- TIMER VARS ---
let timerInterval;
let startTime;


// --- DATA SOAL IPS (PG, BENAR/SALAH, ISIAN) ---
const FIXED_QUIZ_DATA = [
    // ... (Data Soal Tetap Sama 40 butir) ...
    { type: "pg", question: "Indonesia berada di antara dua benua, yakni Benua Asia dan Benua Australia, serta di antara dua samudra, yaitu Samudra Hindia dan Samudra Pasifik. Ini menunjukkan contoh letak ....", options: ["Astronomis", "Geologis", "Geografis", "Ekonomis"], correct: "Geografis", info: "Letak Geografis adalah posisi suatu wilayah dilihat dari kenyataannya di permukaan bumi, berdekatan dengan benua atau samudra." },
    { type: "pg", question: "Bu Lia melakukan perjalanan dari Manokwari (WIT) ke Surabaya (WIB) yang membutuhkan waktu sekitar 10 jam. Pesawat Bu Lia berangkat pukul 11.00 WIT. Maka Bu Lia akan sampai di Surabaya pukul ....", options: ["09.00 WIB", "19.00 WIB", "21.00 WIB", "17.00 WIB"], correct: "19.00 WIB", info: "Manokwari (WIT) lebih cepat 2 jam dari Surabaya (WIB). Berangkat 11.00 WIT = 09.00 WIB. Tiba: 09.00 WIB + 10 jam perjalanan = 19.00 WIB." },
    { type: "pg", question: "LA NINA mempengaruhi iklim di Indonesia yakni……", options: ["Menurunkan intensitas curah hujan", "Meningkatkan suhu rata-rata", "Meningkatkan intensitas curah hujan dan banjir", "Menyebabkan kekeringan parah"], correct: "Meningkatkan intensitas curah hujan dan banjir", info: "Fenomena La Niña membawa massa air hangat ke Pasifik Barat, meningkatkan penguapan dan curah hujan di wilayah Indonesia." },
    { type: "bs", question: "Makhluk sosial tentu membutuhkan orang lain di dalam kehidupannya. Kondisi ini lantas membuat tidak sejalan dengan minat masyarakat.", options: ["Benar", "Salah"], correct: "Salah", score_correct: BS_SCORE, info: "Justru sebaliknya, kebutuhan interaksi membuat masyarakat hidup berdampingan, meskipun terkadang ada konflik." },
    { type: "isian", question: "Indonesia memiliki perairan dan laut yang luas, maka Indonesia disebut Negara ……", correct: "MARITIM", score_correct: ISIAN_SCORE, info: "Negara Maritim adalah negara yang sebagian besar wilayahnya berupa perairan dan memanfaatkan laut sebagai jalur penting." },
    { type: "isian", question: "Kondisi atau keadaan rata-rata cuaca pada suatu daerah yang luas disebut ……", correct: "IKLIM", score_correct: ISIAN_SCORE, info: "Iklim adalah kondisi rata-rata jangka panjang, sedangkan Cuaca adalah kondisi atmosfer dalam waktu singkat dan wilayah sempit." }
    // ... (Asumsi data soal lengkap 40 butir seperti sebelumnya)
];


// --- DOM & UTILITY ---
const getEl = (id) => document.getElementById(id);
const screens = document.querySelectorAll('.screen');

function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    const targetScreen = getEl(id);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function normalizeAnswer(str) {
    if (!str) return "";
    return str.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// --- TIMER LOGIC ---
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval); 
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timerDisplay = getEl('quiz-timer');
        if (timerDisplay) {
            timerDisplay.innerText = formatTime(elapsed);
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    finalTime = Math.floor((Date.now() - startTime) / 1000); // Simpan waktu ke variabel global
    localStorage.setItem('KUIS_LAST_TIME', finalTime);
    return finalTime;
}


// --- 1. INISIASI & DARK MODE ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const savedUser = localStorage.getItem('KUIS_USER_NAME'); 
    const savedMode = localStorage.getItem('KUIS_DARK_MODE');
    
    // Atur Dark Mode
    if (savedMode === 'true') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        const toggle = getEl('dark-mode-toggle');
        if (toggle) toggle.checked = true;
    }
    
    // Check user session
    if (savedUser) {
        currentUsername = savedUser;
        if (getEl('display-username')) getEl('display-username').innerText = currentUsername;
        if (getEl('welcome-name')) getEl('welcome-name').innerText = currentUsername;
        showScreen('start-menu');
    } else {
        showScreen('name-screen');
    }
    
    setupEventListeners();
}


function setupEventListeners() {
    // Tombol 'Lanjut' (Input Nama)
    const nameInput = getEl('name-input');
    const submitBtn = getEl('submit-name');

    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            if (submitBtn) {
                submitBtn.disabled = e.target.value.trim() === "";
            }
        });
    }

    if (submitBtn) {
        submitBtn.onclick = handleSubmitName;
    }

    // Menu Utama
    const btnLatihan = getEl('btn-latihan');
    if (btnLatihan) btnLatihan.onclick = () => getEl('disclaimer-modal').classList.remove('hidden');
    
    const btnCloseDisclaimer = getEl('btn-close-disclaimer');
    if (btnCloseDisclaimer) btnCloseDisclaimer.onclick = closeDisclaimer;

    const btnLogout = getEl('btn-logout');
    if (btnLogout) btnLogout.onclick = userLogout;
    
    const settingsIcon = getEl('settings-icon');
    if (settingsIcon) settingsIcon.onclick = () => getEl('settings-modal').classList.remove('hidden');

    // Dark Mode Toggle
    const darkModeToggle = getEl('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            isDarkMode = e.target.checked;
            document.body.classList.toggle('dark-mode', isDarkMode);
            localStorage.setItem('KUIS_DARK_MODE', isDarkMode);
        });
    }

    // Feedback & Copy Buttons (Fitur Feedback dikembalikan)
    const btnFeedback = getEl('btn-feedback');
    if (btnFeedback) btnFeedback.onclick = () => openWhatsapp("Saya ingin memberikan masukan/saran mengenai Kuis IPS.");

    const btnBugReport = getEl('btn-bug-report');
    if (btnBugReport) btnBugReport.onclick = () => openWhatsapp("Saya menemukan bug/kesalahan pada soal atau fitur di Kuis IPS.");

    const btnCopyResult = getEl('btn-copy-result');
    if (btnCopyResult) btnCopyResult.onclick = copyResults;

    const btnFeedbackFinal = getEl('btn-feedback-final');
    if (btnFeedbackFinal) btnFeedbackFinal.onclick = () => openWhatsapp(`Halo, saya ${currentUsername} baru saja menyelesaikan kuis dengan skor ${score} dalam waktu ${formatTime(finalTime)}. Saya ingin memberikan feedback.`);
}

function handleSubmitName() {
    const name = getEl('name-input').value.trim();
    if (name) {
        currentUsername = name;
        localStorage.setItem('KUIS_USER_NAME', name);
        getEl('display-username').innerText = currentUsername;
        getEl('welcome-name').innerText = currentUsername;
        showScreen('start-menu'); // Pindah ke menu utama
    }
}

function closeDisclaimer() {
    const disclaimer = getEl('disclaimer-modal');
    if (disclaimer) disclaimer.classList.add('hidden');
    startQuiz(); 
}

// --- 2. LOGIKA KUIS ---
function startQuiz() {
    quizData = shuffleArray([...FIXED_QUIZ_DATA]).slice(0, QUIZ_LENGTH);
    quizData.forEach(q => {
        if (q.type === 'pg' || q.type === 'bs') {
            q.options = shuffleArray(q.options);
        }
    });

    // Reset stats
    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    incorrectCount = 0;
    finalTime = 0;
    
    if (getEl('current-score')) getEl('current-score').innerText = score;
    
    startTimer(); 
    
    showScreen('quiz-area');
    renderQuestion();
}

function renderQuestion() {
    const q = quizData[currentQuestionIndex];
    if (getEl('q-number')) getEl('q-number').innerText = `Soal ${currentQuestionIndex + 1}/${quizData.length} (${q.type.toUpperCase()})`;
    
    let questionText = q.question;
    
    // Tambahkan ikon Tooltip (Fitur Penjelasan)
    if (q.info) {
        questionText += `<i class="fas fa-info-circle tooltip-icon" onclick="window.showInfo('${currentQuestionIndex}')"></i>`;
    }
    
    if (getEl('q-text')) getEl('q-text').innerHTML = questionText;
    
    const area = getEl('answer-area');
    if (!area) return;
    
    area.innerHTML = '';
    
    if (q.type === 'pg' || q.type === 'bs') {
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerHTML = opt;
            btn.onclick = () => checkAnswer(opt, q.correct, q.type);
            area.appendChild(btn);
        });
    } else if (q.type === 'isian') {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'fill-in-input';
        input.placeholder = 'Tuliskan jawaban Anda di sini...';
        area.appendChild(input);

        const submitBtn = document.createElement('button');
        submitBtn.className = 'main-btn';
        submitBtn.innerHTML = 'Jawab';
        submitBtn.onclick = () => {
            const answer = getEl('fill-in-input') ? getEl('fill-in-input').value.trim() : "";
            checkAnswer(answer, q.correct, q.type);
        };
        area.appendChild(submitBtn);
    }
}

function checkAnswer(selected, correct, type) {
    let isCorrect = false;
    let scoreValue = 0;
    
    const btns = document.querySelectorAll('.opt-btn, .main-btn');
    btns.forEach(b => b.disabled = true);

    if (type === 'pg' || type === 'bs') {
        isCorrect = selected === correct;
        scoreValue = isCorrect ? (type === 'pg' ? PG_SCORE : BS_SCORE) : 0;
        
        // Visual feedback for buttons
        document.querySelectorAll('.opt-btn').forEach(b => {
            if (b.innerHTML === correct) {
                b.style.backgroundColor = 'var(--success-color)';
                b.style.color = 'white';
            } else if (b.innerHTML === selected) {
                b.style.backgroundColor = 'var(--error-color)';
                b.style.color = 'white';
            }
        });
        
    } else if (type === 'isian') {
        isCorrect = normalizeAnswer(selected) === normalizeAnswer(correct);
        scoreValue = isCorrect ? ISIAN_SCORE : 0;
    }

    // Update skor & stats
    if (isCorrect) {
        score += scoreValue; 
        correctCount++;
    } else {
        incorrectCount++;
    }
    if (getEl('current-score')) getEl('current-score').innerText = score;
    
    // Tampilkan Visual Feedback
    const visualFeedback = getEl('visual-feedback');
    const feedbackIcon = getEl('feedback-icon');
    
    if (visualFeedback && feedbackIcon) {
        visualFeedback.className = `visual-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackIcon.className = isCorrect ? 'fas fa-check' : 'fas fa-times';
    }

    // Lanjut ke soal berikutnya setelah jeda
    setTimeout(() => {
        if (visualFeedback) visualFeedback.className = 'visual-feedback hidden';
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            renderQuestion();
        } else {
            stopTimer();
            endGame();
        }
    }, 1500); 
}

function endGame() {
    showScreen('game-over');
    
    const formattedTime = formatTime(finalTime);
    
    // Tampilkan Skor, Waktu, dan Statistik
    if (getEl('final-score')) getEl('final-score').innerText = score;
    if (getEl('stat-correct')) getEl('stat-correct').innerText = correctCount;
    if (getEl('stat-incorrect')) getEl('stat-incorrect').innerText = incorrectCount;
    if (getEl('stat-total')) getEl('stat-total').innerText = QUIZ_LENGTH;
    if (getEl('time-taken-display')) getEl('time-taken-display').innerText = formattedTime;
    
    const maxScore = QUIZ_LENGTH * PG_SCORE;
    const percent = (score / maxScore) * 100;
    let msg = "";

    if (percent <= 50) msg = "Ayo tingkatkan belajarmu! Masih banyak materi yang perlu dipahami. 🤓";
    else if (percent <= 70) msg = "Hasil cukup baik, tingkatkan lagi fokus dan ketelitianmu. 👍";
    else if (percent <= 90) msg = "Hebat! Penguasaan materi sudah sangat bagus. ✨";
    else msg = "Sempurna! Kamu menguasai semua materi! 👑";

    if (getEl('result-message-final')) getEl('result-message-final').innerHTML = msg;
    
    renderPerformanceVisualization(correctCount, incorrectCount);
}


// --- PERFORMANCE VISUALIZATION ---
function renderPerformanceVisualization(correct, incorrect) {
    const total = correct + incorrect;
    const correctPercent = total > 0 ? (correct / total) * 100 : 0;
    const incorrectPercent = total > 0 ? (incorrect / total) * 100 : 0;
    
    const chartContainer = getEl('performance-chart');
    if (!chartContainer) return;
    
    chartContainer.innerHTML = `
        <div class="chart-label correct-label">Benar (${correct})</div>
        <div class="chart-label incorrect-label">Salah (${incorrect})</div>
        <div class="bar-chart-wrapper">
            <div class="bar correct-bar" style="width: ${correctPercent.toFixed(0)}%;" title="${correctPercent.toFixed(1)}% Benar"></div>
            <div class="bar incorrect-bar" style="width: ${incorrectPercent.toFixed(0)}%;" title="${incorrectPercent.toFixed(1)}% Salah"></div>
        </div>
        <div class="percentage-display">
            <span class="correct-percent-val">${correctPercent.toFixed(1)}%</span>
            <span class="incorrect-percent-val">${incorrectPercent.toFixed(1)}%</span>
        </div>
    `;
}

// --- FITUR TAMBAHAN (FEEDBACK & COPY RESULT) ---

// Fungsi untuk membuka WhatsApp (Fitur Feedback dikembalikan)
function openWhatsapp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Fungsi untuk menyalin hasil (Fitur Baru)
function copyResults() {
    const timeDisplay = formatTime(finalTime);
    const correct = correctCount;
    const incorrect = incorrectCount;
    const totalScore = score;
    const maxScore = QUIZ_LENGTH * PG_SCORE;
    const percent = ((totalScore / maxScore) * 100).toFixed(1);
    
    const textToCopy = `
*✅ Hasil Kuis IPS ${currentUsername}*
============================
📝 Total Soal: ${QUIZ_LENGTH}
⏱️ Waktu Pengerjaan: ${timeDisplay}
============================
💯 Skor Akhir: ${totalScore} (Poin Maksimal: ${maxScore})
📊 Persentase: ${percent}%
✅ Jawaban Benar: ${correct}
❌ Jawaban Salah: ${incorrect}

*Ayo terus belajar dan tingkatkan terus prestasimu!*
    `.trim();

    // Menggunakan API Clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Hasil kuis berhasil disalin ke clipboard!");
        const btn = getEl('btn-copy-result');
        if (btn) {
            btn.innerHTML = '✅ Berhasil Disalin!';
            setTimeout(() => {
                btn.innerHTML = 'Salin Hasil';
            }, 2000);
        }
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
        alert('Gagal menyalin hasil kuis.');
    });
}


// --- 3. FITUR PENAMBAH PENGETAHUAN (TOOLTIP) & LOGOUT ---
// Didefinisikan di window agar bisa dipanggil dari HTML inline
window.showInfo = function(index) {
    const q = quizData[index];
    if (getEl('info-modal-header')) getEl('info-modal-header').innerHTML = `💡 ${q.type.toUpperCase()} - Soal ${parseInt(index) + 1}`;
    if (getEl('info-modal-body')) {
        getEl('info-modal-body').innerHTML = `
            <h4>${q.question}</h4>
            <p><b>Jawaban Benar:</b> ${q.correct}</p>
            <p><b>Penjelasan:</b> ${q.info}</p>
        `;
    }
    const infoModal = getEl('info-modal');
    if (infoModal) infoModal.classList.remove('hidden');
}

// Didefinisikan di window agar bisa dipanggil dari HTML inline
window.userLogout = function() {
    if(confirm("Yakin ingin keluar dari sesi ini?")) {
        localStorage.removeItem('KUIS_USER_NAME');
        location.reload();
    }
}