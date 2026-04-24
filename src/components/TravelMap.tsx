import { useEffect, useState } from 'react';
import { Map, AdvancedMarker, Pin, useMap, InfoWindow, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Navigation, X, Clock, Car } from 'lucide-react';
import type { RootState } from '../store';
import { addActivity, setFocusedLocation, setNavigationTarget } from '../store/travelSlice';
import type { DayPlan, Activity, Location } from '../store/travelSlice';
import PlaceSearch from './PlaceSearch';

// 定義各地區的中心點
const REGION_CENTERS: Record<string, Location> = {
  'LA': { lat: 34.0522, lng: -118.2437 },
  '東京': { lat: 35.6895, lng: 139.6917 },
  '台北': { lat: 25.0339, lng: 121.5644 }
};

// 專門處理導航路線繪製的元件
function Directions() {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const { userLocation, navigationTarget } = useSelector((state: RootState) => state.travel);
  
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ 
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !userLocation || !navigationTarget) {
      if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
      setDuration('');
      return;
    }

    directionsService.route({
      origin: userLocation,
      destination: navigationTarget.location,
      travelMode: google.maps.TravelMode.DRIVING
    }).then(response => {
      directionsRenderer.setDirections(response);
      const leg = response.routes[0].legs[0];
      if (leg && leg.duration) {
        setDuration(leg.duration.text);
      }
    }).catch(e => console.error("導航失敗:", e));

  }, [directionsService, directionsRenderer, userLocation, navigationTarget]);

  if (!navigationTarget || !duration) return null;

  return (
    <div className="absolute bottom-5 left-4 right-4 md:left-auto md:right-4 md:w-64 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-blue-100 z-30 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-blue-600">
          <Car size={18} />
          <span className="text-xs font-black uppercase tracking-widest">建議路線</span>
        </div>
        <button onClick={() => setDuration('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <h4 className="font-bold text-gray-800 text-sm truncate mb-1">到 {navigationTarget.name}</h4>
      <div className="flex items-center gap-1.5 text-blue-600 font-black text-xl">
        <Clock size={20} />
        <span>{duration}</span>
      </div>
    </div>
  );
}

function MapHandler({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(13);
    }
  }, [map, center]);
  return null;
}

export default function TravelMap() {
  const dispatch = useDispatch();
  const map = useMap();
  
  const { plans, selectedRegion, selectedDayId, previewLocation, focusedLocation, userLocation, navigationTarget } = useSelector((state: RootState) => state.travel);
  
  const [clickedLocation, setClickedLocation] = useState<{ pos: Location, name: string } | null>(null);

  const currentRegionPlans = plans[selectedRegion || ''] || [];
  const selectedDay = currentRegionPlans.find(p => p.id === selectedDayId);
  
  const center = previewLocation?.location || 
                 focusedLocation || 
                 selectedDay?.activities[0]?.location || 
                 (selectedRegion ? REGION_CENTERS[selectedRegion] : null) || 
                 userLocation || 
                 { lat: 25.0339, lng: 121.5644 };

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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] z-20 md:hidden transition-all duration-300">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/20 text-left">
          <PlaceSearch />
        </div>
      </div>

      <Map
        defaultCenter={center}
        defaultZoom={11}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        onClick={handleMapClick}
      >
        <MapHandler center={center} />
        <Directions />

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
              onClick={() => dispatch(setNavigationTarget(activity))} // 點擊地圖上的 Pin 直接開始導航
            >
              <Pin background={day.color} glyphColor={'#fff'} borderColor={'#fff'} />
            </AdvancedMarker>
          ))
        ))}

        {previewLocation && (
          <AdvancedMarker position={previewLocation.location} zIndex={2000}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 bg-yellow-400 rounded-full animate-ping opacity-30" />
              <Pin background={'#FACC15'} glyphColor={'#000'} borderColor={'#fff'} scale={1.4} />
            </div>
          </AdvancedMarker>
        )}

        {clickedLocation && (
          <InfoWindow position={clickedLocation.pos} onCloseClick={() => setClickedLocation(null)}>
            <div className="p-2 min-w-[150px] text-left">
              <h4 className="font-bold text-gray-800 text-sm mb-1">{clickedLocation.name}</h4>
              <p className="text-[10px] text-gray-400 mb-3">要將此地點加入 {selectedDayId?.toUpperCase()}嗎？</p>
              <button onClick={handleAddFromMap} disabled={!selectedDayId} className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
                <Plus size={14} />
                新增至行程
              </button>
            </div>
          </InfoWindow>
        )}
      </Map>

      {navigationTarget && (
        <button onClick={() => dispatch(setNavigationTarget(null))} className="absolute top-20 right-4 p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:bg-red-600 transition-all z-20 flex items-center gap-2 font-bold text-xs">
          <X size={16} />
          停止導航
        </button>
      )}

      {userLocation && (
        <button onClick={handleBackToSelf} className="absolute bottom-40 right-2 w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all active:scale-90 z-20" title="回到我的位置">
          <Navigation size={24} fill="currentColor" className="rotate-45" />
        </button>
      )}
    </div>
  );
}
