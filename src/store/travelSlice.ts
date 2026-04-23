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
  previewLocation: Activity | null;
  focusedLocation: Location | null; // 新增：目前正在查看的特定座標
}

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#F97316', // Orange
  '#EC4899', // Pink
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EF4444', // Red
];

const initialState: TravelState = {
  regions: ['LA', '東京'],
  selectedRegion: 'LA',
  plans: {
    'LA': [
      {
        id: 'day1',
        title: 'Day 1: LA 西半部景點',
        color: COLOR_PALETTE[0],
        activities: [
          { name: 'Santa Monica Pier', location: { lat: 34.0099, lng: -118.4960 } },
          { name: 'Getty Center', location: { lat: 34.0780, lng: -118.4741 } },
          { name: 'The Grove', location: { lat: 34.0719, lng: -118.3565 } }
        ]
      },
      {
        id: 'day2',
        title: 'Day 2: LA 中央市場 & NBA',
        color: COLOR_PALETTE[1],
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
        color: COLOR_PALETTE[2],
        activities: [
          { name: '澀谷 Scramble Crossing', location: { lat: 35.6595, lng: 139.7005 } },
          { name: '新宿御苑', location: { lat: 35.6852, lng: 139.7101 } }
        ]
      }
    ]
  },
  selectedDayId: 'day1',
  previewLocation: null,
  focusedLocation: null
};

export const travelSlice = createSlice({
  name: 'travel',
  initialState,
  reducers: {
    selectRegion: (state, action: PayloadAction<string>) => {
      state.selectedRegion = action.payload;
      const regionPlans = state.plans[action.payload];
      state.selectedDayId = regionPlans && regionPlans.length > 0 ? regionPlans[0].id : null;
      state.previewLocation = null;
      state.focusedLocation = null;
    },
    selectDay: (state, action: PayloadAction<string>) => {
      state.selectedDayId = action.payload;
      state.focusedLocation = null; // 切換天數時重置聚焦
    },
    setPreviewLocation: (state, action: PayloadAction<Activity | null>) => {
      state.previewLocation = action.payload;
      if (action.payload) state.focusedLocation = null; // 搜尋時重置手動聚焦
    },
    // 新增：設定目前聚焦的座標
    setFocusedLocation: (state, action: PayloadAction<Location | null>) => {
      state.focusedLocation = action.payload;
      if (action.payload) state.previewLocation = null; // 聚焦時重置搜尋預覽
    },
    addDay: (state) => {
      const region = state.selectedRegion;
      const currentPlans = state.plans[region] || [];
      const nextDayNum = currentPlans.length + 1;
      const newDayId = `day${nextDayNum}`;
      state.plans[region].push({
        id: newDayId,
        title: `Day ${nextDayNum}: 新的行程`,
        color: COLOR_PALETTE[(nextDayNum - 1) % COLOR_PALETTE.length],
        activities: []
      });
      state.selectedDayId = newDayId;
    },
    deleteDay: (state, action: PayloadAction<{ region: string, dayId: string }>) => {
      const { region, dayId } = action.payload;
      const filteredPlans = state.plans[region].filter(p => p.id !== dayId);
      state.plans[region] = filteredPlans.map((plan, index) => ({
        ...plan,
        id: `day${index + 1}`,
        title: plan.title.replace(/Day \d+/, `Day ${index + 1}`),
        color: COLOR_PALETTE[index % COLOR_PALETTE.length]
      }));
      state.selectedDayId = state.plans[region][0]?.id || null;
    },
    addActivity: (state, action: PayloadAction<{ region: string, dayId: string, activity: Activity }>) => {
      const { region, dayId, activity } = action.payload;
      const dayPlan = state.plans[region]?.find(p => p.id === dayId);
      if (dayPlan) dayPlan.activities.push(activity);
      state.previewLocation = null;
    },
    removeActivity: (state, action: PayloadAction<{ region: string, dayId: string, index: number }>) => {
      const { region, dayId, index } = action.payload;
      const dayPlan = state.plans[region]?.find(p => p.id === dayId);
      if (dayPlan) dayPlan.activities.splice(index, 1);
    }
  },
});

export const { 
  selectRegion, selectDay, addDay, deleteDay, 
  setPreviewLocation, setFocusedLocation, addActivity, removeActivity 
} = travelSlice.actions;

export default travelSlice.reducer;
