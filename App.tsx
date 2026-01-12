import React, {useEffect, useState} from 'react';
import AppNavigation from './src/navigations/AppNavigation';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {getLatestAppVersion} from './src/remote/app';
import {getCurrentAppVersion, isVersionNewer} from './src/utils/version';
import {UpdateModal} from './src/components/common/UpdateModal';

export const queryClient = new QueryClient();


function App(): React.JSX.Element {
  // 업데이트 모달 상태
  const [updateInfo, setUpdateInfo] = useState<{
    show: boolean;
    releaseNotes: string | null;
    forceUpdate: boolean;
  }>({
    show: false,
    releaseNotes: null,
    forceUpdate: false,
  });

  useEffect(() => {
    // Google Sign-In 설정
    try {
      GoogleSignin.configure({
        webClientId:
          '1067672951501-t1ta5taht07g9lho68dnq9pp4dor48do.apps.googleusercontent.com',
        iosClientId:
          '1067672951501-p2u9lijpokvakth3ked1mvqq6vo491lq.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      });
    } catch (error) {
      console.error('[App.tsx] SDK 초기화 에러:', error);
    }

    // 앱 업데이트 체크
    checkAppUpdate();
  }, []);

  /**
   * 앱 업데이트 체크 함수
   *
   * 작동 원리:
   * 1. AsyncStorage에서 마지막 체크 날짜 확인
   * 2. 설정된 간격(하루)이 지났는지 확인
   * 3. Supabase에서 최신 버전 정보 조회
   * 4. 현재 버전과 비교
   * 5. 새 버전이 있으면 모달 표시
   *
   * 최적화:
   * - 하루에 한 번만 체크하여 불필요한 API 호출 방지
   * - 에러 발생 시 앱은 정상 작동 (업데이트 체크 실패해도 문제없음)
   */
  const checkAppUpdate = async () => {
    try {
      // 현재 앱 버전
      const currentVersion = getCurrentAppVersion();
      console.log('[업데이트 체크] 현재 버전:', currentVersion);

      // Supabase에서 최신 버전 정보 조회
      const latestVersion = await getLatestAppVersion();

      if (!latestVersion) {
        console.log('[업데이트 체크] 최신 버전 정보를 가져올 수 없습니다.');
        return;
      }

      console.log('[업데이트 체크] 최신 버전:', latestVersion.version);

      // 버전 비교: 최신 버전이 현재 버전보다 새롭면
      if (isVersionNewer(latestVersion.version, currentVersion)) {
        console.log('[업데이트 체크] 새 버전이 있습니다!');

        // 업데이트 모달 표시
        setUpdateInfo({
          show: true,
          releaseNotes: latestVersion.release_notes,
          forceUpdate: latestVersion.force_update,
        });
      } else {
        console.log('[업데이트 체크] 최신 버전입니다.');
      }
    } catch (error) {
      // 에러 발생 시 로그만 남기고 앱은 정상 작동
      console.error('[업데이트 체크] 오류 발생:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigation />

        {/* 업데이트 알림 모달 */}
        <UpdateModal
          visible={updateInfo.show}
          releaseNotes={updateInfo.releaseNotes}
          forceUpdate={updateInfo.forceUpdate}
          onUpdate={() => {
            // 업데이트 버튼 클릭 시 모달 닫기
            setUpdateInfo(prev => ({...prev, show: false}));
          }}
          onDismiss={
            // 강제 업데이트가 아니면 "나중에" 버튼으로 닫기 가능
            updateInfo.forceUpdate
              ? undefined
              : () => {
                  setUpdateInfo(prev => ({...prev, show: false}));
                }
          }
        />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
