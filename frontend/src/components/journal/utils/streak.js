export function calculateStreak(trades) {
  const sorted = [...trades].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (b.id || 0) - (a.id || 0);
  });
  let type = "none";
  let count = 0;
  for (let i = 0; i < sorted.length; i++) {
    const outcome = sorted[i].outcome;
    if (outcome === "Breakeven" || outcome === "Running") {
      break;
    }
    if (type === "none") {
      if (outcome === "Win" || outcome === "Loss") {
        type = outcome;
        count = 1;
      }
    } else {
      if (outcome === type) {
        count++;
      } else {
        break;
      }
    }
  }
  let consecutiveLosses = 0;
  for (let i = 0; i < sorted.length; i++) {
    const outcome = sorted[i].outcome;
    if (outcome === "Running" || outcome === "Breakeven") continue;
    if (outcome === "Loss") {
      consecutiveLosses++;
    } else if (outcome === "Win") {
      break;
    }
  }
  const chronological = [...trades].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || 0) - (b.id || 0);
  });
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  chronological.forEach((t) => {
    if (t.outcome === "Win") {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (t.outcome === "Loss") {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else if (t.outcome === "Breakeven") {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });
  return {
    type,
    count,
    consecutiveLosses,
    maxWinStreak,
    maxLossStreak
  };
}
