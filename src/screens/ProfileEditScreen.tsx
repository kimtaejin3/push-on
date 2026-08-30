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
import {checkNicknameAvailability} from '../remote/profile';
import {validateNickname, NICKNAME_MAX_LENGTH} from '../utils/nickname';

function ProfileEditScreen() {
  const navigation = useNavigation();
  const {user} = useSession();

  const [nickname, setNickname] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

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
      Alert.alert('성공', '닉네임이 변경되었어요');
    },
    () => {
      Alert.alert('오류', '닉네임 변경에 실패했어요');
    },
  );

  // 프로필 데이터가 로드되면 로컬 상태 업데이트
  useEffect(() => {
    if (profileData) {
      setNickname(profileData.nickname || '');
    }
  }, [profileData]);

  const handleSave = async () => {
    const trimmed = nickname.trim();

    const validationError = validateNickname(trimmed);
    if (validationError) {
      Alert.alert('오류', validationError);
      return;
    }

    if (trimmed === profileData?.nickname) {
      Alert.alert('알림', '변경된 내용이 없어요');
      return;
    }

    setIsCheckingNickname(true);
    try {
      const isAvailable = await checkNicknameAvailability(trimmed);
      if (!isAvailable) {
        Alert.alert('오류', '이미 사용 중인 닉네임이에요');
        return;
      }
    } catch (e) {
      Alert.alert('오류', '닉네임 확인 중 오류가 발생했어요');
      return;
    } finally {
      setIsCheckingNickname(false);
    }

    updateProfileMutation.mutate({nickname: trimmed});
  };

  const isSaving = isCheckingNickname || updateProfileMutation.isPending;

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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>닉네임 설정</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput
                style={styles.textInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="예: 푸쉬업 사랑"
                placeholderTextColor={colors.textSecondary}
                maxLength={NICKNAME_MAX_LENGTH}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputDescription}>
                2~{NICKNAME_MAX_LENGTH}글자. 리더보드에 표시되는 이름이에요.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}>
            <Fontawesome5
              name="save"
              size={16}
              iconStyle="solid"
              color={colors.textLight}
            />
            <Text style={styles.saveButtonText}>
              {isSaving ? '저장 중...' : '저장하기'}
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
