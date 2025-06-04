import { loadStatistics, markZenRespawnUsed, resetStatistics } from '../js/statistics.js';

describe('Statistics utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStatistics();
  });

  test('loadStatistics returns defaults when localStorage is empty', () => {
    const stats = loadStatistics();
    expect(stats.games.played).toBe(0);
    expect(stats.games.won).toBe(0);
    expect(stats.zenProgress.currentRun.level).toBe(1);
    expect(stats.zenProgress.currentRun.usedRespawns).toBe(false);
  });

  test('markZenRespawnUsed sets flag in current run', () => {
    markZenRespawnUsed();
    const stats = loadStatistics();
    expect(stats.zenProgress.currentRun.usedRespawns).toBe(true);
  });
});
