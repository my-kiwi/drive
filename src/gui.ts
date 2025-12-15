import { getRenderer } from './renderer';

const GAME_DURATION = 90; // seconds
const SCORE_MULTIPLIER = 10;
let gameOver = false;

export const updateGui = (elapsedSeconds: number, bonusCount: number) => {
  const score = bonusCount * SCORE_MULTIPLIER;
  // update timer display and check for end of game
  if (timerEl && !gameOver) {
    const remaining = GAME_DURATION - elapsedSeconds;
    timerEl.innerText = formatTime(remaining > 0 ? remaining : 0);
    if (remaining <= 0) {
      // game over
      endGame(score);
    }
  }

  const bonusEl = document.querySelector('.game-bonus-count') as HTMLSpanElement | null;
  if (bonusEl) {
    bonusEl.innerText = String(score);
  }
};

// Elements are now provided in `index.html`; query them.
const timerEl = document.querySelector('.game-timer') as HTMLDivElement | null;
const overlay = document.querySelector('.game-overlay') as HTMLDivElement | null;
const restartBtn = document.querySelector('.game-restart-btn') as HTMLButtonElement | null;
const overlayBonusEl = document.querySelector('.game-over-bonus') as HTMLSpanElement | null;

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

function endGame(score: number) {
  if (gameOver) {
    return;
  }
  gameOver = true;
  // stop the render loop
  getRenderer().setAnimationLoop(null);
  if (overlay) {
    overlay.style.visibility = 'visible';
    // show collected bonus count if available in the HUD
    const hudBonus = document.querySelector('.game-bonus-count') as HTMLSpanElement | null;
    if (overlayBonusEl && hudBonus) {
      overlayBonusEl.innerText = String(score);
    }
  }
}
