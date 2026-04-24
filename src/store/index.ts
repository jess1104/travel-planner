import { configureStore } from '@reduxjs/toolkit';
import travelReducer from './travelSlice';

// 從 LocalStorage 載入資料的函式
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('travel-planner-state');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

// 將資料存入 LocalStorage 的函式
const saveState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('travel-planner-state', serializedState);
  } catch {
    // 忽略寫入錯誤
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    travel: travelReducer,
  },
  preloadedState: preloadedState ? { travel: preloadedState } : undefined
});

// 監聽 Store 變化，只要有變動就存檔
store.subscribe(() => {
  saveState(store.getState().travel);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
