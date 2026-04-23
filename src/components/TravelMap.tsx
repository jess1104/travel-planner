import { useEffect, useState } from 'react';
import { Map, AdvancedMarker, Pin, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { useSelector, useDispatch } from 'react-redux';
import { Plus } from 'lucide-react';
import type { RootState } from '../store';
import { addActivity } from '../store/travelSlice';
import type { DayPlan, Activity, Location } from '../store/travelSlice';
import PlaceSearch from './PlaceSearch';

// 定義各地區的中心點
const REGION_CENTERS: Record<string, Location> = {
  'LA': { lat: 34.0522, lng: -118.2437 },
  '東京': { lat: 35.6895, lng: 139.6917 }
};

function MapHandler({ center, zoom = 12 }: { center: google.maps.LatLngLiteral, zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      if (zoom) map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

export default function TravelMap() {
  const dispatch = useDispatch();
  const { plans, selectedRegion, selectedDayId, previewLocation, focusedLocation } = useSelector((state: RootState) => state.travel);
  
  const [clickedLocation, setClickedLocation] = useState<{ pos: Location, name: string } | null>(null);

  const currentRegionPlans = plans[selectedRegion] || [];
  const selectedDay = currentRegionPlans.find(p => p.id === selectedDayId);
  
  // 修正後的中心點邏輯優先級：
  // 1. 搜尋預覽點 (previewLocation)
  // 2. 列表點選聚焦 (focusedLocation)
  // 3. 當天第一個景點
  // 4. 地區中心點
  const center = previewLocation?.location || 
                 focusedLocation || 
                 selectedDay?.activities[0]?.location || 
                 REGION_CENTERS[selectedRegion] || 
                 { lat: 35.6895, lng: 139.6917 };

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
    if (clickedLocation && selectedDayId) {
      dispatch(addActivity({
        region: selectedRegion,
        dayId: selectedDayId,
        activity: { name: clickedLocation.name, location: clickedLocation.pos }
      }));
      setClickedLocation(null);
    }
  };

  return (
    <div className="w-full h-full bg-slate-100 relative group/map">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] z-20 md:hidden transition-all duration-300">
        <div className="bg-white/90 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-white/20">
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
        {/* 如果有聚焦座標或預覽座標，拉近一點看 */}
        <MapHandler center={center} zoom={(previewLocation || focusedLocation) ? 15 : 12} />

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

        {previewLocation && (
          <AdvancedMarker
            position={previewLocation.location}
            title={`預覽：${previewLocation.name}`}
            zIndex={100}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 bg-yellow-400 rounded-full animate-ping opacity-20" />
              <Pin background={'#FACC15'} glyphColor={'#000'} borderColor={'#fff'} scale={1.2} />
            </div>
          </AdvancedMarker>
        )}

        {clickedLocation && (
          <InfoWindow
            position={clickedLocation.pos}
            onCloseClick={() => setClickedLocation(null)}
          >
            <div className="p-2 min-w-[150px]">
              <h4 className="font-bold text-gray-800 text-sm mb-1">{clickedLocation.name}</h4>
              <p className="text-[10px] text-gray-400 mb-3">要將此地點加入 {selectedDayId?.toUpperCase()} 嗎？</p>
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
    </div>
  );
}
