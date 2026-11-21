import React from 'react';
import {Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {WEEKS} from '../../../constants/hundredPushups';
import {ProgramRecord, ProgramState, testThreshold} from '../../../domain/hundredPushups';
import {cardStyles as styles} from './cardStyles';

interface ProgramTestCardProps {
  state: ProgramState;
  records: ProgramRecord[];
  onTest: () => void;
  onOpenTable: () => void;
}

/** 마지막 운동 시도(이동·테스트 표시 제외)가 오늘(기기 날짜)인지 */
const workedOutToday = (records: ProgramRecord[]): boolean => {
  const last = [...records].reverse().find(r => r.kind === undefined);
  return !!last && new Date(last.completed_at).toDateString() === new Date().toDateString();
};

/** 테스트 차례 카드: 통과 기준과, 오늘 이미 운동했으면 내일 이후에 재라는 권고를 보여준다 (막지는 않는다) */
function ProgramTestCard({state, records, onTest, onOpenTable}: ProgramTestCardProps) {
  const isFinal = state.week === WEEKS;
  const threshold = testThreshold(state.week);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{isFinal ? '최종 테스트' : `${state.week}주차 테스트`}</Text>
      <Text style={styles.body}>
        {isFinal
          ? `연속으로 몇 개까지 되는지 재요. ${threshold}개면 완료예요. 못 미치면 ${WEEKS}주차를 한 번 더 해요.`
          : `${threshold}개 이상이면 ${state.week + 1}주차로 넘어가요. ${threshold}개 미만이면 ${state.week}주차를 한 번 더 해요.`}
      </Text>
      {workedOutToday(records) ? (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>오늘은 이미 운동을 했어요</Text>
          <Text style={styles.hint}>
            지친 상태로 재면 기록이 낮게 나와 같은 주차를 반복하게 될 수 있어요. 내일 이후에 재는 걸 권해요.
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>오늘은 운동 대신 테스트하는 날이에요.</Text>
      )}
      <CustomButton title="최대 횟수 테스트" variant="start" style={styles.button} onPress={onTest} />
      <Text style={styles.link} onPress={onOpenTable}>
        전체 세트 보기 · 주차 바꾸기
      </Text>
    </View>
  );
}

export default ProgramTestCard;
