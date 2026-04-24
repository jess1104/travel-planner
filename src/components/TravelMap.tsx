import { useEffect, useState } from 'react';
import { Map, AdvancedMarker, Pin, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Navigation } from 'lucide-react';
import type { RootState } from '../store';
import { addActivity, setFocusedLocation } from '../store/travelSlice';
import type { DayPlan, Activity, Location } from '../store/travelSlice';
import PlaceSearch from './PlaceSearch';

const REGION_CENTERS: Record<string, Location> = {
  'LA': { lat: 34.0522, lng: -118.2437 },
  '東京': { lat: 35.6895, lng: 139.6917 }
};

// 處理地圖跳轉邏輯
function MapHandler({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(13); // 切換時保持一個適中的縮放
    }
  }, [map, center]);
  return null;
}

export default function TravelMap() {
  const dispatch = useDispatch();
  const map = useMap();
  
  const { plans, selectedRegion, selectedDayId, previewLocation, focusedLocation, userLocation } = useSelector((state: RootState) => state.travel);
  
  const [clickedLocation, setClickedLocation] = useState<{ pos: Location, name: string } | null>(null);

  const currentRegionPlans = plans[selectedRegion || ''] || [];
  const selectedDay = currentRegionPlans.find(p => p.id === selectedDayId);
  
  // 核心修正：調整優先級
  // 1. previewLocation: 搜尋中
  // 2. focusedLocation: 點擊列表中「在地圖上查看」
  // 3. selectedDay 第一個點: 切換 Day 1/2 時
  // 4. REGION_CENTERS: 有選地區但沒景點時
  // 5. userLocation: 初始保底
  const center = previewLocation?.location || 
                 focusedLocation || 
                 selectedDay?.activities[0]?.location || 
                 (selectedRegion ? REGION_CENTERS[selectedRegion] : null) || 
                 userLocation || 
                 { lat: 35.6895, lng: 139.6917 };

  const handleBackToSelf = () => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
      dispatch(setFocusedLocation(userLocation));
    }
  };

  const handleMapClick = (e: any) => {
    if (e.detail.placeId) {
      e.stop();
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails({ placeId: e.detail.placeId }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          setClickedLocation({
            pos: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
            name: place.name || '未知地點'
          });
        }
      });
    } else {
      setClickedLocation({
        pos: { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng },
        name: '自定義地點'
      });
    }
  };

  const handleAddFromMap = () => {
    if (clickedLocation && selectedDayId && selectedRegion) {
      dispatch(addActivity({
        region: selectedRegion,
        dayId: selectedDayId,
        activity: { name: clickedLocation.name, location: clickedLocation.pos }
      }));
      setClickedLocation(null);
    }
  };

  return (
    <div className="w-full h-full bg-slate-100 relative group/map text-left">
      <div className="absolute top-15 left-1/2 -translate-x-1/2 w-[90%] z-20 md:hidden transition-all duration-300">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/20 text-left">
          <PlaceSearch />
        </div>
      </div>

      <Map
        defaultCenter={center}
        defaultZoom={11}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        mapId={'bf51a910020fa1cf'} 
        onClick={handleMapClick}
      >
        <MapHandler center={center} />

        {userLocation && (
          <AdvancedMarker position={userLocation} zIndex={1000}>
            <div className="relative">
              <div className="absolute inset-0 w-8 h-8 bg-blue-500/20 rounded-full animate-ping -translate-x-1/4 -translate-y-1/4" />
              <div className="w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center p-0.5 border-2 border-blue-500">
                <div className="w-full h-full bg-blue-500 rounded-full" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {currentRegionPlans.map((day: DayPlan) => (
          day.activities.map((activity: Activity, idx: number) => (
            <AdvancedMarker
              key={`${day.id}-${idx}`}
              position={activity.location}
              title={activity.name}
            >
              <Pin background={day.color} glyphColor={'#fff'} borderColor={'#fff'} />
            </AdvancedMarker>
          ))
        ))}

        {/* 預覽標記 - 僅顯示發光黃點 */}
        {previewLocation && (
          <AdvancedMarker
            position={previewLocation.location}
            zIndex={2000}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 bg-yellow-400 rounded-full animate-ping opacity-30" />
              <Pin background={'#FACC15'} glyphColor={'#000'} borderColor={'#fff'} scale={1.4} />
            </div>
          </AdvancedMarker>
        )}

        {clickedLocation && (
          <InfoWindow
            position={clickedLocation.pos}
            onCloseClick={() => setClickedLocation(null)}
          >
            <div className="p-2 min-w-[150px] text-left">
              <h4 className="font-bold text-gray-800 text-sm mb-1">{clickedLocation.name}</h4>
              <p className="text-[10px] text-gray-400 mb-3">要將此地點加入 {selectedDayId?.toUpperCase()}嗎？</p>
              <button
                onClick={handleAddFromMap}
                disabled={!selectedDayId}
                className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                <Plus size={14} />
                新增至行程
              </button>
            </div>
          </InfoWindow>
        )}
      </Map>

      {userLocation && (
        <button 
          onClick={handleBackToSelf}
          className="absolute bottom-40 right-2 w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all active:scale-90 z-20"
          title="回到我的位置"
        >
          <Navigation size={24} fill="currentColor" className="rotate-45" />
        </button>
      )}
    </div>
  );
}
