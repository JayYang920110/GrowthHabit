// Pure functions — no localStorage side effects.
// Callers are responsible for saving after unlocking.

const TYPES = { 7: 'fish', 30: 'jellyfish', 100: 'atlantis' };

// Returns the milestone type to unlock, or null if nothing new.
export function checkNewMilestone(data, habit) {
  const type = TYPES[habit.streak];
  if (!type) return null;
  const alreadyUnlocked = data.milestones.some(
    m => m.habitId === habit.id && m.type === type
  );
  return alreadyUnlocked ? null : type;
}

export function getUnlockedMilestones(data, habitId) {
  return data.milestones
    .filter(m => m.habitId === habitId)
    .map(m => m.type);
}
