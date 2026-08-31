import {startOfWeek, addDays, buildWeekDays, weekRangeLabel} from '../../src/utils/calendar';

describe('startOfWeek', () => {
  it('일요일 시작 주의 첫날을 돌려준다', () => {
    // 2026-08-26 은 수요일 → 그 주 일요일은 8/23
    expect(startOfWeek(new Date(2026, 7, 26)).getDate()).toBe(23);
    // 일요일이면 그대로
    expect(startOfWeek(new Date(2026, 7, 23)).getDate()).toBe(23);
  });
});

describe('addDays', () => {
  it('일수를 더하고 원본은 건드리지 않는다', () => {
    const d = new Date(2026, 7, 30);
    expect(addDays(d, 7).getDate()).toBe(6); // 9/6
    expect(addDays(d, 7).getMonth()).toBe(8);
    expect(d.getDate()).toBe(30);
  });
});

describe('buildWeekDays', () => {
  it('선택 날짜가 속한 주의 7일을 만든다', () => {
    const days = buildWeekDays(new Date(2026, 7, 26), new Date(2026, 7, 30));
    expect(days).toHaveLength(7);
    expect(days[0].date.getDate()).toBe(23);
    expect(days[6].date.getDate()).toBe(29);
    expect(days.filter(d => d.isSelected)).toHaveLength(1);
    expect(days[3].isSelected).toBe(true); // 8/26
    expect(days.every(d => d.isCurrentMonth)).toBe(true); // 주 뷰에선 흐리게 하지 않음
  });

  it('오늘 표시를 넣는다', () => {
    const days = buildWeekDays(new Date(2026, 7, 26), new Date(2026, 7, 24));
    expect(days[1].isToday).toBe(true); // 8/24 월요일
  });
});

describe('weekRangeLabel', () => {
  it('같은 달이면 "8월 23일 - 29일"', () => {
    expect(weekRangeLabel(new Date(2026, 7, 23))).toBe('8월 23일 - 29일');
  });
  it('달이 걸치면 "8월 30일 - 9월 5일"', () => {
    expect(weekRangeLabel(new Date(2026, 7, 30))).toBe('8월 30일 - 9월 5일');
  });
});
