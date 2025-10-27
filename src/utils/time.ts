/**
 * 초 단위 시간을 MM:SS 형식으로 포맷팅
 * @param seconds 초 단위 시간
 * @returns MM:SS 형식의 문자열
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

/**
 * 초 단위 시간을 시:분:초 형식으로 포맷팅
 * @param seconds 초 단위 시간
 * @returns HH:MM:SS 형식의 문자열
 */
export const formatTimeWithHours = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

/**
 * 현재 로컬 시간(KST 기준 포함)을 YYYY-MM-DD 형식으로 반환합니다.
 *
 * 예: 2025-10-27
 */
export function formatKSTDate(date = new Date()) {
  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '-')
    .replace('.', '');
}

/**
 * 초 단위 시간을 한국어 형식으로 포맷팅
 * @param seconds 초 단위 시간
 * @returns "1분 30초" 형식의 문자열
 */
export const formatTimeKorean = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (mins > 0) {
    parts.push(`${mins}분`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}초`);
  }

  return parts.join(' ');
};
