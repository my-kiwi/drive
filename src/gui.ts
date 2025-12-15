import { getRenderer } from './renderer';

const GAME_DURATION = 90; // seconds
let gameOver = false;

export const updateGui = (elapsedSeconds: number) => {
  // update timer display and check for end of game
  if (timerEl && !gameOver) {
    const remaining = GAME_DURATION - elapsedSeconds;
    if (remaining <= 0) {
      timerEl.innerText = formatTime(0);
      endGame();
    } else {
      timerEl.innerText = formatTime(remaining);
    }
  }
};

// Elements are now provided in `index.html`; query them.
const timerEl = document.querySelector('.game-timer') as HTMLDivElement | null;
const overlay = document.querySelector('.game-overlay') as HTMLDivElement | null;
const restartBtn = document.querySelector('.game-restart-btn') as HTMLButtonElement | null;

if (restartBtn)
  restartBtn.addEventListener('click', () => {
    location.reload(); // FIXME: replace with proper reset logic
  });
if (overlay) overlay.style.visibility = 'hidden';

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function endGame() {
  if (gameOver) {
    return;
  }
  gameOver = true;
  // stop the render loop
  getRenderer().setAnimationLoop(null);
  if (overlay) {
    overlay.style.visibility = 'visible';
  }
}

// Update timer inside the existing animate loop by wrapping the old function
// We already set `renderer.setAnimationLoop(animate)` above; the animate closure
// will update `elapsedSeconds` which is in scope.
