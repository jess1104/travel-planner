import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, MapPin, ChevronDown, Landmark, Check, ChevronUp } from 'lucide-react';
import { addActivity, setPreviewLocation, addRegion } from '../store/travelSlice';
import type { RootState } from '../store';

export default function PlaceSearch() {
  const dispatch = useDispatch();
  const { regions, plans, selectedRegion, selectedDayId } = useSelector((state: RootState) => state.travel);
  
  const [inputValue, setInputValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true); // 控制面板收合
  
  const [targetRegion, setTargetRegion] = useState(selectedRegion || (regions[0] || ''));
  const [targetDayId, setTargetDayId] = useState(selectedDayId || 'day1');
  
  const [isCreatingNewRegion, setIsCreatingNewRegion] = useState(false);
  const [newRegionInput, setNewRegionName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (selectedRegion) setTargetRegion(selectedRegion);
    if (selectedDayId) setTargetDayId(selectedDayId);
  }, [selectedRegion, selectedDayId]);

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
        setIsExpanded(true); // 搜尋到新地點時自動展開
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
      if (e.key === 'Enter' && !selectedPlace) e.preventDefault();
    };
    inputRef.current.addEventListener('keydown', preventSubmit);

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
      inputRef.current?.removeEventListener('keydown', preventSubmit);
    };
  }, [placesLib, dispatch, selectedPlace]);

  const handleAdd = () => {
    if (!selectedPlace || !selectedPlace.geometry?.location) return;

    let finalRegion = targetRegion;

    if (isCreatingNewRegion) {
      if (!newRegionInput.trim()) return;
      finalRegion = newRegionInput.trim();
      dispatch(addRegion(finalRegion));
    }

    if (finalRegion) {
      dispatch(addActivity({
        region: finalRegion,
        dayId: isCreatingNewRegion ? 'day1' : targetDayId,
        activity: {
          name: selectedPlace.name || '未知地點',
          location: {
            lat: selectedPlace.geometry.location.lat(),
            lng: selectedPlace.geometry.location.lng()
          }
        }
      }));

      setInputValue('');
      setSelectedPlace(null);
      setIsCreatingNewRegion(false);
      setNewRegionName('');
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedPlace(null);
    dispatch(setPreviewLocation(null));
    setIsCreatingNewRegion(false);
  };

  return (
    <div className="relative w-full space-y-2">
      {/* 搜尋框 */}
      <div className="flex items-center gap-2 bg-white border-2 border-gray-100 rounded-2xl px-4 py-2 focus-within:border-blue-400 transition-all shadow-sm">
        <Search className="text-gray-400 w-5 h-5 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (e.target.value === '') handleClear();
          }}
          placeholder="搜尋想去的景點..."
          className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 text-sm w-full"
        />
        {selectedPlace && (
          <button onClick={handleAdd} className="bg-blue-600 text-white p-1.5 rounded-xl hover:bg-blue-700 shadow-sm transition-all">
            <Check size={18} />
          </button>
        )}
      </div>
      
      {/* 收折式操作面板 */}
      {selectedPlace && (
        <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out">
          {/* 面板 Header：點擊可切換收合 */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors group/header"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0 group-hover/header:bg-blue-100 transition-colors">
                <Landmark size={20} />
              </div>
              <div className="truncate text-left">
                <span className="text-sm font-black text-gray-800 block truncate">{selectedPlace.name}</span>
                {!isExpanded && <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">點擊展開設定目的地</p>}
              </div>
            </div>
            
            {/* 更顯眼的收折按鈕 */}
            <div className={`ml-4 p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-gray-100 text-gray-600 rotate-0' : 'bg-gray-400 text-white rotate-180 shadow-md shadow-gray-200'}`}>
              <ChevronUp size={20} strokeWidth={3} />
            </div>
          </div>
          
          {/* 可收合的詳細內容 */}
          <div className={`px-4 pb-4 space-y-4 ${isExpanded ? 'block animate-in fade-in slide-in-from-top-2' : 'hidden'}`}>
            <div className="h-px bg-gray-50 w-full" />
            
            <div className="space-y-3 text-left">
              {/* 目的地 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">目的地</label>
                  <button onClick={() => setIsCreatingNewRegion(!isCreatingNewRegion)} className="text-[10px] font-bold text-blue-500 hover:underline">
                    {isCreatingNewRegion ? "選擇現有" : "+ 新增"}
                  </button>
                </div>
                {isCreatingNewRegion ? (
                  <input autoFocus type="text" placeholder="例如：泰國" value={newRegionInput} onChange={(e) => setNewRegionName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="w-full bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold text-blue-700 outline-none shadow-inner" />
                ) : (
                  <div className="relative">
                    <select value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 outline-none focus:bg-white transition-all">
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                )}
              </div>

              {/* 天數 */}
              {!isCreatingNewRegion && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">安排在第幾天</label>
                  <div className="relative">
                    <select value={targetDayId} onChange={(e) => setTargetDayId(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 outline-none focus:bg-white transition-all">
                      {(plans[targetRegion] || []).map(p => (
                        <option key={p.id} value={p.id}>{p.id.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-black text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Check size={16} />
              確認加入行程
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
