import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ArrowUp} from 'lucide-react-native';
import {addDays} from '../../../domain/streak';
import {color, radius, space} from '../../../theme';
import {Text} from '../../ui/Text';

const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

export type CalendarActivity = {
  total: number;
  pending: boolean;
};

interface Props {
  monthStart: string;
  monthEnd: string;
  today: string;
  joined: string;
  activity: Map<string, CalendarActivity>;
  bestDate?: string;
  onSelectDate: (date: string) => void;
}

export function DotCalendar({
  monthStart,
  monthEnd,
  today,
  joined,
  activity,
  bestDate,
  onSelectDate,
}: Props) {
  const offset = (new Date(monthStart).getUTCDay() + 6) % 7;
  const rowCount = Math.ceil((offset + Number(monthEnd.slice(-2))) / 7);
  const maxTotal = Math.max(1, ...[...activity.values()].map(day => day.total));

  return (
    <View style={styles.calendar}>
      <View style={styles.row}>
        {weekdays.map(day => (
          <Text
            key={day}
            variant="caption"
            weight={600}
            color="textMuted"
            style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      {Array.from({length: rowCount}, (_, row) => (
        <View key={row} style={styles.row}>
          {weekdays.map((dayName, column) => {
            const date = addDays(monthStart, row * 7 + column - offset);
            if (date < monthStart || date > monthEnd) {
              return <View key={date} style={styles.cell} />;
            }

            const day = activity.get(date);
            const isToday = date === today;
            const isBest = date === bestDate;
            const unavailable = date > today || date < joined;
            const size = day ? 7 + (17 * day.total) / maxTotal : 0;
            const dayNumber = Number(date.slice(-2));
            const dateLabel = `${Number(
              date.slice(5, 7),
            )}월 ${dayNumber}일 ${dayName}요일`;
            const details = [
              dateLabel,
              isToday && '오늘',
              day && `${day.total}개`,
              isBest && '개인 최고',
              day?.pending && '저장 대기',
            ]
              .filter(Boolean)
              .join(', ');

            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={details}
                onPress={() => onSelectDate(date)}
                style={styles.cell}>
                <Text
                  variant="caption"
                  weight={isToday ? 800 : 500}
                  color={unavailable ? 'textMuted' : 'text'}
                  style={styles.date}>
                  {dayNumber}
                </Text>
                <View style={[styles.dotBox, isToday && styles.today]}>
                  {day ? (
                    <View
                      style={[
                        styles.dot,
                        {width: size, height: size},
                        isBest && styles.record,
                      ]}
                    />
                  ) : null}
                  {day?.pending ? (
                    <View style={styles.pendingBadge}>
                      <ArrowUp
                        size={9}
                        color={color.onAccent}
                        accessible={false}
                      />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      {activity.size > 0 ? (
        <View style={styles.legend}>
          <Text variant="caption" weight={600} color="textMuted">
            점이 클수록 많이 했어요
          </Text>
          {[7, 14, 22].map(size => (
            <View
              key={size}
              style={[styles.dot, {width: size, height: size}]}
            />
          ))}
          <View style={styles.legendRecord}>
            <View style={styles.recordDot} />
            <Text variant="caption" weight={600} color="textMuted">
              개인 최고
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {gap: space[4]},
  row: {flexDirection: 'row'},
  weekday: {flex: 1, textAlign: 'center'},
  cell: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    paddingTop: space[4],
    gap: 3,
  },
  date: {fontSize: 12, lineHeight: 16},
  dotBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {borderRadius: radius.pill, borderColor: color.active, borderWidth: 2},
  dot: {backgroundColor: color.activeFill, borderRadius: radius.pill},
  record: {backgroundColor: color.record},
  pendingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: color.record,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[12],
    paddingTop: space[8],
    minHeight: 64,
  },
  legendRecord: {flexDirection: 'row', alignItems: 'center', gap: space[4]},
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: color.record,
  },
});
