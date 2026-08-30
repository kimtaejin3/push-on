const NICKNAME_PREFIX = 'user-';
const RANDOM_PART_LENGTH = 8;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * 가입 직후 자동으로 부여하는 닉네임을 만든다. 예: user-23923djs
 */
export const generateRandomNickname = (): string => {
  let suffix = '';
  for (let i = 0; i < RANDOM_PART_LENGTH; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return NICKNAME_PREFIX + suffix;
};

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 10;

/**
 * 닉네임 입력 규칙 검사. 통과하면 null, 아니면 사용자에게 보여줄 메시지.
 */
export const validateNickname = (input: string): string | null => {
  const nickname = input.trim();
  if (nickname.length === 0) {
    return '닉네임을 입력해주세요.';
  }
  if (nickname.length < NICKNAME_MIN_LENGTH) {
    return `닉네임은 ${NICKNAME_MIN_LENGTH}글자 이상 입력해주세요.`;
  }
  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return `닉네임은 ${NICKNAME_MAX_LENGTH}글자 이하로 입력해주세요.`;
  }
  return null;
};
