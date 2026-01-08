/**
 * 운동 앱에 맞는 한글 닉네임을 랜덤하게 생성합니다.
 * @returns 랜덤 생성된 닉네임 (예: "몸짱 너구리", "파워 호랑이")
 */
export const generateRandomNickname = (): string => {
  const prefixes = [
    '몸짱',
    '근육맨',
    '파워',
    '헬스',
    '피트니스',
    '강인한',
    '튼튼한',
    '건강한',
    '멋진',
    '챔피언',
    '킹',
    '퀸',
    '워리어',
    '파이터',
    '히어로',
    '타이탄',
    '스파르탄',
    '강력한',
    '빠른',
    '날렵한',
    '무적',
    '불굴',
    '최강',
    '레전드',
    '마스터',
    '프로',
    '엘리트',
    '슈퍼',
    '울트라',
    '메가',
  ];

  const suffixes = [
    '너구리',
    '호랑이',
    '사자',
    '곰',
    '독수리',
    '상어',
    '불곰',
    '치타',
    '늑대',
    '거북이',
    '코끼리',
    '기린',
    '팬더',
    '고양이',
    '강아지',
    '토끼',
    '여우',
    '수달',
    '다람쥐',
    '펭귄',
    '돌고래',
    '고래',
    '상어',
    '악어',
    '표범',
    '재규어',
    '하이에나',
    '하마',
    '코뿔소',
    '기린',
  ];

  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${randomPrefix} ${randomSuffix}`;
};

