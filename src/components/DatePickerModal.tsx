import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';

type MonthPickerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthSelect: (monthIndex: number) => void;
  onYearChange: (newYear: number) => void;
};

const monthNames = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

const DatePickerModal: React.FC<MonthPickerModalProps> = ({
  isVisible,
  onClose,
  selectedMonth,
  selectedYear,
  onMonthSelect,
  onYearChange,
}) => {
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
          <Text style={styles.modalTitle}>월 선택</Text>
          <FlatList
            data={monthNames}
            numColumns={3}
            renderItem={({item, index}) => (
              <TouchableOpacity
                style={[
                  styles.monthItem,
                  selectedMonth === index && styles.selectedMonthItem,
                ]}
                onPress={() => {
                  onMonthSelect(index);
                  onClose();
                }}>
                <Text
                  style={[
                    styles.monthItemText,
                    selectedMonth === index && styles.selectedMonthItemText,
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          <View style={styles.yearSelector}>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={() => onYearChange(selectedYear - 1)}>
              <Fontawesome5
                name="chevron-left"
                iconStyle="solid"
                size={16}
                color="#0182ff"
              />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}년</Text>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={() => onYearChange(selectedYear + 1)}>
              <Fontawesome5
                name="chevron-right"
                iconStyle="solid"
                size={16}
                color="#0182ff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  monthItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMonthItemText: {
    color: '#097eed',
    fontWeight: 'bold',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  yearButton: {
    padding: 10,
  },
  yearText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
});

export default DatePickerModal;
