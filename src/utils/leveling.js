export const calculateLevel = (totalXp) => {
  // Level 1: 0-500 XP, Level 2: 501-1500 XP, etc.
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(level, 2) * 100;
  
  return {
    level,
    progress: ((totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
  };
};