const STATE = {
  board: [],          // Current board (0 = empty)
  solution: [],       // Solved board
  given: [],          // Which cells are pre-filled (boolean grid)
  notes: [],          // 9x9 array of Set (candidate notes per cell)
  selectedCell: null, // { row, col }
  difficulty: 'easy',
  mistakes: 0,
  timerSeconds: 0,
  timerInterval: null,
  undoStack: [],
  redoStack: [],
  liveValidation: true,
  notesMode: false,
  solved: false,
  solving: false,
};

/* Difficulty → number of clues */
const CLUE_COUNT = { easy: 40, medium: 30, hard: 24 };

/* ============================================================
   DOM REFERENCES
============================================================ */
const gridEl         = document.getElementById('sudokuGrid');
const timerEl        = document.getElementById('timerDisplay');
const mistakeEl      = document.getElementById('mistakeCount');
const cellsLeftEl    = document.getElementById('cellsLeft');
const btnNew         = document.getElementById('btnNew');
const btnReset       = document.getElementById('btnReset');
const btnSolve       = document.getElementById('btnSolve');
const btnUndo        = document.getElementById('btnUndo');
const btnRedo        = document.getElementById('btnRedo');
const validationTog  = document.getElementById('validationToggle');
const notesTog       = document.getElementById('notesToggle');
const victoryOverlay = document.getElementById('victoryOverlay');
const playAgainBtn   = document.getElementById('playAgainBtn');
const finalTimeEl    = document.getElementById('finalTime');
const finalMistakesEl= document.getElementById('finalMistakes');
const victoryMsgEl   = document.getElementById('victoryMsg');
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmTitle   = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOk      = document.getElementById('confirmOk');
const confirmCancel  = document.getElementById('confirmCancel');

/* ============================================================
   CUSTOM CONFIRMATION MODAL
============================================================ */
function showConfirm(title, message, onConfirm) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmOverlay.classList.remove('hidden');
  confirmOverlay.setAttribute('aria-hidden', 'false');
  
  const handleConfirm = () => {
    hideConfirm();
    if (onConfirm) onConfirm();
  };
  
  const handleCancel = () => {
    hideConfirm();
  };
  
  // Remove old listeners
  const newConfirmOk = confirmOk.cloneNode(true);
  const newConfirmCancel = confirmCancel.cloneNode(true);
  confirmOk.parentNode.replaceChild(newConfirmOk, confirmOk);
  confirmCancel.parentNode.replaceChild(newConfirmCancel, confirmCancel);
  
  // Add new listeners
  newConfirmOk.addEventListener('click', handleConfirm);
  newConfirmCancel.addEventListener('click', handleCancel);
  
  // Close on background click
  confirmOverlay.addEventListener('click', e => {
    if (e.target === confirmOverlay) hideConfirm();
  });
}

function hideConfirm() {
  confirmOverlay.classList.add('hidden');
  confirmOverlay.setAttribute('aria-hidden', 'true');
}

/* ============================================================
   BACKTRACKING — SOLVER
   Returns true if board was solved in-place.
============================================================ */
function solve(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        // Try each digit in shuffled order (for generation variety)
        for (let n = 1; n <= 9; n++) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solve(board)) return true;
            board[r][c] = 0;
          }
        }
        return false; // Backtrack
      }
    }
  }
  return true; // All cells filled
}

/* Check if placing `num` at (r,c) is valid */
function isValid(board, r, c, num) {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === num) return false;            // Row
    if (board[i][c] === num) return false;            // Col
    const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
    const bc = 3 * Math.floor(c / 3) + (i % 3);
    if (board[br][bc] === num) return false;          // Box
  }
  return true;
}

/* Shuffle array in-place (Fisher-Yates) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Randomised solver (for puzzle generation) */
function solveRandom(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1,2,3,4,5,6,7,8,9]);
        for (const n of nums) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solveRandom(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/* Count solutions (capped at 2 for uniqueness check) */
function countSolutions(board, cap = 2) {
  const copy = board.map(r => [...r]);
  let count = 0;

  function bt(b) {
    if (count >= cap) return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(b, r, c, n)) {
              b[r][c] = n;
              bt(b);
              b[r][c] = 0;
            }
          }
          return;
        }
      }
    }
    count++;
  }

  bt(copy);
  return count;
}

/* ============================================================
   PUZZLE GENERATION
============================================================ */
function generatePuzzle(difficulty) {
  // 1. Create a fully solved board
  const full = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveRandom(full);

  // 2. Start with full board and remove cells one by one
  const puzzle = full.map(r => [...r]);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => [Math.floor(i/9), i%9]));
  const clues = CLUE_COUNT[difficulty];
  let removed = 0;

  for (const [r, c] of positions) {
    if (81 - removed <= clues) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    // Ensure unique solution
    if (countSolutions(puzzle) !== 1) {
      puzzle[r][c] = backup; // Restore if breaks uniqueness
    } else {
      removed++;
    }
  }

  return { puzzle, solution: full };
}

/* ============================================================
   DEEP COPY HELPERS
============================================================ */
function cloneBoard(board) {
  return board.map(r => [...r]);
}

function cloneNotes(notes) {
  return notes.map(r => r.map(s => new Set(s)));
}

/* ============================================================
   TIMER
============================================================ */
function startTimer() {
  stopTimer();
  STATE.timerSeconds = 0;
  updateTimerDisplay();
  STATE.timerInterval = setInterval(() => {
    STATE.timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(STATE.timerInterval);
  STATE.timerInterval = null;
}

function updateTimerDisplay() {
  const m = String(Math.floor(STATE.timerSeconds / 60)).padStart(2, '0');
  const s = String(STATE.timerSeconds % 60).padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ============================================================
   GRID BUILDING
============================================================ */
function buildGrid() {
  gridEl.innerHTML = '';

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('tabindex', '0');
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('click', () => selectCell(r, c));
      cell.addEventListener('keydown', onCellKeydown);
      gridEl.appendChild(cell);
    }
  }
}

/* Get a cell element by (row, col) */
function getCell(r, c) {
  return gridEl.children[r * 9 + c];
}

/* ============================================================
   RENDER
   Update DOM to match STATE.board / STATE.notes
============================================================ */
function renderBoard() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      renderCell(r, c);
    }
  }
  updateCellsLeft();
  updateNumpadDisabled();
}

function renderCell(r, c) {
  const cell = getCell(r, c);
  const val = STATE.board[r][c];
  const isGiven = STATE.given[r][c];
  const noteSet = STATE.notes[r][c];

  // Reset classes
  cell.className = 'cell';

  if (isGiven) {
    cell.classList.add('given');
    cell.innerHTML = `<span class="num-value">${val}</span>`;
    cell.setAttribute('aria-label', `Row ${r+1}, Column ${c+1}: ${val} (given)`);
  } else if (val !== 0) {
    cell.classList.add('user');

    // Validate
    if (STATE.liveValidation && val !== STATE.solution[r][c]) {
      cell.classList.add('error');
    }

    cell.innerHTML = `<span class="num-value">${val}</span>`;
    cell.setAttribute('aria-label', `Row ${r+1}, Column ${c+1}: ${val}`);
  } else if (noteSet && noteSet.size > 0) {
    // Render notes
    let notesHtml = '<div class="notes-grid">';
    for (let n = 1; n <= 9; n++) {
      notesHtml += `<div class="note-digit ${noteSet.has(n) ? 'active' : ''}">${noteSet.has(n) ? n : ''}</div>`;
    }
    notesHtml += '</div>';
    cell.innerHTML = notesHtml;
    cell.setAttribute('aria-label', `Row ${r+1}, Column ${c+1}: notes`);
  } else {
    cell.innerHTML = '';
    cell.setAttribute('aria-label', `Row ${r+1}, Column ${c+1}: empty`);
  }

  // Restore selection highlight
  if (STATE.selectedCell) {
    const { row, col } = STATE.selectedCell;
    if (r === row && c === col) {
      cell.classList.add('selected');
    } else if (shouldHighlight(r, c, row, col)) {
      // Same row/col/box
      if (val !== 0 && STATE.board[row][col] !== 0 && val === STATE.board[row][col]) {
        cell.classList.add('same-num');
      } else {
        cell.classList.add('highlighted');
      }
    } else if (val !== 0 && STATE.board[row][col] !== 0 && val === STATE.board[row][col]) {
      cell.classList.add('same-num');
    }
  }
}

/* Returns true if (r,c) shares row/col/box with selected (sr,sc) */
function shouldHighlight(r, c, sr, sc) {
  if (r === sr || c === sc) return true;
  return Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3);
}

/* ============================================================
   CELL SELECTION
============================================================ */
function selectCell(r, c) {
  STATE.selectedCell = { row: r, col: c };
  renderBoard();
  getCell(r, c).focus();
}

/* ============================================================
   INPUT A NUMBER
============================================================ */
function inputNumber(num) {
  if (!STATE.selectedCell || STATE.solved || STATE.solving) return;
  const { row, col } = STATE.selectedCell;
  if (STATE.given[row][col]) return; // Can't change given cells

  if (STATE.notesMode && num !== 0) {
    // Toggle note
    pushHistory();
    const noteSet = STATE.notes[row][col];
    if (noteSet.has(num)) noteSet.delete(num);
    else noteSet.add(num);
    STATE.board[row][col] = 0; // Clear value if entering note
    renderCell(row, col);
    saveProgress();
    return;
  }

  // Normal input
  const prev = STATE.board[row][col];
  const prevNotes = new Set(STATE.notes[row][col]);

  if (prev === num) return; // No change

  pushHistory();
  STATE.board[row][col] = num;
  STATE.notes[row][col] = new Set(); // Clear notes on value entry

  // Count mistakes
  if (num !== 0 && STATE.liveValidation && num !== STATE.solution[row][col]) {
    STATE.mistakes++;
    updateMistakeDisplay();
    // Flash error
    renderCell(row, col);
    const cell = getCell(row, col);
    cell.classList.add('error');
  } else if (num !== 0 && num === STATE.solution[row][col]) {
    renderCell(row, col);
    const cell = getCell(row, col);
    cell.classList.add('correct-flash');
    setTimeout(() => cell.classList.remove('correct-flash'), 400);
  }

  renderBoard();
  updateCellsLeft();
  updateNumpadDisabled();
  saveProgress();
  checkWin();
}

/* ============================================================
   WIN CHECK
============================================================ */
function checkWin() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (STATE.board[r][c] !== STATE.solution[r][c]) return;
    }
  }
  // All cells match solution
  STATE.solved = true;
  stopTimer();
  localStorage.removeItem('sudoku_save');
  showVictory();
}

function showVictory() {
  finalTimeEl.textContent = formatTime(STATE.timerSeconds);
  finalMistakesEl.textContent = STATE.mistakes;

  if (STATE.mistakes === 0) victoryMsgEl.textContent = 'Perfect solve! No mistakes. 🏆';
  else if (STATE.mistakes <= 3) victoryMsgEl.textContent = 'Excellent work!';
  else victoryMsgEl.textContent = `Solved with ${STATE.mistakes} mistake${STATE.mistakes > 1 ? 's' : ''}.`;

  victoryOverlay.classList.remove('hidden');
  victoryOverlay.setAttribute('aria-hidden', 'false');
}

/* ============================================================
   AUTO-SOLVE ANIMATION
============================================================ */
async function autoSolve() {
  if (STATE.solving) return;
  STATE.solving = true;
  btnSolve.disabled = true;

  // Work from a copy of current board
  const solvable = cloneBoard(STATE.board);
  solve(solvable); // fills solvable in-place

  // Collect empty cells to animate
  const emptyCells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!STATE.given[r][c] && STATE.board[r][c] === 0) {
        emptyCells.push({ r, c, val: solvable[r][c] });
      }
    }
  }

  for (const { r, c, val } of emptyCells) {
    STATE.board[r][c] = val;
    STATE.notes[r][c] = new Set();
    renderCell(r, c);
    const cell = getCell(r, c);
    cell.classList.add('solving');
    await sleep(28);
    cell.classList.remove('solving');
  }

  STATE.solving = false;
  STATE.solved = true;
  stopTimer();
  btnSolve.disabled = false;
  renderBoard();
  updateCellsLeft();
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/* ============================================================
   UNDO / REDO
============================================================ */
function pushHistory() {
  STATE.undoStack.push({
    board: cloneBoard(STATE.board),
    notes: cloneNotes(STATE.notes),
    mistakes: STATE.mistakes,
  });
  STATE.redoStack = []; // Clear redo on new action
  updateUndoRedoButtons();
}

function undo() {
  if (STATE.undoStack.length === 0) return;
  // Save current state to redo
  STATE.redoStack.push({
    board: cloneBoard(STATE.board),
    notes: cloneNotes(STATE.notes),
    mistakes: STATE.mistakes,
  });
  const prev = STATE.undoStack.pop();
  STATE.board = prev.board;
  STATE.notes = prev.notes;
  STATE.mistakes = prev.mistakes;
  updateMistakeDisplay();
  renderBoard();
  updateUndoRedoButtons();
  saveProgress();
}

function redo() {
  if (STATE.redoStack.length === 0) return;
  STATE.undoStack.push({
    board: cloneBoard(STATE.board),
    notes: cloneNotes(STATE.notes),
    mistakes: STATE.mistakes,
  });
  const next = STATE.redoStack.pop();
  STATE.board = next.board;
  STATE.notes = next.notes;
  STATE.mistakes = next.mistakes;
  updateMistakeDisplay();
  renderBoard();
  updateUndoRedoButtons();
  saveProgress();
}

function updateUndoRedoButtons() {
  btnUndo.disabled = STATE.undoStack.length === 0;
  btnRedo.disabled = STATE.redoStack.length === 0;
}

/* ============================================================
   STATS UPDATES
============================================================ */
function updateMistakeDisplay() {
  mistakeEl.textContent = STATE.mistakes;
  mistakeEl.className = 'stat-val';
  if (STATE.mistakes >= 5) mistakeEl.classList.add('danger');
  else if (STATE.mistakes >= 3) mistakeEl.classList.add('warn');
}

function updateCellsLeft() {
  let left = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (STATE.board[r][c] === 0) left++;
    }
  }
  cellsLeftEl.textContent = left;
}

/* Dim numpad buttons for fully-placed numbers */
function updateNumpadDisabled() {
  const count = {};
  for (let n = 1; n <= 9; n++) count[n] = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = STATE.board[r][c];
      if (v > 0) count[v]++;
    }
  }
  document.querySelectorAll('.num-btn').forEach(btn => {
    const n = parseInt(btn.dataset.num);
    if (n > 0) {
      btn.classList.toggle('disabled-num', count[n] >= 9);
    }
  });
}

/* ============================================================
   NEW GAME / RESET
============================================================ */
function newGame(difficulty) {
  STATE.difficulty = difficulty || STATE.difficulty;
  STATE.solved = false;
  STATE.solving = false;
  STATE.mistakes = 0;
  STATE.undoStack = [];
  STATE.redoStack = [];
  STATE.selectedCell = null;

  const { puzzle, solution } = generatePuzzle(STATE.difficulty);

  STATE.board    = cloneBoard(puzzle);
  STATE.solution = solution;
  STATE.given    = puzzle.map(r => r.map(v => v !== 0));
  STATE.notes    = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );

  updateMistakeDisplay();
  updateUndoRedoButtons();
  startTimer();
  buildGrid();
  renderBoard();
  victoryOverlay.classList.add('hidden');
  saveProgress();
}

function resetGame() {
  STATE.solved = false;
  STATE.solving = false;
  STATE.mistakes = 0;
  STATE.undoStack = [];
  STATE.redoStack = [];
  STATE.selectedCell = null;
  STATE.notes = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );

  // Restore original puzzle (clear user inputs)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!STATE.given[r][c]) STATE.board[r][c] = 0;
    }
  }

  updateMistakeDisplay();
  updateUndoRedoButtons();
  startTimer();
  renderBoard();
  saveProgress();
}

/* ============================================================
   LOCAL STORAGE
============================================================ */
function saveProgress() {
  try {
    const save = {
      board: STATE.board,
      solution: STATE.solution,
      given: STATE.given,
      notes: STATE.notes.map(r => r.map(s => [...s])),
      mistakes: STATE.mistakes,
      timerSeconds: STATE.timerSeconds,
      difficulty: STATE.difficulty,
    };
    localStorage.setItem('sudoku_save', JSON.stringify(save));
  } catch (e) { /* Storage full or unavailable */ }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('sudoku_save');
    if (!raw) return false;
    const save = JSON.parse(raw);

    STATE.board      = save.board;
    STATE.solution   = save.solution;
    STATE.given      = save.given;
    STATE.notes      = save.notes.map(r => r.map(arr => new Set(arr)));
    STATE.mistakes   = save.mistakes;
    STATE.timerSeconds = save.timerSeconds;
    STATE.difficulty = save.difficulty || 'easy';

    return true;
  } catch (e) {
    return false;
  }
}

/* ============================================================
   KEYBOARD HANDLING
============================================================ */
function onCellKeydown(e) {
  if (!STATE.selectedCell) return;
  const { row, col } = STATE.selectedCell;

  switch (e.key) {
    case 'ArrowUp':    e.preventDefault(); if (row > 0) selectCell(row-1, col); break;
    case 'ArrowDown':  e.preventDefault(); if (row < 8) selectCell(row+1, col); break;
    case 'ArrowLeft':  e.preventDefault(); if (col > 0) selectCell(row, col-1); break;
    case 'ArrowRight': e.preventDefault(); if (col < 8) selectCell(row, col+1); break;

    case 'Tab':
      e.preventDefault();
      if (e.shiftKey) {
        const prev = row * 9 + col - 1;
        if (prev >= 0) selectCell(Math.floor(prev/9), prev%9);
      } else {
        const next = row * 9 + col + 1;
        if (next < 81) selectCell(Math.floor(next/9), next%9);
      }
      break;

    case 'Backspace':
    case 'Delete':
    case '0':
      inputNumber(0);
      break;

    default:
      if (e.key >= '1' && e.key <= '9') {
        inputNumber(parseInt(e.key));
      }
  }
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
  if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo(); }
});

/* ============================================================
   EVENT LISTENERS
============================================================ */

// Difficulty buttons
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    newGame(btn.dataset.diff);
  });
});

// Game control buttons
btnNew.addEventListener('click', () => newGame(STATE.difficulty));

btnReset.addEventListener('click', () => {
  showConfirm('Reset Puzzle', 'Reset the current puzzle?', () => {
    resetGame();
  });
});

btnSolve.addEventListener('click', () => {
  showConfirm('Auto-Solve', 'Auto-solve this puzzle? This will end the game.', () => {
    stopTimer();
    autoSolve();
  });
});

btnUndo.addEventListener('click', undo);
btnRedo.addEventListener('click', redo);

// Number pad
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => inputNumber(parseInt(btn.dataset.num)));
});

// Toggles
validationTog.addEventListener('change', () => {
  STATE.liveValidation = validationTog.checked;
  renderBoard();
});

notesTog.addEventListener('change', () => {
  STATE.notesMode = notesTog.checked;
});

// Victory screen play again
playAgainBtn.addEventListener('click', () => {
  victoryOverlay.classList.add('hidden');
  newGame(STATE.difficulty);
});

// Close overlay on background click
victoryOverlay.addEventListener('click', e => {
  if (e.target === victoryOverlay) victoryOverlay.classList.add('hidden');
});

/* ============================================================
   INIT
============================================================ */
(function init() {
  buildGrid();

  // Try restoring a saved game
  const restored = loadProgress();
  if (restored) {
    // Update difficulty button UI
    document.querySelectorAll('.diff-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === STATE.difficulty);
    });
    STATE.solved  = false;
    STATE.solving = false;
    STATE.undoStack = [];
    STATE.redoStack = [];
    updateMistakeDisplay();
    updateUndoRedoButtons();
    renderBoard();

    // Resume timer from saved offset
    STATE.timerInterval = setInterval(() => {
      STATE.timerSeconds++;
      updateTimerDisplay();
    }, 1000);
    updateTimerDisplay();
  } else {
    newGame('easy');
  }
})();
