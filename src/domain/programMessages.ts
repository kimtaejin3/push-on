import {WEEKS} from '../constants/hundredPushups';
import {completeDay, Level, Position, ProgramState, TestOutcome} from './hundredPushups';

/** 숫자 뒤 조사 "(으)로": 3(삼)만 받침이 있어 "으로" */
const ro = (level: Level): string => (level === 3 ? '으로' : '로');

const levelAdjusted = (prev: Level, level: Level): string =>
  prev === level ? '' : `. 이번 결과에 맞춰 레벨도 ${prev} → ${level}${ro(level)} 조정했어요`;

/** 테스트 결과 화면 문구: 횟수 + 그 결과가 뜻하는 바 */
export const testOutcomeMessage = (reps: number, outcome: TestOutcome): {title: string; body: string} => {
  const title = `${reps}개`;
  switch (outcome.kind) {
    case 'start':
      return {title, body: `${outcome.week}주차 레벨 ${outcome.level}${ro(outcome.level)} 시작해요`};
    case 'advance':
      return {title, body: `${outcome.week}주차 레벨 ${outcome.level}${ro(outcome.level)} 넘어가요`};
    case 'repeat':
      return {
        title,
        body:
          `${outcome.week + 1}주차 기준(${outcome.threshold}개)에 ${outcome.short}개 부족해요. ` +
          `${outcome.week}주차를 한 번 더 하고 다시 재요` +
          levelAdjusted(outcome.prevLevel, outcome.level),
      };
    case 'finalMiss':
      return {
        title,
        body:
          `100개까지 ${outcome.short}개 남았어요. ${WEEKS}주차를 한 번 더 해요` +
          levelAdjusted(outcome.prevLevel, outcome.level),
      };
    case 'completed':
      return {title, body: '연속 100개를 해냈어요'};
    case 'retest': {
      const {prevLevel, level} = outcome;
      if (level === prevLevel) {
        return {title, body: `레벨은 그대로 ${level}예요`};
      }
      return level > prevLevel
        ? {title, body: `이번 주 레벨이 ${prevLevel} → ${level}${ro(level)} 바뀌어요`}
        : {
            title,
            body: `이번 주 레벨이 ${prevLevel} → ${level}${ro(level)} 내려가요. 지금 기록에 맞는 세트로 바뀌어요`,
          };
    }
  }
};

/** 이 날을 통과한 "뒤" 할 일: "2주차 Day 3" | "2주차 테스트" | "최종 테스트" */
export const nextStepLabel = (state: ProgramState): string => {
  const next = completeDay(state);
  if (next.testDue) {
    return state.week === WEEKS ? '최종 테스트' : `${state.week}주차 테스트`;
  }
  return `${next.week}주차 Day ${next.day}`;
};

/** 하향 직후 한 번 보여주는 안내 */
export const downgradeNotice = (from: Position, to: Position): string =>
  from.week === to.week
    ? `레벨 ${from.level} → ${to.level}${ro(to.level)} 낮췄어요. 오늘 세트가 바뀌었어요`
    : `${to.week}주차 Day ${to.day}부터 다시 해요. ${from.week}주차는 조금 뒤에 다시 도전해요`;

/** 주차를 직접 고른 직후 한 번 보여주는 안내 */
export const jumpNotice = (to: Position): string =>
  `${to.week}주차 · 레벨 ${to.level} · Day ${to.day}부터 다시 진행해요`;
