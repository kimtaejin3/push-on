/** RN(Hermes)에는 crypto.randomUUID 가 없어 Math.random 기반 v4 형식 uuid 를 만든다. 세트 묶음 식별용. */
export const generateUuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
