import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../../../constants/colors';
import {formatTime} from '../../../utils/time';

type SetData = {
  setNumber: number;
  reps: number;
  time: string;
  target?: number | null; // 세트/프로그램 모드의 목표 횟수
};

type SetCardProps = {
  set: SetData;
};

const SetCard: React.FC<SetCardProps> = ({set}) => {
  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <View style={styles.setNumberContainer}>
          <Text style={styles.setNumber}>{set.setNumber}</Text>
        </View>
        <View style={styles.setMainInfo}>
          <Text style={styles.setReps}>
            {set.reps}회
            {set.target ? <Text style={styles.setTarget}> / {set.target}</Text> : null}
          </Text>
          <Text style={styles.setTime}>{formatTime(Number(set.time))}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  setCard: {
    backgroundColor: colors.overlayLight,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  setNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  setMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setReps: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
    marginRight: 10,
  },
  setTarget: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.gray400,
  },
  setTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default SetCard;
export type {SetData};
