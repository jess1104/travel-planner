import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface DayPlan {
  id: string;
  title: string;
  color: string;
  activities: string[];
}

interface TravelState {
  regions: string[];
  selectedRegion: string;
  plans: Record<string, DayPlan[]>;
  selectedDayId: string | null;
}

const initialState: TravelState = {
  regions: ['LA', '東京'],
  selectedRegion: 'LA',
  plans: {
    'LA': [
      {
        id: 'day1',
        title: 'Day 1: LA 西半部景點',
        color: '#3B82F6', // 藍色
        activities: ['Santa Monica Pier', 'Getty Center', 'The Grove']
      },
      {
        id: 'day2',
        title: 'Day 2: LA 中央市場 & NBA',
        color: '#F97316', // 橘色
        activities: ['Grand Central Market', 'Angel\'s Flight Railway', 'Crypto.com Arena 看 NBA']
      }
    ],
    '東京': [
      {
        id: 'day1',
        title: 'Day 1: 澀谷 & 新宿',
        color: '#EC4899', // 粉色
        activities: ['澀谷 Cross', '新宿御苑']
      }
    ]
  },
  selectedDayId: 'day1'
};

export const travelSlice = createSlice({
  name: 'travel',
  initialState,
  reducers: {
    selectRegion: (state, action: PayloadAction<string>) => {
      state.selectedRegion = action.payload;
      state.selectedDayId = state.plans[action.payload][0]?.id || null;
    },
    selectDay: (state, action: PayloadAction<string>) => {
      state.selectedDayId = action.payload;
    },
  },
});

export const { selectRegion, selectDay } = travelSlice.actions;
export default travelSlice.reducer;
