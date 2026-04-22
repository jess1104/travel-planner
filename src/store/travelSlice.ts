import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Location {
  lat: number;
  lng: number;
}

export interface Activity {
  name: string;
  location: Location;
}

export interface DayPlan {
  id: string;
  title: string;
  color: string;
  activities: Activity[];
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
        activities: [
          { name: 'Santa Monica Pier', location: { lat: 34.0099, lng: -118.4960 } },
          { name: 'Getty Center', location: { lat: 34.0780, lng: -118.4741 } },
          { name: 'The Grove', location: { lat: 34.0719, lng: -118.3565 } }
        ]
      },
      {
        id: 'day2',
        title: 'Day 2: LA 中央市場 & NBA',
        color: '#F97316', // 橘色
        activities: [
          { name: 'Grand Central Market', location: { lat: 34.0505, lng: -118.2486 } },
          { name: "Angel's Flight Railway", location: { lat: 34.0513, lng: -118.2496 } },
          { name: 'Crypto.com Arena', location: { lat: 34.0430, lng: -118.2673 } }
        ]
      }
    ],
    '東京': [
      {
        id: 'day1',
        title: 'Day 1: 澀谷 & 新宿',
        color: '#EC4899', // 粉色
        activities: [
          { name: '澀谷 Scramble Crossing', location: { lat: 35.6595, lng: 139.7005 } },
          { name: '新宿御苑', location: { lat: 35.6852, lng: 139.7101 } }
        ]
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
      const regionPlans = state.plans[action.payload];
      state.selectedDayId = regionPlans && regionPlans.length > 0 ? regionPlans[0].id : null;
    },
    selectDay: (state, action: PayloadAction<string>) => {
      state.selectedDayId = action.payload;
    },
  },
});

export const { selectRegion, selectDay } = travelSlice.actions;
export default travelSlice.reducer;
