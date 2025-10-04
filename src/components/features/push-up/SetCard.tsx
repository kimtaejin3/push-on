import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../../../constants/colors';

type SetData = {
  setNumber: number;
  reps: number;
  time: string;
  isPersonalBest: boolean;
};

type SetCardProps = {
  set: SetData;
  maxReps: number;
};

const SetCard: React.FC<SetCardProps> = ({set, maxReps}) => {
  const progressWidth = (set.reps / maxReps) * 100;

  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <View style={styles.setNumberContainer}>
          <Text style={styles.setNumber}>{set.setNumber}</Text>
        </View>
        <View style={styles.setInfo}>
          <View style={styles.setMainInfo}>
            <Text style={styles.setReps}>{set.reps}회</Text>
            <Text style={styles.setTime}>{set.time}</Text>
          </View>
          {set.isPersonalBest && (
            <View style={styles.bestBadge}>
              <Fontawesome5
                name="crown"
                iconStyle="solid"
                size={10}
                color="#fff"
              />
              <Text style={styles.bestText}>BEST</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${progressWidth}%`}]} />
        </View>
        <Text style={styles.progressText}>{progressWidth.toFixed(0)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  setCard: {
    backgroundColor: colors.background,
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
    marginBottom: 10,
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
  setInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setReps: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: 10,
  },
  setTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bestText: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryDark,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: colors.textSecondary,
    minWidth: 26,
    textAlign: 'right',
  },
  restTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  restTimeText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

export default SetCard;
export type {SetData};
