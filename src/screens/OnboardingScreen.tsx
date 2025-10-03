import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import {colors} from '../constants/colors';
import CustomButton from '../components/common/CustomButton';
import {supabase} from '../lib/supabase';
import {useAuth} from '../hooks/useAuth';

function OnboardingScreen() {
  const {user} = useAuth();
  const [targetRepsPerSet, setTargetRepsPerSet] = useState('10');
  const [targetSetsPerDay, setTargetSetsPerDay] = useState('3');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    const reps = parseInt(targetRepsPerSet, 10);
    const sets = parseInt(targetSetsPerDay, 10);

    // 입력값 검증
    if (isNaN(reps) || reps < 1 || reps > 100) {
      Alert.alert(
        '오류',
        '세트당 목표 횟수는 1-100 사이의 숫자를 입력해주세요.',
      );
      return;
    }

    if (isNaN(sets) || sets < 1 || sets > 20) {
      Alert.alert(
        '오류',
        '하루 목표 세트 수는 1-20 사이의 숫자를 입력해주세요.',
      );
      return;
    }

    try {
      setIsLoading(true);

      // 프로필 생성 또는 업데이트
      const {error} = await supabase.from('profiles').upsert({
        id: user?.id,
        target_reps_per_set: reps,
        target_sets_per_day: sets,
      });

      if (error) {
        console.error('프로필 저장 오류:', error);
        Alert.alert('오류', '목표 설정 저장에 실패했습니다.');
      } else {
        Alert.alert('성공', '목표가 설정되었습니다!', [
          {
            text: '확인',
            onPress: () => {
              // TODO: 메인 화면으로 이동
              console.log('온보딩 완료');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('온보딩 저장 오류:', error);
      Alert.alert('오류', '목표 설정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.onboardingTitle}>목표 설정</Text>
          <Text style={styles.onboardingDescription}>
            푸쉬핏에 오신 것을 환영합니다!
          </Text>
          <Text style={styles.onboardingDescription}>
            아래 질문에 답해주세요.
          </Text>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              세트당 목표 횟수는 몇 회인가요?
            </Text>
            <TextInput
              style={styles.input}
              value={targetRepsPerSet}
              onChangeText={setTargetRepsPerSet}
              placeholder="예: 10"
              keyboardType="numeric"
              maxLength={3}
              returnKeyType="next"
              onSubmitEditing={() => {
                // 다음 입력 필드로 포커스 이동
                Keyboard.dismiss();
              }}
            />
            <Text style={styles.inputHint}>
              1-100 사이의 숫자를 입력해주세요
            </Text>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              하루에 몇 세트를 목표로 하시나요?
            </Text>
            <TextInput
              style={styles.input}
              value={targetSetsPerDay}
              onChangeText={setTargetSetsPerDay}
              placeholder="예: 3"
              keyboardType="numeric"
              maxLength={2}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSave();
              }}
            />
            <Text style={styles.inputHint}>
              1-20 사이의 숫자를 입력해주세요
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>설정 요약</Text>
            <Text style={styles.summaryText}>
              세트당 {targetRepsPerSet}회 × {targetSetsPerDay}세트 = 총{' '}
              {parseInt(targetRepsPerSet, 10) *
                parseInt(targetSetsPerDay, 10) || 0}
              회
            </Text>
          </View>

          <CustomButton
            title={isLoading ? '저장 중...' : '목표 설정 완료'}
            style={styles.onboardingButton}
            onPress={handleSave}
            disabled={isLoading}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  onboardingDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  questionContainer: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputHint: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 6,
  },
  summaryContainer: {
    marginVertical: 20,
    padding: 16,
    backgroundColor: colors.backgroundAccent,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  onboardingButton: {
    backgroundColor: colors.primary,
    marginTop: 20,
  },
});

export default OnboardingScreen;
