import { initCanvas }  from './visual/canvas.js';
import { drawOcean }   from './visual/ocean.js';
import { Coral }       from './visual/coral.js';
import { Fish, Jellyfish } from './visual/creatures.js';
import { SporeParticles }  from './visual/particles.js';
import {
  loadData, saveData, addHabit, removeHabit,
  completeToday, isCompletedToday, saveNote,
} from './habits.js';
import { checkNewMilestone, getUnlockedMilestones } from './milestones.js';

// ── State ─────────────────────────────────────────────────────────────────────
let data      = loadData();
let corals    = {};          // { [habitId]: Coral }
let creatures = { fish: {}, jellyfishes: {} };
let particles = [];          // active SporeParticles, pruned when done
let dims      = { w: 0, h: 0 };
let currentT  = 0;

// ── Canvas loop ───────────────────────────────────────────────────────────────
initCanvas((ctx, w, h, t) => {
  currentT = t;
  if (dims.w !== w || dims.h !== h) {
    dims = { w, h };
    buildCorals(true);
    buildCreatures();
  }

  drawOcean(ctx, w, h, t);

  // Draw order: jellyfishes (background) → corals → fish → spore particles
  for (const jelly of Object.values(creatures.jellyfishes)) jelly.draw(ctx, t);
  for (const coral of Object.values(corals))               coral.draw(ctx, t);
  for (const fish  of Object.values(creatures.fish))       fish.draw(ctx, t);
  for (const p     of particles)                           p.draw(ctx, t);
  particles = particles.filter(p => !p.done);
});

// ── Coral management ──────────────────────────────────────────────────────────
let _firstBuild = true;

function buildCorals(stagger = false) {
  const isFirst = _firstBuild;
  _firstBuild   = false;
  const n       = data.habits.length;
  const next    = {};

  data.habits.forEach((habit, i) => {
    const x      = dims.w > 0 ? dims.w * ((i + 1) / (n + 1)) : 0;
    const baseY  = dims.h > 0 ? dims.h - 28 : 0;
    const exists = corals[habit.id];

    next[habit.id] = new Coral({
      id:          habit.id,
      color:       habit.color,
      completions: habit.completions.length,
      x,
      baseY,
      delay:       (isFirst && stagger) ? i * 150 : 0,
      instant:     !!exists,
    });
  });

  corals = next;
}

// ── Creature management ───────────────────────────────────────────────────────
function buildCreatures() {
  const next = { fish: {}, jellyfishes: {} };

  for (const habit of data.habits) {
    const coral      = corals[habit.id];
    if (!coral) continue;
    const milestones = getUnlockedMilestones(data, habit.id);

    if (milestones.includes('fish')) {
      next.fish[habit.id] = new Fish({
        id:          habit.id,
        coralX:      coral._baseX,
        coralBaseY:  coral._baseY,
        coralTopY:   coral.topY,
      });
    }
    if (milestones.includes('jellyfish')) {
      next.jellyfishes[habit.id] = new Jellyfish({
        id:      habit.id,
        canvasW: dims.w,
        canvasH: dims.h,
      });
    }
  }

  creatures = next;
}

// ── UI elements ───────────────────────────────────────────────────────────────
const bar    = document.getElementById('habit-bar');
const hint   = document.getElementById('empty-hint');
const addBtn = document.getElementById('add-btn');
const dialog = document.getElementById('add-dialog');
const input  = document.getElementById('habit-input');

const noteDialog      = document.getElementById('note-dialog');
const noteDialogHabit = document.getElementById('note-dialog-habit');
const noteTextarea    = document.getElementById('note-input');

const detailDialog      = document.getElementById('detail-dialog');
const detailDialogTitle = document.getElementById('detail-dialog-title');
const detailEntries     = document.getElementById('detail-entries');

let _pendingCheckId = null;

// ── Render habit chips ────────────────────────────────────────────────────────
function renderBar() {
  bar.innerHTML = '';
  if (data.habits.length === 0) {
    hint.style.display = 'block';
    hint.classList.add('pulse-hint');
    addBtn.classList.add('guide-pulse');
  } else {
    hint.style.display = 'none';
    hint.classList.remove('pulse-hint');
    addBtn.classList.remove('guide-pulse');
  }

  for (const habit of data.habits) {
    const done = isCompletedToday(habit);
    const chip = document.createElement('div');
    chip.className = 'habit-chip';
    // streak badge: only show when streak >= 1
    const streakBadge = habit.streak >= 1
      ? `<span class="chip-streak" title="連續 ${habit.streak} 天">🔥${habit.streak}</span>`
      : '';
    chip.innerHTML = `
      <span class="chip-name" data-id="${habit.id}" style="color:${habit.color}" title="點此查看打卡紀錄">${habit.name}</span>
      ${streakBadge}
      <button class="chip-check${done ? ' done' : ''}"
              data-id="${habit.id}"
              ${done ? 'disabled' : ''}
              aria-label="${done ? '已完成' : '打卡'}">
        ${done ? '✦' : '○'}
      </button>
      <button class="chip-del" data-id="${habit.id}" aria-label="刪除">×</button>
    `;
    bar.appendChild(chip);
  }
}

// ── Events: check-in + delete ─────────────────────────────────────────────────
bar.addEventListener('click', e => {
  const checkBtn = e.target.closest('.chip-check');
  const delBtn   = e.target.closest('.chip-del');
  const nameSpan = e.target.closest('.chip-name');

  if (nameSpan) {
    const id    = nameSpan.dataset.id;
    const habit = data.habits.find(h => h.id === id);
    if (habit) openDetailDialog(habit);
    return;
  }

  if (checkBtn && !checkBtn.disabled) {
    const id    = checkBtn.dataset.id;
    const habit = data.habits.find(h => h.id === id);
    if (habit && isCompletedToday(habit)) { renderBar(); return; }
    // Open note dialog; actual check-in happens in noteDialog 'close' handler
    _pendingCheckId = id;
    noteDialogHabit.textContent = habit.name;
    noteTextarea.value = '';
    noteDialog.returnValue = '';
    noteDialog.showModal();
    noteTextarea.focus();
    return;
  }

  if (delBtn) {
    const id = delBtn.dataset.id;
    const habitToDelete = data.habits.find(h => h.id === id);
    if (habitToDelete) {
      const days = habitToDelete.completions.length;
      const progressNote = days > 0
        ? `目前已累積 ${days} 天打卡，刪除後無法復原。`
        : '尚未打卡，刪除後無法復原。';
      const confirmed = confirm(`刪除「${habitToDelete.name}」？${progressNote}`);
      if (!confirmed) return;
    }
    removeHabit(data, id);
    buildCorals(false);
    buildCreatures();
    renderBar();
  }
});

// ── Note dialog: complete check-in after user optionally writes a note ────────
noteDialog.addEventListener('close', () => {
  const id = _pendingCheckId;
  _pendingCheckId = null;
  // returnValue '' means ESC / cancelled; 'skip' or 'ok' both proceed
  if (!id || noteDialog.returnValue === '') return;

  const habit = data.habits.find(h => h.id === id);
  const note  = noteDialog.returnValue === 'ok' ? noteTextarea.value.trim() : '';

  if (completeToday(data, id, note)) {
    corals[id]?.growOne(currentT);
    const mType = checkNewMilestone(data, habit);
    if (mType) {
      data.milestones.push({
        habitId:    id,
        type:       mType,
        unlockedAt: new Date().toISOString().slice(0, 10),
      });
      saveData(data);
      if (mType === 'fish' || mType === 'jellyfish') buildCreatures();
      if (mType === 'jellyfish') {
        const coral = corals[id];
        if (coral) {
          particles.push(new SporeParticles({
            x:     coral._baseX,
            y:     coral.topY,
            color: habit.color,
          }));
        }
      }
    }
    renderBar();
  }
});

// ── Detail dialog: view + edit notes for all completed days ──────────────────
function _fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${y}年${m}月${d}日（週${days[new Date(dateStr).getDay()]}）`;
}

function openDetailDialog(habit) {
  detailDialogTitle.textContent = habit.name;
  detailDialogTitle.style.color = habit.color;

  const sorted = [...habit.completions].sort().reverse();
  if (sorted.length === 0) {
    detailEntries.innerHTML = '';
  } else {
    detailEntries.innerHTML = sorted.map(date => {
      const note = (habit.notes || {})[date] || '';
      return `
        <div class="detail-entry" data-date="${date}" data-habit-id="${habit.id}">
          <span class="detail-date">${_fmtDate(date)}</span>
          <textarea class="detail-note" placeholder="記錄當天狀況…" maxlength="200" rows="2">${note}</textarea>
        </div>`;
    }).join('');

    detailEntries.querySelectorAll('.detail-note').forEach(ta => {
      ta.addEventListener('blur', e => {
        const entry   = e.target.closest('.detail-entry');
        const habitId = entry.dataset.habitId;
        const date    = entry.dataset.date;
        saveNote(data, habitId, date, e.target.value);
        // Sync in-memory habit.notes so re-opens show updated value
        const h = data.habits.find(x => x.id === habitId);
        if (h) {
          if (e.target.value.trim()) h.notes[date] = e.target.value.trim();
          else delete h.notes[date];
        }
      });
    });
  }

  detailDialog.showModal();
}

// ── Canvas click: click a coral to open its detail dialog ────────────────────
document.getElementById('ocean').addEventListener('click', e => {
  const rect = e.target.getBoundingClientRect();
  const cx   = e.clientX - rect.left;
  const cy   = e.clientY - rect.top;
  const THRESHOLD = 60;

  let closest = null, minDist = Infinity;
  for (const [id, coral] of Object.entries(corals)) {
    const dx = Math.abs(coral._baseX - cx);
    if (dx < THRESHOLD && dx < minDist) { minDist = dx; closest = id; }
  }

  if (closest) {
    const habit = data.habits.find(h => h.id === closest);
    if (habit) openDetailDialog(habit);
  }
});

// ── Events: add habit dialog ──────────────────────────────────────────────────
addBtn.addEventListener('click', () => {
  input.value = '';
  dialog.showModal();
  input.focus();
});

let _dialogSubmitted = false;
dialog.querySelector('form').addEventListener('submit', () => {
  _dialogSubmitted = true;
});
dialog.addEventListener('close', () => {
  if (!_dialogSubmitted) { _dialogSubmitted = false; return; }
  _dialogSubmitted = false;
  const name = input.value.trim();
  if (!name) return;
  // Guard: reject duplicate habit names (case-insensitive)
  const duplicate = data.habits.find(h => h.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    // Brief shake feedback on the dialog — re-open with a warning
    input.value = name;
    requestAnimationFrame(() => {
      dialog.showModal();
      input.focus();
      input.select();
      // Inline warning below input (idempotent — only one warning at a time)
      let warning = dialog.querySelector('.dup-warning');
      if (!warning) {
        warning = document.createElement('p');
        warning.className = 'dup-warning';
        warning.style.cssText = 'color:rgba(232,120,90,0.9);font-size:12px;margin-top:-0.4rem;';
        input.insertAdjacentElement('afterend', warning);
      }
      warning.textContent = '已有同名習慣，請換一個名字。';
    });
    return;
  }
  addHabit(data, name);
  buildCorals(false);
  buildCreatures();
  renderBar();
});

// ── Date display ─────────────────────────────────────────────────────────────
const dateEl = document.getElementById('date-display');
function renderDate() {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  dateEl.textContent =
    `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日　週${weekdays[now.getDay()]}`;
}
renderDate();
// refresh at midnight
const msToMidnight = () => {
  const n = new Date();
  return (new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n);
};
setTimeout(function tick() {
  renderDate();
  setTimeout(tick, msToMidnight());
}, msToMidnight());

// ── Init ──────────────────────────────────────────────────────────────────────
renderBar();
// buildCorals + buildCreatures called on first canvas frame (real dims available then)
