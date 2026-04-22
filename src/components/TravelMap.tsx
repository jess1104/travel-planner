import { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { DayPlan, Activity } from '../store/travelSlice';

// google map金鑰
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// 建立一個內部元件來處理地圖跳轉邏輯
function MapHandler({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.panTo(center); // 平滑移動到新中心點
      map.setZoom(12);   // 切換地區時自動調整縮放倍率
    }
  }, [map, center]);

  return null;
}

export default function TravelMap() {
  const { plans, selectedRegion, selectedDayId } = useSelector((state: RootState) => state.travel);
  
  const currentRegionPlans = plans[selectedRegion] || [];
  
  // 找出目前應該顯示的中心點
  const selectedDay = currentRegionPlans.find(p => p.id === selectedDayId) || currentRegionPlans[0];
  const center = selectedDay?.activities[0]?.location || { lat: 35.6895, lng: 139.6917 }; // 預設東京

  return (
    <div className="w-full h-full bg-slate-100 relative">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={11}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          mapId={'bf51a910020fa1cf'} 
        >
          {/* 加入跳轉處理器 */}
          <MapHandler center={center} />

          {currentRegionPlans.map((day: DayPlan) => (
            day.activities.map((activity: Activity, idx: number) => (
              <AdvancedMarker
                key={`${day.id}-${idx}`}
                position={activity.location}
                title={activity.name}
              >
                <Pin 
                  background={day.color} 
                  glyphColor={'#fff'} 
                  borderColor={'#fff'}
                />
              </AdvancedMarker>
            ))
          ))}
        </Map>
      </APIProvider>
      
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-md px-4 py-2 rounded-full border border-blue-100 z-10">
        <p className="text-sm font-bold text-blue-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse bg-blue-600" />
          正在顯示 {selectedRegion} 景點點位
        </p>
      </div>
    </div>
  );
}
