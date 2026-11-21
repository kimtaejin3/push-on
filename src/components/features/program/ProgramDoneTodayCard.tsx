import React from 'react';
import {Text, View} from 'react-native';
import {describeSets, ProgramState, todayPlan} from '../../../domain/hundredPushups';
import {cardStyles as styles} from './cardStyles';

interface ProgramDoneTodayCardProps {
  kind: 'doneWorkout' | 'doneTest';
  next: ProgramState; // 내일 할 위치 (현재 상태)
  onStartEarly: () => void; // "미리 하기"
  onOpenTable: () => void;
}

/**
 * 오늘 할 일을 마친 날의 카드. 하루에 하루치가 기본이라 주 버튼은 두지 않고,
 * 밀린 날을 따라잡고 싶은 사람을 위해 작은 링크로만 다음 Day 를 미리 할 수 있게 한다.
 */
function ProgramDoneTodayCard({kind, next, onStartEarly, onOpenTable}: ProgramDoneTodayCardProps) {
  const plan = todayPlan(next);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{kind === 'doneWorkout' ? '오늘 운동 완료' : '오늘은 테스트를 했어요'}</Text>
      <Text style={styles.body}>내일 이어서 해요</Text>

      <Text style={styles.emphasis}>
        내일 {next.week}주차 · Day {next.day} · 레벨 {next.level}
      </Text>
      <Text style={styles.sets}>{describeSets(plan.sets, plan.lastIsMax)}</Text>

      <Text style={styles.link} onPress={onStartEarly}>
        미리 하기
      </Text>
      <Text style={styles.link} onPress={onOpenTable}>
        전체 세트 보기 · 주차 바꾸기
      </Text>
    </View>
  );
}

export default ProgramDoneTodayCard;
