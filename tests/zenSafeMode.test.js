import { jest } from '@jest/globals';

let State;
let UI;

function setupDOM() {
  document.body.innerHTML = `
    <div class="game-board-container"><div id="game-board"></div></div>
    <div id="main-screen"></div>
    <div id="in-game-ui"></div>
    <div id="zen-level-indicator"><span id="zen-current-level"></span></div>
    <div id="game-title"></div>
    <input type="checkbox" id="safe-mode-toggle" />
    <div id="new-game-in-game"></div>
    <div id="current-difficulty-label"></div>
    <div id="mines-counter"></div>
    <div id="timer"></div>
    <div id="speedrun-indicator" class="mode-indicator"></div>
    <div id="safe-indicator" class="mode-indicator"></div>
    <div id="in-game-speedrun" class="in-game-mode-indicator"></div>
    <div id="in-game-safe" class="in-game-mode-indicator"></div>
  `;
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.resetModules();
  setupDOM();
  State = await import('../js/state.js');
  UI = await import('../js/ui.js');
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('safe mode restored after exiting Zen mode when initially off', () => {
  State.setSafeMode(false);
  UI.startZenLevel(1);
  jest.runAllTimers();
  expect(State.safeMode).toBe(true);
  expect(State.previousSafeMode).toBe(false);
  expect(document.getElementById('safe-mode-toggle').checked).toBe(true);

  UI.resetToMainScreen();
  expect(State.safeMode).toBe(false);
  expect(document.getElementById('safe-mode-toggle').checked).toBe(false);
});

test('safe mode restored after exiting Zen mode when initially on', () => {
  State.setSafeMode(true);
  UI.startZenLevel(1);
  jest.runAllTimers();
  expect(State.safeMode).toBe(true);
  expect(State.previousSafeMode).toBe(true);

  UI.resetToMainScreen();
  expect(State.safeMode).toBe(true);
  expect(document.getElementById('safe-mode-toggle').checked).toBe(true);
});
