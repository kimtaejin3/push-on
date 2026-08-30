/** RN(Hermes)에는 crypto.randomUUID 가 없어 Math.random 기반 v4 형식 uuid 를 만든다. 세트 묶음 식별용. */
export const generateUuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8; // y 자리는 8..b (variant)
    return v.toString(16);
  });
