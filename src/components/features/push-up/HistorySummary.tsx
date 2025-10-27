import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../../../constants/colors';
import {useQuery} from '@tanstack/react-query';
import {pushUpSetsByDateQueryOptions} from '../../../tanstack-query';
import {selectedDateAtom} from '../../../atoms/date';
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
    prefix: '초',
  },
];

function HistorySummary() {
  const [selectedDate] = useAtom(selectedDateAtom);

  return (
    <View style={styles.historySummary}>
      {historySummaryItems.map((item, index) => (
        <View style={styles.historySummaryItem} key={index}>
          <Text style={styles.historySummaryTitle}>{item.label}</Text>
          <Text style={styles.historySummaryText}>
            <HistoryValue type={item.type} selectedDate={selectedDate} />
            {item.prefix}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HistoryValue({
  type,
  selectedDate,
}: {
  type: (typeof historySummaryItems)[number]['type'];
  selectedDate: Date;
}) {
  const {data, isLoading} = useQuery(
    pushUpSetsByDateQueryOptions(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate(),
    ),
  );

  if (isLoading || !data) {
    return <Text>-</Text>;
  }

  const totalReps = data.reduce((acc, item) => acc + item.reps, 0);
  const totalSets = data.length;
  const totalDuration = data.reduce(
    (acc, item) => acc + item.duration_seconds,
    0,
  );

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
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    color: colors.textLight,
  },
});

export default HistorySummary;
