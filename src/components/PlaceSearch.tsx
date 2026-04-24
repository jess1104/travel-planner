import { useEffect, useState, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, ChevronDown, Landmark, Check, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { addActivity, setPreviewLocation, addRegion, addDay } from '../store/travelSlice';
import type { RootState } from '../store';

export default function PlaceSearch() {
  const dispatch = useDispatch();
  const { regions, plans, selectedRegion, selectedDayId } = useSelector((state: RootState) => state.travel);
  
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{ id: string, name: string, address?: string, location?: google.maps.LatLng } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [targetRegion, setTargetRegion] = useState(selectedRegion || (regions[0] || ''));
  const [targetDayId, setTargetDayId] = useState(selectedDayId || 'day1');
  
  const [isCreatingNewRegion, setIsCreatingNewRegion] = useState(false);
  const [isCreatingNewDay, setIsCreatingNewDay] = useState(false);
  const [newRegionInput, setNewRegionName] = useState('');

  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (selectedRegion) setTargetRegion(selectedRegion);
    if (selectedDayId) setTargetDayId(selectedDayId);
  }, [selectedRegion, selectedDayId]);

  // 使用 AutocompleteService 獲取建議 (更穩定)
  const fetchSuggestions = useCallback((text: string) => {
    if (!placesLib || !text.trim()) {
      setSuggestions([]);
      return;
    }

    const service = new placesLib.AutocompleteService();
    setIsLoading(true);
    
    service.getPlacePredictions({ input: text }, (predictions, status) => {
      setIsLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions);
      } else {
        setSuggestions([]);
      }
    });
  }, [placesLib]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue && !selectedPlace) fetchSuggestions(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, fetchSuggestions, selectedPlace]);

  // 點選建議後，獲取景點詳細資訊
  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompletePrediction) => {
    if (!placesLib) return;
    
    setIsLoading(true);
    // 建立一個臨時 div 給 PlacesService 使用 (新版 API 要求)
    const service = new placesLib.PlacesService(document.createElement('div'));
    
    service.getDetails({ 
      placeId: suggestion.place_id,
      fields: ['name', 'geometry', 'formatted_address']
    }, (place, status) => {
      setIsLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
        const placeData = {
          id: suggestion.place_id,
          name: place.name || '未知地點',
          address: place.formatted_address,
          location: place.geometry.location
        };
        
        setSelectedPlace(placeData);
        setInputValue(place.name || '');
        setSuggestions([]);
        setIsExpanded(true);

        dispatch(setPreviewLocation({
          name: place.name || '預覽地點',
          location: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
      }
    });
  };

  const handleAdd = () => {
    if (!selectedPlace || !selectedPlace.location) return;

    let finalRegion = targetRegion;
    let finalDayId = targetDayId;

    if (isCreatingNewRegion) {
      if (!newRegionInput.trim()) return;
      finalRegion = newRegionInput.trim();
      dispatch(addRegion(finalRegion));
      finalDayId = 'day1';
    } else if (isCreatingNewDay) {
      const currentPlans = plans[targetRegion] || [];
      finalDayId = `day${currentPlans.length + 1}`;
      dispatch(addDay()); 
    }

    if (finalRegion && finalDayId) {
      dispatch(addActivity({
        region: finalRegion,
        dayId: finalDayId,
        activity: {
          name: selectedPlace.name,
          location: { lat: selectedPlace.location.lat(), lng: selectedPlace.location.lng() }
        }
      }));
      handleClear();
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedPlace(null);
    setSuggestions([]);
    dispatch(setPreviewLocation(null));
    setIsCreatingNewRegion(false);
    setIsCreatingNewDay(false);
    setNewRegionName('');
  };

  return (
    <div className="relative w-full space-y-2 text-left">
      <div className="flex items-center gap-2 bg-white border-2 border-gray-100 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 transition-all shadow-sm">
        {isLoading ? <Loader2 className="text-blue-500 w-5 h-5 animate-spin" /> : <Search className="text-gray-400 w-5 h-5 flex-shrink-0" />}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (selectedPlace) setSelectedPlace(null);
          }}
          placeholder="搜尋想去的景點..."
          className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 text-sm font-medium w-full"
        />
        {selectedPlace && (
          <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-90">
            <Check size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onClick={() => handleSelectSuggestion(s)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none text-left"
            >
              <MapPin size={18} className="text-gray-300 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-700 truncate">{s.structured_formatting.main_text}</p>
                <p className="text-[10px] text-gray-400 truncate">{s.structured_formatting.secondary_text}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {selectedPlace && (
        <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors group/header"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                <Landmark size={20} />
              </div>
              <div className="truncate">
                <span className="text-sm font-black text-gray-800 block truncate">{selectedPlace.name}</span>
                {!isExpanded && <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">點擊展開設定細節</p>}
              </div>
            </div>
            <div className={`ml-4 p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-gray-100 text-gray-600 rotate-0' : 'bg-blue-600 text-white rotate-180'}`}>
              <ChevronUp size={20} strokeWidth={3} />
            </div>
          </div>
          
          <div className={`px-4 pb-4 space-y-4 ${isExpanded ? 'block animate-in fade-in slide-in-from-top-2' : 'hidden'}`}>
            <div className="h-px bg-gray-50 w-full" />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">目的地</label>
                  <button onClick={() => { setIsCreatingNewRegion(!isCreatingNewRegion); setIsCreatingNewDay(false); }} className="text-[10px] font-bold text-blue-500 hover:underline">
                    {isCreatingNewRegion ? "選擇現有" : "+ 新增"}
                  </button>
                </div>
                {isCreatingNewRegion ? (
                  <input autoFocus type="text" placeholder="例如：曼谷" value={newRegionInput} onChange={(e) => setNewRegionName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="w-full bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-700 outline-none shadow-inner text-left" />
                ) : (
                  <div className="relative text-left">
                    <select value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 outline-none focus:bg-white transition-all text-left">
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                )}
              </div>

              {!isCreatingNewRegion && (
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">安排在第幾天</label>
                    <button onClick={() => setIsCreatingNewDay(!isCreatingNewDay)} className="text-[10px] font-bold text-blue-500 hover:underline">
                      {isCreatingNewDay ? "選擇現有" : "+ 新增"}
                    </button>
                  </div>
                  {isCreatingNewDay ? (
                    <div className="w-full bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center gap-2 text-green-700 animate-in slide-in-from-right-2">
                      <Sparkles size={16} className="shrink-0" />
                      <span className="text-xs font-black text-left">建立新日期 (Day { (plans[targetRegion]?.length || 0) + 1 })</span>
                    </div>
                  ) : (
                    <div className="relative text-left">
                      <select value={targetDayId} onChange={(e) => setTargetDayId(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 outline-none focus:bg-white transition-all text-left">
                        {(plans[targetRegion] || []).map(p => (
                          <option key={p.id} value={p.id}>{p.id.toUpperCase()}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Check size={18} />
              {(isCreatingNewRegion || isCreatingNewDay) ? '建立並加入行程' : '確認加入行程'}
            </button>
            
            <button onClick={handleClear} className="w-full text-[10px] text-gray-300 hover:text-red-400 font-bold transition-colors text-center">
              取消並清空
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
