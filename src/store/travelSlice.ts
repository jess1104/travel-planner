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
  selectedRegion: string | null;
  plans: Record<string, DayPlan[]>;
  selectedDayId: string | null;
  previewLocation: Activity | null;
  focusedLocation: Location | null;
  userLocation: Location | null;
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
  selectedRegion: null, // 預設不選中
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
  selectedDayId: null, // 預設不選中
  previewLocation: null,
  focusedLocation: null,
  userLocation: null
};

export const travelSlice = createSlice({
  name: 'travel',
  initialState,
  reducers: {
    selectRegion: (state, action: PayloadAction<string>) => {
      state.selectedRegion = action.payload;
      const regionPlans = state.plans[action.payload];
      // 選中地區時，自動選中第一天
      state.selectedDayId = regionPlans && regionPlans.length > 0 ? regionPlans[0].id : null;
      
      // 自動聚焦到第一天的第一個景點
      const firstActivity = regionPlans?.[0]?.activities[0];
      if (firstActivity) {
        state.focusedLocation = firstActivity.location;
      }
      state.previewLocation = null;
    },
    // 新增：回到初始預設狀態
    resetSelection: (state) => {
      state.selectedRegion = null;
      state.selectedDayId = null;
      state.previewLocation = null;
      state.focusedLocation = state.userLocation; // 回到自己位置
    },
    selectDay: (state, action: PayloadAction<string>) => {
      state.selectedDayId = action.payload;
      state.focusedLocation = null;
    },
    setPreviewLocation: (state, action: PayloadAction<Activity | null>) => {
      state.previewLocation = action.payload;
      if (action.payload) state.focusedLocation = null;
    },
    setFocusedLocation: (state, action: PayloadAction<Location | null>) => {
      state.focusedLocation = action.payload;
      if (action.payload) state.previewLocation = null;
    },
    setUserLocation: (state, action: PayloadAction<Location | null>) => {
      state.userLocation = action.payload;
      // 只有在還沒選中任何地區時，才自動聚焦到使用者位置
      if (action.payload && !state.selectedRegion && !state.focusedLocation) {
        state.focusedLocation = action.payload;
      }
    },
    addDay: (state) => {
      if (!state.selectedRegion) return;
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
  selectRegion, resetSelection, selectDay, addDay, deleteDay, 
  setPreviewLocation, setFocusedLocation, setUserLocation, addActivity, removeActivity 
} = travelSlice.actions;

export default travelSlice.reducer;
