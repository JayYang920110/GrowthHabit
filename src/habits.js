const KEY     = 'growthhabit_data';
const PALETTE = ['#E8785A', '#B068C8', '#E878A8', '#50B8E8', '#68C8A0'];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function loadData() {
  try {
    const raw  = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : { habits: [], milestones: [] };
    for (const h of data.habits) {
      if (!h.notes) h.notes = {};
      h.streak = _calcStreak(h.completions);
    }
    return data;
  } catch {
    return { habits: [], milestones: [] };
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function addHabit(data, name) {
  const habit = {
    id:          crypto.randomUUID(),
    name:        name.trim(),
    color:       PALETTE[data.habits.length % PALETTE.length],
    createdAt:   today(),
    completions: [],
    notes:       {},
    streak:      0,
  };
  data.habits.push(habit);
  saveData(data);
  return habit;
}

export function removeHabit(data, id) {
  data.habits     = data.habits.filter(h => h.id !== id);
  data.milestones = data.milestones.filter(m => m.habitId !== id);
  saveData(data);
}

// Returns true if the check-in succeeded (false = already done today)
export function completeToday(data, id, note = '') {
  const habit = data.habits.find(h => h.id === id);
  if (!habit) return false;
  const t = today();
  if (habit.completions.includes(t)) return false;
  habit.completions.push(t);
  habit.streak = _calcStreak(habit.completions);
  if (!habit.notes) habit.notes = {};
  if (note) habit.notes[t] = note;
  saveData(data);
  return true;
}

export function saveNote(data, id, date, noteText) {
  const habit = data.habits.find(h => h.id === id);
  if (!habit) return;
  if (!habit.notes) habit.notes = {};
  if (noteText.trim()) habit.notes[date] = noteText.trim();
  else delete habit.notes[date];
  saveData(data);
}

export function isCompletedToday(habit) {
  return habit.completions.includes(today());
}

function _calcStreak(completions) {
  if (!completions.length) return 0;
  const sorted = [...new Set(completions)].sort();
  const last   = sorted[sorted.length - 1];
  // Streak is dead if last completion was more than 1 day ago
  if (_daysBetween(last, today()) > 1) return 0;
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (_daysBetween(sorted[i - 1], sorted[i]) === 1) streak++;
    else break;
  }
  return streak;
}

function _daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
