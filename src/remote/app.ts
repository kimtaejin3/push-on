import {supabase} from '../lib/supabase';

/**
 * 앱 버전 정보 인터페이스
 * Supabase의 app_versions 테이블과 매핑됩니다
 */
export interface AppVersion {
  version: string; // 버전 번호 (예: "0.0.1")
  force_update: boolean; // 강제 업데이트 여부
  release_notes: string | null; // 업데이트 노트
}

/**
 * Supabase에서 최신 앱 버전 정보를 조회합니다
 *
 * @returns 최신 버전 정보 또는 null (에러 시)
 *
 * 작동 원리:
 * 1. app_versions 테이블에서 created_at 기준으로 최신 버전 조회
 * 2. RLS 정책으로 인해 모든 사용자가 읽을 수 있음
 * 3. 에러 발생 시 null 반환 (앱은 계속 작동)
 *
 * 사용 예시:
 * const latestVersion = await getLatestAppVersion();
 * if (latestVersion) {
 *   // 버전 비교 로직
 * }
 */
export const getLatestAppVersion = async (): Promise<AppVersion | null> => {
  try {
    const {data, error} = await supabase
      .from('app_versions')
      .select('version, force_update, release_notes')
      .order('created_at', {ascending: false}) // 최신순 정렬
      .limit(1) // 가장 최신 버전만
      .single(); // 단일 결과 반환

    if (error) {
      // 데이터가 없거나 에러 발생 시
      console.warn('앱 버전 조회 실패:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    // 예상치 못한 에러 (네트워크 등)
    console.error('앱 버전 조회 중 예외 발생:', error);
    return null;
  }
};

