import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import {colors} from '../../constants/colors';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';

interface UpdateModalProps {
  visible: boolean;
  releaseNotes: string | null;
  forceUpdate: boolean;
  onUpdate: () => void;
  onDismiss?: () => void; // 강제 업데이트가 아니면 닫기 가능
}

/**
 * 업데이트 알림 모달 컴포넌트
 *
 * 사용 방법:
 * <UpdateModal
 *   visible={showUpdate}
 *   releaseNotes="업데이트 내용..."
 *   forceUpdate={false}
 *   onUpdate={() => setShowUpdate(false)}
 *   onDismiss={() => setShowUpdate(false)}
 * />
 *
 * 작동 원리:
 * 1. visible prop으로 모달 표시/숨김 제어
 * 2. releaseNotes에 업데이트 노트 표시
 * 3. forceUpdate가 true면 "나중에" 버튼 숨김 (강제 업데이트)
 * 4. "업데이트하기" 버튼 클릭 시 플레이스토어로 이동
 */
export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  releaseNotes,
  forceUpdate,
  onUpdate,
  onDismiss,
}) => {
  /**
   * 플레이스토어 링크 열기
   *
   * 작동 원리:
   * 1. market:// 스키마로 플레이스토어 앱 열기 시도
   * 2. 실패하면 https:// 링크로 웹 브라우저 열기
   */
//   TODO: 애플 스토어 링크 추가
  const handleUpdate = () => {
    const packageName = 'com.pushupapp'; // Android 패키지명
    const playStoreUrl = `market://details?id=${packageName}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

    // 먼저 플레이스토어 앱으로 열기 시도
    Linking.openURL(playStoreUrl).catch(() => {
      // 앱이 없으면 웹 브라우저로 열기
      Linking.openURL(webUrl);
    });

    onUpdate();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onDismiss}>
      {/* 반투명 배경 */}
      <View style={styles.overlay}>
        {/* 모달 컨테이너 */}
        <View style={styles.modal}>
          {/* 아이콘 */}
          <View style={styles.iconContainer}>
            <FontAwesome5
              iconStyle="solid"
              name="exclamation-circle"
              size={30}
              color={colors.primary}
            />
          </View>

          {/* 제목 */}
          <Text style={styles.title}>
            업데이트가 필요합니다
          </Text>
          <Text style={styles.subtitle}>
            새로운 기능과 더 나은 경험을 위해 업데이트를 권장합니다.
          </Text>

          {/* 업데이트 노트 */}
          {releaseNotes && (
            <ScrollView style={styles.notesContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.notes}>{releaseNotes}</Text>
            </ScrollView>
          )}

          {/* 버튼 컨테이너 */}
          <View style={styles.buttonContainer}>
            {/* 강제 업데이트가 아니면 "나중에" 버튼 표시 */}
            {!forceUpdate && onDismiss && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onDismiss}>
                <Text style={styles.cancelButtonText}>나중에</Text>
              </TouchableOpacity>
            )}
            {/* 업데이트하기 버튼 */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.updateButton,
                forceUpdate && styles.updateButtonFullWidth,
              ]}
              onPress={handleUpdate}>
              <Text style={styles.updateButtonText}>업데이트하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 반투명 검은 배경
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  notesContainer: {
    maxHeight: 200,
    marginBottom: 24,
    padding: 12,
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
  },
  notes: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.overlayMedium,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  updateButton: {
    backgroundColor: colors.primary,
  },
  updateButtonFullWidth: {
    flex: 1,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});

