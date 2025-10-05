import React, {Suspense} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../../../constants/colors';
import {useSuspenseQuery} from '@tanstack/react-query';
import {pushUpSetsByDateQueryOptions} from '../../../queryOptions/pushup';
import {selectedDateAtom} from '../../../atoms/statistics';
import {useAtom} from 'jotai';

const historySummaryItems = [
  {
    type: 'reps',
    label: '푸쉬업 수',
    prefix: '번',
  },
  {
    type: 'sets',
    label: '총 세트 수',
    prefix: '세트',
  },
  {
    type: 'duration',
    label: '총 시간',
    prefix: '분',
  },
];

function HistorySummary() {
  return (
    <View style={styles.historySummary}>
      {/* <View style={styles.historySummaryItem}>
        <View>
          <Text style={styles.historySummaryTitle}>푸쉬업 수</Text>
          <Text style={styles.historySummaryText}>{totalReps}번</Text>
        </View>
      </View>
      <View style={styles.historySummaryItem}>
        <Text style={styles.historySummaryTitle}>총 세트 수</Text>
        <Text style={styles.historySummaryText}>{totalSets}세트</Text>
      </View>
      <View style={styles.historySummaryItem}>
        <Text style={styles.historySummaryTitle}>총 시간</Text>
        <Text style={styles.historySummaryText}>{totalDuration}</Text>
      </View> */}
      {historySummaryItems.map((item, index) => (
        <View style={styles.historySummaryItem} key={index}>
          <Text style={styles.historySummaryTitle}>{item.label}</Text>
          <Text style={styles.historySummaryText}>
            <Suspense fallback={<Text>-</Text>}>
              <HistoryValue type={item.type} />
            </Suspense>
            {item.prefix}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HistoryValue({
  type,
}: {
  type: (typeof historySummaryItems)[number]['type'];
}) {
  const [selectedDate] = useAtom(selectedDateAtom);
  const {data} = useSuspenseQuery(
    pushUpSetsByDateQueryOptions(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate(),
    ),
  );

  const totalReps = data.reduce((acc, item) => acc + item.reps, 0);
  const totalSets = data.length;
  const totalDuration = data.reduce(
    (acc, item) => acc + item.duration_seconds,
    0,
  );

  console.log('totalReps', totalReps);
  console.log('totalSets', totalSets);
  console.log('totalDuration', totalDuration);

  return (
    <Text style={styles.historySummaryText}>
      {(() => {
        if (type === 'reps') {
          return totalReps.toString();
        }
        if (type === 'sets') {
          return totalSets.toString();
        }
        if (type === 'duration') {
          return totalDuration.toString();
        }
      })()}
    </Text>
  );
}

const styles = StyleSheet.create({
  historySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.gray900,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historySummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  historySummaryTitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 4,
    fontWeight: '500',
  },
  historySummaryText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HistorySummary;
