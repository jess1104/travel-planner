import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, MapPin } from 'lucide-react';
import { addActivity, setPreviewLocation } from '../store/travelSlice';
import type { RootState } from '../store';

export default function PlaceSearch() {
  const dispatch = useDispatch();
  const { selectedRegion, selectedDayId } = useSelector((state: RootState) => state.travel);
  
  const [inputValue, setInputValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ['name', 'geometry', 'formatted_address'],
      types: ['establishment', 'geocode']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setSelectedPlace(place);
        setInputValue(place.name || '');

        // 新增：發送預覽點到 Redux，讓地圖同步
        dispatch(setPreviewLocation({
          name: place.name || '預覽地點',
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        }));
      }
    });

    const preventSubmit = (e: KeyboardEvent) => {
      if (e.key === 'Enter') e.preventDefault();
    };
    inputRef.current.addEventListener('keydown', preventSubmit);

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
      inputRef.current?.removeEventListener('keydown', preventSubmit);
    };
  }, [placesLib, dispatch]);

  const handleAdd = () => {
    if (selectedPlace && selectedPlace.geometry?.location && selectedDayId) {
      const newActivity = {
        name: selectedPlace.name || '未知地點',
        location: {
          lat: selectedPlace.geometry.location.lat(),
          lng: selectedPlace.geometry.location.lng()
        }
      };

      dispatch(addActivity({
        region: selectedRegion,
        dayId: selectedDayId,
        activity: newActivity
      }));

      setInputValue('');
      setSelectedPlace(null);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedPlace(null);
    dispatch(setPreviewLocation(null)); // 清除預覽
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 bg-white border-2 border-gray-100 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-sm">
        <Search className="text-gray-400 w-5 h-5 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (e.target.value === '') handleClear();
          }}
          placeholder={`搜尋 ${selectedRegion} 的景點...`}
          className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 text-sm md:text-base w-full"
        />
        {selectedPlace && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 text-sm font-bold shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>新增</span>
          </button>
        )}
      </div>
      
      {selectedPlace && (
        <div className="mt-2 px-3 py-2 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <MapPin size={14} className="text-blue-500" />
          <span className="text-xs text-blue-700 truncate font-medium flex-1">
            已選取：{selectedPlace.formatted_address}
          </span>
          <button 
            onClick={handleClear}
            className="text-[10px] text-blue-400 hover:text-blue-600 font-bold underline px-1"
          >
            清除
          </button>
        </div>
      )}
      
      {!selectedDayId && (
        <p className="text-[10px] text-red-500 mt-1.5 ml-2 font-medium flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          請先點選上方日期再新增景點
        </p>
      )}
    </div>
  );
}
