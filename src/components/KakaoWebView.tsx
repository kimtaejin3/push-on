import React from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';

interface KakaoWebViewProps {
  visible: boolean;
  url: string;
  onClose: () => void;
}

const KakaoWebView: React.FC<KakaoWebViewProps> = ({visible, url, onClose}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet">
      <SafeAreaView style={styles.webViewContainer}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Fontawesome5
              name="times"
              iconStyle="solid"
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>카카오 로그인</Text>
          <View style={styles.placeholder} />
        </View>

        <WebView
          source={{uri: url}}
          style={styles.webView}
          startInLoadingState={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                카카오 로그인 페이지를 불러오는 중...
              </Text>
            </View>
          )}
          onError={error => {
            console.error('웹뷰 오류:', error);
            console.error('오류 상세:', error.nativeEvent);
            Alert.alert(
              '오류',
              `웹뷰 로딩 중 오류가 발생했습니다.\n오류 코드: ${error.nativeEvent?.code}\n설명: ${error.nativeEvent?.description}`,
            );
          }}
          onHttpError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.error('HTTP 오류:', nativeEvent);
            Alert.alert(
              'HTTP 오류',
              `상태 코드: ${nativeEvent.statusCode}\nURL: ${nativeEvent.url}`,
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  closeButton: {
    padding: 8,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 36, // closeButton과 같은 크기로 균형 맞춤
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default KakaoWebView;
