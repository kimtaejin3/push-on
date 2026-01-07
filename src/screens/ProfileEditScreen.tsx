import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import {useSession} from '../hooks/useSession';
import Header from '../components/common/Header';
import {profileQueryOptions} from '../tanstack-query/queryOptions/profile';
import {useUpdateProfileMutation} from '../tanstack-query/mutationHooks/profile';

function ProfileEditScreen() {
  const navigation = useNavigation();
  const {user} = useSession();

  // 로컬 상태
  const [nickname, setNickname] = useState('');
  const [targetRepsPerSet, setTargetRepsPerSet] = useState('');
  const [targetSetsPerDay, setTargetSetsPerDay] = useState('');

  // 프로필 데이터 조회
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    ...profileQueryOptions(user?.id || ''),
    enabled: !!user?.id,
  });

  const updateProfileMutation = useUpdateProfileMutation(
    user?.id || '',
    () => {
      Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다.');
      navigation.goBack();
    },
    () => {
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    },
  );

  // 프로필 데이터가 로드되면 로컬 상태 업데이트
  useEffect(() => {
    if (profileData) {
      setTargetRepsPerSet(profileData.target_reps_per_set?.toString() || '');
      setTargetSetsPerDay(profileData.target_sets_per_day?.toString() || '');
      setNickname(profileData.nickname || '');
    }
  }, [profileData]);

  const handleSave = () => {
    const repsPerSet = parseInt(targetRepsPerSet, 10);
    const setsPerDay = parseInt(targetSetsPerDay, 10);

    // 유효성 검사
    if (isNaN(repsPerSet) || repsPerSet < 1 || repsPerSet > 100) {
      Alert.alert('오류', '세트당 목표 횟수는 1-100 사이의 숫자여야 합니다.');
      return;
    }

    if (isNaN(setsPerDay) || setsPerDay < 1 || setsPerDay > 20) {
      Alert.alert('오류', '목표 세트는 1-20 사이의 숫자여야 합니다.');
      return;
    }

    updateProfileMutation.mutate({
      target_reps_per_set: repsPerSet,
      target_sets_per_day: setsPerDay,
      nickname: nickname,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="프로필 수정" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>프로필 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="프로필 수정" onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            프로필 정보를 불러올 수 없습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="프로필 수정" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* 프로필 정보 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>닉네일 설정</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput
                style={styles.textInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="예: 푸쉬업 사랑"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* 운동 목표 설정 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>운동 목표 설정</Text>
            <View style={styles.settingsContainer}>
              {/* 세트당 목표 횟수 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>세트당 목표 횟수</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={targetRepsPerSet}
                    onChangeText={setTargetRepsPerSet}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.inputSuffix}>회</Text>
                </View>
                <Text style={styles.inputDescription}>
                  한 세트당 목표로 하는 푸쉬업 횟수입니다.
                </Text>
              </View>

              {/* 목표 세트 수 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>목표 세트 수</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={targetSetsPerDay}
                    onChangeText={setTargetSetsPerDay}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.inputSuffix}>세트</Text>
                </View>
                <Text style={styles.inputDescription}>
                  하루에 목표로 하는 세트 수입니다.
                </Text>
              </View>
            </View>
          </View>

          {/* 현재 목표 요약 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>현재 목표</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryText}>
                  세트당 {targetRepsPerSet}회 × {targetSetsPerDay}세트
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryText}>
                  총{' '}
                  {parseInt(targetRepsPerSet, 10) *
                    parseInt(targetSetsPerDay, 10)}
                  회
                </Text>
              </View>
            </View>
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              updateProfileMutation.isPending && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}>
            <Fontawesome5
              name="save"
              size={16}
              iconStyle="solid"
              color={colors.textLight}
            />
            <Text style={styles.saveButtonText}>
              {updateProfileMutation.isPending ? '저장 중...' : '저장하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.overlayMedium,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  settingsContainer: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textLight,
    padding: 0,
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.overlayMedium,
    paddingBottom: 10,
  },
  inputSuffix: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  inputDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 12,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default ProfileEditScreen;
