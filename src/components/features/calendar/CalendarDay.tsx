import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../../../constants/colors';
import {CalendarDay as CalendarDayType} from '../../../hooks/useCalendarData';
import {PushupDayData} from '../../../hooks/usePushupCalendarData';
import {useAtom} from 'jotai';
import {updateSelectedDateAtom} from '../../../atoms/date';

interface CalendarDayProps {
  day: CalendarDayType;
  pushupData?: PushupDayData;
}

const CalendarDay: React.FC<CalendarDayProps> = ({day, pushupData}) => {
  const {date, isCurrentMonth, isToday, isSelected, dayOfMonth} = day;
  const hasWorkout = pushupData?.hasWorkout || false;
  const [, updateSelectedDate] = useAtom(updateSelectedDateAtom);

  const getDayStyle = () => {
    if (!isCurrentMonth) {
      return styles.otherMonthDay;
    }
    if (isSelected) {
      return styles.selectedDay;
    }
    if (isToday) {
      return styles.todayDay;
    }
    return styles.normalDay;
  };

  const getTextStyle = () => {
    if (!isCurrentMonth) {
      return styles.otherMonthText;
    }
    if (isSelected) {
      return styles.selectedText;
    }
    if (isToday) {
      return styles.todayText;
    }
    return styles.normalText;
  };

  return (
    <TouchableOpacity
      style={[styles.dayContainer, getDayStyle()]}
      onPress={() => updateSelectedDate(date)}
      disabled={!isCurrentMonth}>
      <Text style={[styles.dayText, getTextStyle()]}>{dayOfMonth}</Text>

      {/* 푸쉬업 완료 표시 */}
      {hasWorkout && (
        <View style={styles.workoutIndicator}>
          <FontAwesome5
            name="check-circle"
            size={8}
            color={isSelected ? colors.textLight : colors.primary}
            iconStyle="solid"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    position: 'relative',
  },
  normalDay: {
    backgroundColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  todayDay: {
    backgroundColor: colors.primaryOverlay,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  otherMonthDay: {
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  normalText: {
    color: colors.textLight,
  },
  selectedText: {
    color: colors.textLight,
    fontWeight: 'bold',
  },
  todayText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: colors.textSecondary,
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
});

export default CalendarDay;
