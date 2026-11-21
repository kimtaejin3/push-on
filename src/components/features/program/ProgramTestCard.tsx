import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card} from '../../ui/Card';
import {Chip} from '../../ui/Chip';
import {Text} from '../../ui/Text';
import {WEEKS} from '../../../constants/hundredPushups';
import {
  ProgramRecord,
  ProgramState,
  testThreshold,
} from '../../../domain/hundredPushups';
import {cardStyles as styles} from './cardStyles';

interface ProgramTestCardProps {
  state: ProgramState;
  records: ProgramRecord[];
  now: Date;
}

/** 마지막 운동 시도(이동·테스트 표시 제외)가 오늘(기기 날짜)인지 */
const workedOutToday = (records: ProgramRecord[], now: Date): boolean => {
  const last = [...records].reverse().find(r => r.kind === undefined);
  return (
    !!last && new Date(last.completed_at).toDateString() === now.toDateString()
  );
};

/** 테스트 차례 카드: 통과 기준과, 오늘 이미 운동했으면 내일 이후에 재라는 권고를 보여준다 (막지는 않는다) */
function ProgramTestCard({state, records, now}: ProgramTestCardProps) {
  const isFinal = state.week === WEEKS;
  const threshold = testThreshold(state.week);
  return (
    <Card>
      <View style={local.chip}>
        <Chip label="테스트 차례" tone="record" />
      </View>
      <Text variant="headline">
        {isFinal ? '최종 테스트' : `${state.week}주차 테스트`}
      </Text>
      <Text color="textMuted">
        {isFinal
          ? `연속으로 몇 개까지 되는지 재요. ${threshold}개면 완료예요. 못 미치면 ${WEEKS}주차를 한 번 더 해요.`
          : `${threshold}개 이상이면 ${
              state.week + 1
            }주차로 넘어가요. ${threshold}개 미만이면 ${
              state.week
            }주차를 한 번 더 해요.`}
      </Text>
      {workedOutToday(records, now) ? (
        <View style={styles.callout}>
          <Text variant="label" weight={700}>
            오늘은 이미 운동을 했어요
          </Text>
          <Text variant="caption" color="textMuted">
            지친 상태로 재면 기록이 낮게 나와 같은 주차를 반복하게 될 수 있어요.
            내일 이후에 재는 걸 권해요.
          </Text>
        </View>
      ) : (
        <Text variant="caption" color="textMuted">
          오늘은 운동 대신 테스트하는 날이에요.
        </Text>
      )}
    </Card>
  );
}

const local = StyleSheet.create({
  chip: {alignSelf: 'flex-start'},
});

export default ProgramTestCard;
