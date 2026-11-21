import React, {useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {AccountAvatar} from '../components/features/account/AccountAvatar';
import {Button} from '../components/ui/Button';
import {Icon} from '../components/ui/Icon';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {Text} from '../components/ui/Text';
import {ErrorState} from '../components/ui/feedback/ErrorState';
import {Skeleton} from '../components/ui/feedback/Skeleton';
import {useToast} from '../components/ui/feedback/ToastProvider';
import {useSession} from '../hooks/useSession';
import {checkNicknameAvailability} from '../remote/profile';
import {useUpdateProfileMutation} from '../tanstack-query/mutationHooks/profile';
import {profileQueryOptions} from '../tanstack-query/queryOptions/profile';
import {color, fontFamilyFor, layout, radius, space} from '../theme';
import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  validateNickname,
} from '../utils/nickname';

type SaveError = 'duplicate' | 'check' | 'update';

const messages = {
  duplicate: '이미 쓰는 닉네임이에요',
  check: '확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
  update: '바꾸지 못했어요. 다시 시도해 주세요.',
};

function ProfileEditScreen() {
  const navigation = useNavigation();
  const {user, loading} = useSession();
  const profileQuery = useQuery({
    ...profileQueryOptions(user?.id || ''),
    enabled: !!user?.id,
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="프로필 수정" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          {!profileQuery.data && (loading || profileQuery.isFetching) ? (
            <View style={styles.loading}>
              <Skeleton width={72} height={72} radius={radius.pill} />
              <Skeleton width={60} height={12} />
              <Skeleton width="fill" height={52} radius={radius.m} />
            </View>
          ) : user && profileQuery.data ? (
            <ProfileForm
              key={user.id}
              userId={user.id}
              savedNickname={profileQuery.data.nickname || ''}
              onSaved={() => {
                if (navigation.isFocused()) {
                  navigation.goBack();
                }
              }}
            />
          ) : (
            <ErrorState
              title="프로필을 불러오지 못했어요"
              message="잠시 뒤 다시 시도해 주세요."
              actionLabel={user ? '다시 시도' : undefined}
              onAction={profileQuery.refetch}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileForm({
  userId,
  savedNickname,
  onSaved,
}: {
  userId: string;
  savedNickname: string;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<string>();
  const [focused, setFocused] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [saveError, setSaveError] = useState<SaveError>();
  const [isSaving, setIsSaving] = useState(false);
  const inFlight = useRef(false);
  const updateProfile = useUpdateProfileMutation(userId);

  const nickname = draft ?? savedNickname;
  const trimmed = nickname.trim();
  const validationError = showValidation ? validateNickname(nickname) : null;
  const message = validationError || (saveError && messages[saveError]);
  const hasInputError = !!validationError || saveError === 'duplicate';

  const handleSave = async () => {
    if (inFlight.current || trimmed === savedNickname) {
      return;
    }
    setShowValidation(true);
    if (validateNickname(nickname)) {
      return;
    }

    inFlight.current = true;
    setIsSaving(true);
    setSaveError(undefined);
    try {
      try {
        if (!(await checkNicknameAvailability(trimmed))) {
          setSaveError('duplicate');
          return;
        }
      } catch {
        setSaveError('check');
        return;
      }

      try {
        await updateProfile.mutateAsync({nickname: trimmed});
        toast.show('닉네임을 바꿨어요');
        onSaved();
      } catch {
        setSaveError('update');
      }
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  return (
    <>
      <View style={styles.avatar}>
        <AccountAvatar name={trimmed || savedNickname} size={88} />
      </View>
      <View style={styles.field}>
        <Text variant="label" color="textMuted">
          닉네임
        </Text>
        <View
          style={[
            styles.inputBox,
            focused && styles.focused,
            hasInputError && styles.invalid,
            isSaving && styles.saving,
          ]}>
          <TextInput
            accessibilityLabel="닉네임"
            style={styles.input}
            value={nickname}
            onChangeText={value => {
              setDraft(value);
              setSaveError(undefined);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            editable={!isSaving}
            placeholder="닉네임을 입력해 주세요"
            placeholderTextColor={color.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text
            variant="caption"
            color={
              trimmed.length > NICKNAME_MAX_LENGTH ? 'alert' : 'textMuted'
            }>
            {trimmed.length}/{NICKNAME_MAX_LENGTH}
          </Text>
        </View>
        {message ? (
          <View accessibilityLiveRegion="polite" style={styles.message}>
            <Icon
              name={saveError === 'check' ? 'wifi-off' : 'info'}
              size={14}
              color={saveError === 'check' ? 'record' : 'alert'}
            />
            <Text
              variant="caption"
              style={styles.messageCopy}
              color={saveError === 'check' ? 'record' : 'alert'}>
              {message}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color="textMuted">
            {NICKNAME_MIN_LENGTH}~{NICKNAME_MAX_LENGTH}글자. 리더보드에 이
            이름이 보여요.
          </Text>
        )}
      </View>
      <View style={styles.footer}>
        <Button
          variant="primary"
          title={
            isSaving
              ? '저장 중…'
              : saveError === 'update'
              ? '다시 저장'
              : '저장'
          }
          loading={isSaving}
          disabled={trimmed === savedNickname}
          onPress={handleSave}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[24],
    paddingBottom: space[24],
  },
  loading: {alignItems: 'center', gap: space[12]},
  avatar: {alignItems: 'center', marginBottom: space[32]},
  field: {gap: space[8]},
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
    borderRadius: radius.m,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  focused: {borderColor: color.active},
  invalid: {borderColor: color.alert},
  saving: {opacity: 0.5},
  input: {
    flex: 1,
    minHeight: 52,
    color: color.text,
    fontSize: 16,
    fontFamily: fontFamilyFor(
      'ko',
      700,
      Platform.OS === 'ios' ? 'ios' : 'android',
    ),
    paddingVertical: space[12],
  },
  message: {flexDirection: 'row', alignItems: 'center', gap: space[8]},
  messageCopy: {flexShrink: 1},
  footer: {marginTop: 'auto', paddingTop: space[24]},
});

export default ProfileEditScreen;
