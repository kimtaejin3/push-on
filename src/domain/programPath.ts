import {DAYS_PER_WEEK, WEEKS} from '../constants/hundredPushups';
import {testThreshold, type ProgramRecord, type ProgramState} from './hundredPushups';

export type PathCellStatus = 'done' | 'today' | 'upcoming' | 'skipped';
export type PathTestStatus = 'none' | 'done' | 'current' | 'upcoming' | 'skipped';

export type PathWeek = {
  week: number;
  cells: {day: number; status: PathCellStatus}[];
  test: PathTestStatus;
};

export type ProgramPath = {passed: number; total: number; weeks: PathWeek[]};
export const PATH_TOTAL = 42;

export const programPath = (state: ProgramState, records: ProgramRecord[]): ProgramPath => {
  const earliestRecordedWeek = records.reduce(
    (earliest, record) =>
      record.kind === undefined || record.kind === 'test'
        ? Math.min(earliest, record.week)
        : earliest,
    Infinity,
  );
  const startWeek = earliestRecordedWeek === Infinity ? state.week : earliestRecordedWeek;
  const completed = state.status === 'completed';
  const passed = completed
    ? PATH_TOTAL
    : (state.week - 1) * DAYS_PER_WEEK + (state.testDue ? DAYS_PER_WEEK : state.day - 1);

  const weeks = Array.from({length: WEEKS}, (_, weekIndex): PathWeek => {
    const week = weekIndex + 1;
    const skipped = week < startWeek;
    const cells = Array.from({length: DAYS_PER_WEEK}, (__, dayIndex) => {
      const position = weekIndex * DAYS_PER_WEEK + dayIndex;
      let status: PathCellStatus = 'upcoming';
      if (skipped) {
        status = 'skipped';
      } else if (position < passed) {
        status = 'done';
      } else if (position === passed && !state.testDue) {
        status = 'today';
      }
      return {day: dayIndex + 1, status};
    });

    let test: PathTestStatus = 'none';
    if (testThreshold(week) !== null) {
      if (skipped) {
        test = 'skipped';
      } else if (completed || week < state.week) {
        test = 'done';
      } else if (week === state.week && state.testDue) {
        test = 'current';
      } else {
        test = 'upcoming';
      }
    }

    return {week, cells, test};
  });
  return {passed, total: PATH_TOTAL, weeks};
};
