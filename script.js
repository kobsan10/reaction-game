'use strict';

const LS_KEY = 'rxn-personal-best';

const state = {
  phase: 'idle',
  reactionTime: null,
  personalBest: null,
  history: [],
  waitTimeout: null,
  startTime: null,
};

const box = document.getElementById('box');
const boxMessage = document.getElementById('box-message');
const lastTimeEl = document.getElementById('last-time');
const personalBestEl = document.getElementById('personal-best');
const historyEl = document.getElementById('history');

const STATE_CLASSES = ['state-idle', 'state-waiting', 'state-go', 'state-result', 'state-early'];

function grade(ms) {
  if (ms < 180) return 'insane';
  if (ms < 250) return 'amazing';
  if (ms < 330) return 'great';
  if (ms < 450) return 'good';
  return 'keep trying';
}

function render() {
  STATE_CLASSES.forEach(c => box.classList.remove(c));
  box.classList.add('state-' + state.phase);

  switch (state.phase) {
    case 'idle':
      boxMessage.textContent = 'Click to start';
      break;
    case 'waiting':
      boxMessage.textContent = 'Wait for green…';
      break;
    case 'go':
      boxMessage.textContent = 'NOW!';
      break;
    case 'early':
      boxMessage.textContent = 'Too early!';
      break;
    case 'result': {
      const ms = state.reactionTime;
      boxMessage.textContent = ms + 'ms — ' + grade(ms);
      break;
    }
  }

  if (state.reactionTime !== null && state.phase === 'result') {
    lastTimeEl.textContent = 'Last: ' + state.reactionTime + 'ms · ' + grade(state.reactionTime);
  } else if (state.history.length > 0 && state.phase !== 'result') {
    const last = state.history[0];
    lastTimeEl.textContent = 'Last: ' + last + 'ms · ' + grade(last);
  } else {
    lastTimeEl.textContent = '';
  }

  personalBestEl.textContent = state.personalBest !== null
    ? 'Best: ' + state.personalBest + 'ms'
    : '';

  historyEl.innerHTML = '';
  state.history.forEach(ms => {
    const li = document.createElement('li');
    li.textContent = ms + 'ms';
    historyEl.appendChild(li);
  });
}

function startWaiting() {
  state.phase = 'waiting';
  state.reactionTime = null;
  const delay = Math.random() * 3000 + 1000;
  state.waitTimeout = setTimeout(triggerGo, delay);
  render();
}

function triggerGo() {
  state.waitTimeout = null;
  state.phase = 'go';
  state.startTime = performance.now();
  render();
}

function recordResult(ms) {
  state.history.unshift(ms);
  if (state.history.length > 5) state.history.length = 5;

  if (state.personalBest === null || ms < state.personalBest) {
    state.personalBest = ms;
    localStorage.setItem(LS_KEY, ms);
  }
}

function handleClick() {
  switch (state.phase) {
    case 'idle':
      startWaiting();
      break;

    case 'waiting':
      clearTimeout(state.waitTimeout);
      state.waitTimeout = null;
      state.phase = 'early';
      render();
      setTimeout(() => {
        state.phase = 'idle';
        render();
      }, 1200);
      break;

    case 'go': {
      const ms = Math.round(performance.now() - state.startTime);
      state.reactionTime = ms;
      state.phase = 'result';
      recordResult(ms);
      render();
      break;
    }

    case 'result':
      state.phase = 'idle';
      render();
      break;

    case 'early':
      break;
  }
}

box.addEventListener('click', handleClick);
box.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const stored = localStorage.getItem(LS_KEY);
  if (stored !== null) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) state.personalBest = parsed;
  }
  render();
});
