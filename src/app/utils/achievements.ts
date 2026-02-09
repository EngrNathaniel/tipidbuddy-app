export const profileBackgrounds = {
  default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  bronze: 'linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)',
  silver: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
  gold: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
  platinum: 'linear-gradient(135deg, #e5e4e2 0%, #c0c0c0 100%)',
  diamond: 'linear-gradient(135deg, #b9f2ff 0%, #00d4ff 100%)',
  legendary: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
};

export const streakBadges = {
  fire: { emoji: '🔥', name: 'Fire', minStreak: 3 },
  rocket: { emoji: '🚀', name: 'Rocket', minStreak: 7 },
  star: { emoji: '⭐', name: 'Star', minStreak: 14 },
  trophy: { emoji: '🏆', name: 'Champion', minStreak: 30 },
  crown: { emoji: '👑', name: 'King', minStreak: 60 },
  gem: { emoji: '💎', name: 'Diamond', minStreak: 90 },
};

export function getBackgroundForRank(rank: number): string {
  if (rank === 1) return profileBackgrounds.gold;
  if (rank === 2) return profileBackgrounds.silver;
  if (rank === 3) return profileBackgrounds.bronze;
  return profileBackgrounds.default;
}

export function getBackgroundForTotalSavings(total: number): string {
  if (total >= 50000) return profileBackgrounds.legendary;
  if (total >= 20000) return profileBackgrounds.diamond;
  if (total >= 10000) return profileBackgrounds.platinum;
  if (total >= 5000) return profileBackgrounds.gold;
  if (total >= 2000) return profileBackgrounds.silver;
  if (total >= 500) return profileBackgrounds.bronze;
  return profileBackgrounds.default;
}

export function getStreakBadge(streak: number) {
  const badges = Object.values(streakBadges).reverse();
  return badges.find(badge => streak >= badge.minStreak) || null;
}

export function getAchievements(streak: number, totalSavings: number, rank: number) {
  const achievements = [];

  // Streak achievements
  const streakBadge = getStreakBadge(streak);
  if (streakBadge) {
    achievements.push({
      icon: streakBadge.emoji,
      name: `${streakBadge.name} Streak`,
      description: `${streak} days streak`,
    });
  }

  // Rank achievements
  if (rank === 1) {
    achievements.push({
      icon: '👑',
      name: 'Top Saver',
      description: 'Ranked #1 in the group',
    });
  } else if (rank === 2) {
    achievements.push({
      icon: '🥈',
      name: 'Silver Medal',
      description: 'Ranked #2 in the group',
    });
  } else if (rank === 3) {
    achievements.push({
      icon: '🥉',
      name: 'Bronze Medal',
      description: 'Ranked #3 in the group',
    });
  }

  // Savings milestones
  if (totalSavings >= 10000) {
    achievements.push({
      icon: '💰',
      name: '10K Club',
      description: 'Saved ₱10,000+',
    });
  } else if (totalSavings >= 5000) {
    achievements.push({
      icon: '💵',
      name: '5K Club',
      description: 'Saved ₱5,000+',
    });
  } else if (totalSavings >= 1000) {
    achievements.push({
      icon: '💸',
      name: '1K Club',
      description: 'Saved ₱1,000+',
    });
  }

  return achievements;
}
