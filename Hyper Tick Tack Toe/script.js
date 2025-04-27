// Game Variables
const board = document.getElementById('board');
const message = document.getElementById('message');
const resetButton = document.getElementById('reset');
const scoreX = document.getElementById('score-x-value');
const scoreO = document.getElementById('score-o-value');
const scoreXContainer = document.getElementById('score-x');
const scoreOContainer = document.getElementById('score-o');
const historyList = document.getElementById('history-list');
const toggleThemeButton = document.getElementById('toggle-theme');
const settingsButton = document.getElementById('settings-btn');
const toggleAIButton = document.getElementById('toggle-ai');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsButton = document.getElementById('close-settings');
const soundToggle = document.getElementById('sound-toggle');
const moveLimitInput = document.getElementById('move-limit');
const aiDifficulty = document.getElementById('ai-difficulty');
const moveCountDisplay = document.getElementById('move-count');

let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let moveHistory = [];
let gameActive = true;
let scores = JSON.parse(localStorage.getItem('ticTacToeScores')) || { X: 0, O: 0 };
let moveCount = 0;
let maxMoves = parseInt(moveLimitInput.value);
let soundEnabled = soundToggle.checked;
let aiEnabled = false;
let aiLevel = aiDifficulty.value;

// Sound Effects
const moveSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-click-1114.mp3');
const winSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-level-completed-2059.mp3');
const fadeSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-flick-1735.mp3');
const vanishSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3');

// Initialize Board
for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add(
        'cell',
        'bg-glass',
        'border-4',
        'border-primary',
        'rounded-xl',
        'flex',
        'items-center',
        'justify-center',
        'text-4xl',
        'font-bold',
        'cursor-pointer'
    );
    cell.dataset.index = i;
    cell.addEventListener('click', debounce(() => handleCellClick(i), 100));
    board.appendChild(cell);
}

// Event Listeners
resetButton.addEventListener('click', resetGame);
toggleThemeButton.addEventListener('click', toggleTheme);
settingsButton.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsButton.addEventListener('click', () => settingsModal.classList.add('hidden'));
soundToggle.addEventListener('change', () => soundEnabled = soundToggle.checked);
moveLimitInput.addEventListener('change', () => maxMoves = parseInt(moveLimitInput.value));
aiDifficulty.addEventListener('change', () => aiLevel = aiDifficulty.value);
toggleAIButton.addEventListener('click', toggleAI);

// Handle Cell Click
function handleCellClick(index) {
    if (!gameActive || gameBoard[index] !== '') return;

    // Place mark
    placeMark(index, currentPlayer);
    moveCount++;
    if (soundEnabled) moveSound.play();
    updateMoveCount();

    // Check win or draw
    if (checkWin()) {
        endGame(`Player ${currentPlayer} Wins!`, true);
        return;
    }
    if (moveCount >= maxMoves || !gameBoard.includes('')) {
        endGame("It's a Draw!", false);
        return;
    }

    // Switch player or trigger AI
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updatePlayerIndicator();
    if (aiEnabled && currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 500);
    }
}

// Place Mark
function placeMark(index, player) {
    gameBoard[index] = player;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.classList.add(player.toLowerCase(), player === 'X' ? 'text-primary' : 'text-secondary');
    moveHistory.push({ player, index });
    addToHistory(`Player ${player} placed ${player} at cell ${index}`);

    // Handle fading (6th mark)
    if (moveHistory.length === 6) {
        const fadingMove = moveHistory[0];
        const fadingCell = document.querySelector(`.cell[data-index="${fadingMove.index}"]`);
        fadingCell.classList.add('fading');
        if (soundEnabled) fadeSound.play();
    }

    // Handle vanishing (7th mark)
    if (moveHistory.length > 6) {
        const vanishedMove = moveHistory.shift();
        const vanishedCell = document.querySelector(`.cell[data-index="${vanishedMove.index}"]`);
        vanishedCell.classList.remove('fading', 'x', 'o', 'text-primary', 'text-secondary');
        vanishedCell.classList.add('vanished');
        gameBoard[vanishedMove.index] = '';
        if (soundEnabled) vanishSound.play();
        setTimeout(() => {
            vanishedCell.classList.remove('vanished');
            updateBoard();
        }, 500);
    }

    updateBoard();
}

// AI Move
function makeAIMove() {
    if (!gameActive) return;
    const emptyCells = gameBoard.map((val, i) => val === '' ? i : null).filter(val => val !== null);
    let move;

    if (aiLevel === 'hard') {
        move = findBestMove('O');
        if (!move) move = findBestMove('X'); // Block player
        if (!move) move = emptyCells[Math.floor(Math.random() * emptyCells.length)]; // Random
    } else {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    if (move !== undefined) {
        handleCellClick(move);
    }
}

function findBestMove(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameBoard[a] === player && gameBoard[b] === player && gameBoard[c] === '') return c;
        if (gameBoard[a] === player && gameBoard[c] === player && gameBoard[b] === '') return b;
        if (gameBoard[b] === player && gameBoard[c] === player && gameBoard[a] === '') return a;
    }
    return null;
}

// Check Win
function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => pattern.every(index => gameBoard[index] === currentPlayer));
}

// End Game
function endGame(messageText, isWin) {
    message.textContent = messageText;
    message.classList.add(isWin ? 'text-secondary' : 'text-gray-600');
    gameActive = false;
    if (isWin) {
        scores[currentPlayer]++;
        updateScores();
        highlightWinningCells();
        if (soundEnabled) winSound.play();
        triggerConfetti();
    }
}

// Update Board
function updateBoard() {
    gameBoard.forEach((mark, i) => {
        const cell = document.querySelector(`.cell[data-index="${i}"]`);
        cell.textContent = mark;
    });
}

// Highlight Winning Cells
function highlightWinningCells() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    const winningPattern = winPatterns.find(pattern => pattern.every(index => gameBoard[index] === currentPlayer));
    if (winningPattern) {
        winningPattern.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            cell.classList.add('win');
        });
    }
}

// Reset Game
function resetGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    moveHistory = [];
    moveCount = 0;
    currentPlayer = 'X';
    gameActive = true;
    message.textContent = "Player X's Turn";
    message.classList.remove('text-secondary', 'text-gray-600');
    historyList.innerHTML = '';
    updateMoveCount();
    updatePlayerIndicator();
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('fading', 'vanished', 'x', 'o', 'text-primary', 'text-secondary', 'win');
    });
}

// Update Scores
function updateScores() {
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

// Update Player Indicator
function updatePlayerIndicator() {
    scoreXContainer.classList.toggle('active', currentPlayer === 'X');
    scoreOContainer.classList.toggle('active', currentPlayer === 'O');
}

// Update Move Count
function updateMoveCount() {
    moveCountDisplay.textContent = `Moves: ${moveCount}`;
}

// Add to History
function addToHistory(action) {
    const item = document.createElement('div');
    item.classList.add('history-item', 'text-sm', 'py-2', 'border-b', 'border-gray-200', 'dark:border-gray-700');
    item.textContent = `Move ${moveCount}: ${action}`;
    historyList.appendChild(item);
    historyList.scrollTop = historyList.scrollHeight;
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('dark');
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('ticTacToeTheme', theme);
}

// Toggle AI
function toggleAI() {
    aiEnabled = !aiEnabled;
    toggleAIButton.textContent = aiEnabled ? 'Disable AI' : 'Enable AI';
    if (aiEnabled && currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 500);
    }
}

// Trigger Confetti
function triggerConfetti() {
    confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4a6fa5', '#ff6b6b', '#39ff14'],
    });
}

// Initialize Particles
particlesJS('particles-js', {
    particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: ['#4a6fa5', '#ff6b6b', '#39ff14'] },
        shape: { type: 'circle' },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: '#4a6fa5', opacity: 0.4, width: 1 },
        move: { enable: true, speed: 1.5, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
        modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
    },
    retina_detect: true
});

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize
updatePlayerIndicator();
updateScores();
message.textContent = "Player X's Turn";
if (localStorage.getItem('ticTacToeTheme') === 'dark') {
    document.body.classList.add('dark');
}