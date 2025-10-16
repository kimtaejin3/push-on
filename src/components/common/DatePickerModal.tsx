import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../../constants/colors';
import {useQuery} from '@tanstack/react-query';
import {profileQueryOptions} from '../../tanstack-query';
import {useAuth} from '../../hooks/useAuth';
import CustomButton from './CustomButton';
import {
  CURRENT_YEAR,
  CURRENT_MONTH,
  CURRENT_DATE,
} from '../../atoms/statistics';

type MonthPickerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onChangeSelectedDate: (date: Date) => void;
};

function createMonthNames({
  selectedYear,
  signedUpYear,
  signedUpMonth,
}: {
  selectedYear: number;
  signedUpYear: number;
  signedUpMonth: number;
}) {
  if (selectedYear === signedUpYear) {
    if (CURRENT_YEAR === selectedYear) {
      return Array.from(
        {length: CURRENT_MONTH - signedUpMonth + 1},
        (_, index) => signedUpMonth + index,
      );
    }

    return Array.from(
      {length: 12 - signedUpMonth + 1},
      (_, index) => signedUpMonth + index,
    );
  }

  if (CURRENT_YEAR === selectedYear) {
    return Array.from({length: CURRENT_MONTH}, (_, index) => index + 1);
  }

  return Array.from({length: 12}, (_, index) => index + 1);
}

function createDateNames({
  selectedYear,
  selectedMonth,
  signedUpDate,
  signedUpYear,
  signedUpMonth,
}: {
  selectedYear: number;
  selectedMonth: number;
  signedUpDate: number;
  signedUpYear: number;
  signedUpMonth: number;
}) {
  if (signedUpYear === selectedYear && signedUpMonth === selectedMonth) {
    if (CURRENT_YEAR === selectedYear && CURRENT_MONTH === selectedMonth) {
      return Array.from(
        {length: CURRENT_DATE - signedUpDate + 1},
        (_, index) => index + signedUpDate,
      );
    }

    return Array.from(
      {
        length:
          new Date(selectedYear, selectedMonth, 0).getDate() - signedUpDate + 1,
      },
      (_, index) => index + signedUpDate,
    );
  }

  if (CURRENT_YEAR === selectedYear && CURRENT_MONTH === selectedMonth) {
    return Array.from({length: CURRENT_DATE}, (_, index) => index + 1);
  }

  return Array.from(
    {
      length: new Date(selectedYear, selectedMonth, 0).getDate(),
    },
    (_, index) => index + 1,
  );
}

const DatePickerModal: React.FC<MonthPickerModalProps> = ({
  isVisible,
  onClose,
  onChangeSelectedDate,
}) => {
  const {user} = useAuth();
  const {data: profile} = useQuery({
    ...profileQueryOptions(user?.id || ''),
    enabled: user !== null,
  });
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const SIGNED_UP_YEAR = new Date(profile?.created_at || '').getFullYear();
  const SIGNED_UP_MONTH = new Date(profile?.created_at || '').getMonth() + 1;
  const SIGNED_UP_DATE = new Date(profile?.created_at || '').getDate();

  const MONTH_NAMES = createMonthNames({
    selectedYear,
    signedUpYear: SIGNED_UP_YEAR,
    signedUpMonth: SIGNED_UP_MONTH,
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.yearSelector}>
            <TouchableOpacity
              style={styles.yearButton}
              disabled={selectedYear - 1 < SIGNED_UP_YEAR}
              onPress={() => setSelectedYear(selectedYear - 1)}>
              <Fontawesome5
                name="chevron-left"
                iconStyle="solid"
                size={16}
                color={
                  selectedYear - 1 < SIGNED_UP_YEAR
                    ? colors.gray900
                    : colors.primary
                }
              />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}년</Text>
            <TouchableOpacity
              style={styles.yearButton}
              disabled={selectedYear + 1 > CURRENT_YEAR}
              onPress={() => setSelectedYear(selectedYear + 1)}>
              <Fontawesome5
                name="chevron-right"
                iconStyle="solid"
                size={16}
                color={
                  selectedYear + 1 > CURRENT_YEAR
                    ? colors.gray900
                    : colors.primary
                }
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.selectorTitle}>월 선택</Text>
          <FlatList
            data={MONTH_NAMES}
            numColumns={3}
            renderItem={({item}) => {
              const isSelected = selectedMonth === item;

              return (
                <TouchableOpacity
                  onPress={() => setSelectedMonth(item)}
                  style={[
                    styles.monthItem,
                    isSelected && styles.selectedMonthItem,
                  ]}>
                  <Text
                    style={[
                      styles.monthItemText,
                      isSelected && styles.selectedMonthItemText,
                    ]}>
                    {item}월
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(_, index) => index.toString()}
          />

          {selectedMonth && (
            <View style={styles.dateSelector}>
              <Text style={styles.selectorTitle}>일 선택</Text>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}>
                {createDateNames({
                  selectedYear,
                  selectedMonth,
                  signedUpDate: SIGNED_UP_DATE,
                  signedUpYear: SIGNED_UP_YEAR,
                  signedUpMonth: SIGNED_UP_MONTH,
                }).map(item => (
                  <DateItem
                    item={item}
                    key={item}
                    isSelected={selectedDate === item}
                    onPress={() => setSelectedDate(item)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <CustomButton
            variant="default"
            style={styles.confirmButton}
            title="확인"
            onPress={() => {
              if (selectedDate && selectedMonth && selectedYear) {
                onChangeSelectedDate(
                  new Date(selectedYear, selectedMonth - 1, selectedDate),
                );
              }
              onClose();
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

function DateItem({
  item,
  isSelected,
  onPress,
}: {
  item: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.dateItem, isSelected && styles.selectedDateItem]}>
      <Text
        style={[
          styles.dateItemText,
          isSelected && styles.selectedDateItemText,
        ]}>
        {item}일
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  monthItem: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMonthItem: {
    backgroundColor: colors.overlayLight,
    borderRadius: 5,
  },
  monthItemText: {
    fontSize: 16,
    color: colors.gray800,
  },
  selectedMonthItemText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  yearButton: {
    padding: 10,
  },
  yearText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: colors.textLight,
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
  },
  dateItem: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textLight,
  },
  selectedDateItem: {
    backgroundColor: colors.overlayLight,
    borderRadius: 5,
  },
  dateItemText: {
    fontSize: 16,
    color: colors.gray800,
  },
  selectedDateItemText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  selectorTitle: {
    fontSize: 14,
    marginBottom: 10,
    color: colors.textLight,
    textAlign: 'center',
  },
  dateSelector: {
    marginTop: 20,
  },
});

export default DatePickerModal;
