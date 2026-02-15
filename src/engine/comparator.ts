import type { ComparisonResult, NoteStatus, TimingStatus, Melody, PlayedNote } from '../types';

/**
 * Compare played notes against target melody.
 *
 * Each note is scored individually by position: target[i] vs played[i].
 * - Correct: same pitch at same position
 * - Wrong: different pitch at that position
 * - Missing: no played note at that target position
 * - Extra: played note beyond target length
 *
 * When rhythm mode is on, timing accuracy is also scored for correct notes.
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

  // Position-by-position comparison
  const targetMarks: NoteStatus[] = [];
  const playedMarks: NoteStatus[] = [];
  const matchedPairs: [number, number][] = [];

  const len = Math.min(target.length, played.length);
  for (let i = 0; i < len; i++) {
    const match = targetMidi[i] === playedMidi[i];
    targetMarks.push(match ? 'correct' : 'wrong');
    playedMarks.push(match ? 'correct' : 'wrong');
    if (match) matchedPairs.push([i, i]);
  }

  // Remaining target positions (played too short)
  for (let i = len; i < target.length; i++) {
    targetMarks.push('missing');
  }

  // Remaining played positions (played too long)
  for (let i = len; i < played.length; i++) {
    playedMarks.push('extra');
  }

  const correctCount = matchedPairs.length;
  const pitchScore = Math.round((correctCount / target.length) * 100);

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
