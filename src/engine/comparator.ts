import type { ComparisonResult, NoteStatus, TimingStatus, Melody, PlayedNote } from '../types';

/**
 * Compare played notes against target melody.
 *
 * Pitch scoring uses Longest Common Subsequence (LCS):
 * - Score = (LCS length / target length) * 100
 * - Target notes in the LCS are marked "correct", others "missing"
 * - Played notes in the LCS are marked "correct", others "extra"/"wrong"
 *
 * When rhythm mode is on, timing accuracy is also scored for pitch-matched notes.
 */
export function compareMelodies(
  target: Melody,
  played: PlayedNote[],
  options?: { rhythmMode: boolean; tempo: number },
): ComparisonResult {
  const targetMidi = target.map((n) => n.midi);
  const playedMidi = played.map((n) => n.midi);

  if (target.length === 0) {
    return {
      score: played.length === 0 ? 100 : 0,
      pitchScore: played.length === 0 ? 100 : 0,
      targetMarks: [],
      playedMarks: played.map(() => 'extra'),
    };
  }

  if (played.length === 0) {
    return {
      score: 0,
      pitchScore: 0,
      targetMarks: target.map(() => 'missing'),
      playedMarks: [],
    };
  }

  // Build LCS table
  const m = target.length;
  const n = played.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (targetMidi[i - 1] === playedMidi[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find which positions are part of the LCS
  const targetInLCS = new Set<number>();
  const playedInLCS = new Set<number>();
  // Store matched pairs for rhythm scoring: [targetIndex, playedIndex]
  const matchedPairs: [number, number][] = [];

  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (targetMidi[i - 1] === playedMidi[j - 1]) {
      targetInLCS.add(i - 1);
      playedInLCS.add(j - 1);
      matchedPairs.push([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  matchedPairs.reverse(); // put in forward order

  const lcsLength = dp[m][n];
  const pitchScore = Math.round((lcsLength / m) * 100);

  // Mark target notes
  const targetMarks: NoteStatus[] = targetMidi.map((_, idx) =>
    targetInLCS.has(idx) ? 'correct' : 'missing',
  );

  // Mark played notes
  const playedMarks: NoteStatus[] = playedMidi.map((note, idx) => {
    if (playedInLCS.has(idx)) return 'correct';
    if (targetMidi.includes(note)) return 'wrong';
    return 'extra';
  });

  // If rhythm mode is off, return pitch-only result
  if (!options?.rhythmMode || !options?.tempo) {
    return { score: pitchScore, pitchScore, targetMarks, playedMarks };
  }

  // --- Rhythm scoring ---
  const tempo = options.tempo;
  const beatDurationSec = 60 / tempo;

  // Compute expected onset times from cumulative durations
  const expectedOnsets: number[] = [];
  let beatOffset = 0;
  for (const note of target) {
    expectedOnsets.push(beatOffset * beatDurationSec);
    beatOffset += note.duration ?? 1;
  }

  // Tolerance thresholds in seconds
  const GOOD_TOLERANCE = 0.1;  // 100ms
  const OK_TOLERANCE = 0.2;    // 200ms

  // Score rhythm for matched notes and build timing marks
  const timingMarks: TimingStatus[] = target.map(() => 'on-time'); // default
  let rhythmTotal = 0;
  let rhythmMatched = 0;

  for (const [targetIdx, playedIdx] of matchedPairs) {
    const expectedTime = expectedOnsets[targetIdx];
    const actualTime = played[playedIdx].time;
    const error = actualTime - expectedTime;
    const absError = Math.abs(error);

    if (absError <= GOOD_TOLERANCE) {
      rhythmTotal += 100;
      timingMarks[targetIdx] = 'on-time';
    } else if (absError <= OK_TOLERANCE) {
      rhythmTotal += 50;
      timingMarks[targetIdx] = error < 0 ? 'early' : 'late';
    } else {
      rhythmTotal += 0;
      timingMarks[targetIdx] = error < 0 ? 'early' : 'late';
    }
    rhythmMatched++;
  }

  const rhythmScore = rhythmMatched > 0
    ? Math.round(rhythmTotal / rhythmMatched)
    : 0;

  // Combined score: 60% pitch + 40% rhythm
  const combinedScore = Math.round(0.6 * pitchScore + 0.4 * rhythmScore);

  return {
    score: combinedScore,
    pitchScore,
    rhythmScore,
    targetMarks,
    playedMarks,
    timingMarks,
  };
}
