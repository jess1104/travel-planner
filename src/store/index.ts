import { configureStore } from '@reduxjs/toolkit';
import travelReducer from './travelSlice';

export const store = configureStore({
  reducer: {
    travel: travelReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
