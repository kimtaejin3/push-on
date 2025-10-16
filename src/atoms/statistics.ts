import {atom} from 'jotai';

// 선택된 날짜를 관리하는 atom
export const selectedDateAtom = atom<Date>(new Date());

// 선택된 날짜를 업데이트하는 atom
export const updateSelectedDateAtom = atom(null, (get, set, newDate: Date) => {
  set(selectedDateAtom, newDate);
});

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH = new Date().getMonth() + 1;
export const CURRENT_DATE = new Date().getDate();
