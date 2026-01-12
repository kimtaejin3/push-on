/**
 * 버전 비교 유틸리티 함수
 *
 * 버전 형식: "0.0.1", "1.2.3" 등 (Major.Minor.Patch)
 */

/**
 * 버전 문자열을 숫자 배열로 변환
 * @param version 버전 문자열 (예: "1.0.1")
 * @returns 숫자 배열 (예: [1, 0, 1])
 *
 * 예시:
 * parseVersion("1.0.1") => [1, 0, 1]
 * parseVersion("0.0.2") => [0, 0, 2]
 */
export const parseVersion = (version: string): number[] => {
  return version.split('.').map(Number);
};

/**
 * 버전 비교 함수
 * @param version1 비교할 버전 1
 * @param version2 비교할 버전 2
 * @returns true if version1 > version2 (version1이 더 최신)
 *
 * 예시:
 * isVersionNewer("1.0.1", "1.0.0") => true
 * isVersionNewer("0.0.2", "0.0.1") => true
 * isVersionNewer("1.0.0", "1.0.0") => false
 * isVersionNewer("0.0.1", "0.0.2") => false
 */
export const isVersionNewer = (version1: string, version2: string): boolean => {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);

  // 각 자릿수(Major, Minor, Patch)를 순서대로 비교
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0; // 없으면 0으로 처리
    const num2 = v2[i] || 0;

    if (num1 > num2) {
      return true; // version1이 더 크면 true
    }
    if (num1 < num2) {
      return false; // version2가 더 크면 false
    }
    // 같으면 다음 자릿수 비교
  }

  return false; // 모든 자릿수가 같으면 false (같은 버전)
};

/**
 * 현재 앱 버전
 * package.json의 version과 동기화해야 합니다
 *
 * 새 버전 출시 시 이 값을 업데이트하세요
 */
export const CURRENT_APP_VERSION = '1.5.3';

/**
 * 현재 앱 버전 가져오기
 *
 * @returns 버전 문자열 (예: "0.0.1")
 */
export const getCurrentAppVersion = (): string => {
  return CURRENT_APP_VERSION;
};

