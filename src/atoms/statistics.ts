import {atom} from 'jotai';

// 선택된 날짜를 관리하는 atom
export const selectedDateAtom = atom<Date>(new Date());

// 선택된 날짜를 업데이트하는 atom
export const updateSelectedDateAtom = atom(null, (get, set, newDate: Date) => {
  set(selectedDateAtom, newDate);
});
