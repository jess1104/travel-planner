import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, MapPin, Calendar, Map as MapIcon, List, PlusCircle } from 'lucide-react';
import type { RootState } from './store';
import { selectRegion, selectDay, removeActivity, addDay, deleteDay, setFocusedLocation, setUserLocation, resetSelection } from './store/travelSlice';
import type { DayPlan, Activity, Location } from './store/travelSlice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import TravelMap from './components/TravelMap';
import PlaceSearch from './components/PlaceSearch';
import { APIProvider } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  
  const { regions, selectedRegion, plans, selectedDayId } = useSelector((state: RootState) => state.travel);
  const dispatch = useDispatch();

  // 一開始就去抓實際位置
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch(setUserLocation({ lat: latitude, lng: longitude }));
        },
        (error) => console.error("定位失敗:", error.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [dispatch]);

  const currentPlans: DayPlan[] = selectedRegion ? (plans[selectedRegion] || []) : [];
  const selectedDay = currentPlans.find((p: DayPlan) => p.id === selectedDayId);

  const handleRegionSelect = (region: string) => {
    dispatch(selectRegion(region));
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleReset = () => {
    dispatch(resetSelection());
    setViewMode('map'); // 回到地圖視圖
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleAddDay = () => {
    dispatch(addDay());
  };

  const handleDeleteDay = (e: React.MouseEvent, dayId: string) => {
    e.stopPropagation();
    if (confirm(`確定要刪除整個 ${dayId.toUpperCase()} 的行程嗎？`)) {
      dispatch(deleteDay({ region: selectedRegion!, dayId }));
    }
  };

  const handleDeleteActivity = (index: number) => {
    if (selectedDayId && selectedRegion) {
      dispatch(removeActivity({ region: selectedRegion, dayId: selectedDayId, index }));
    }
  };

  const handleViewOnMap = (location: Location) => {
    dispatch(setFocusedLocation(location));
    setViewMode('map');
  };

  return (
    <APIProvider apiKey={API_KEY} libraries={['places']}>
      <div className="flex h-[100dvh] w-screen bg-gray-50 overflow-hidden font-sans text-slate-900 text-left">
        
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:w-20"
        )}>
          <div className="p-4 border-b flex items-center justify-between min-h-[73px]">
            {(isSidebarOpen || window.innerWidth >= 768) && (
              <button 
                onClick={handleReset}
                className={cn("font-bold text-xl text-blue-600 truncate hover:opacity-70 transition-opacity", !isSidebarOpen && "md:hidden")}
              >
                Travel Go
              </button>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg ml-auto">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {isSidebarOpen && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">我的旅程</p>}
            {regions.map((region: string) => (
              <button
                key={region}
                onClick={() => handleRegionSelect(region)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                  selectedRegion === region ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <MapIcon size={20} className="flex-shrink-0" />
                {(isSidebarOpen || (window.innerWidth < 768)) && <span className="truncate">{region}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="bg-white border-b border-gray-200 p-4 md:p-6 flex items-center gap-3 md:gap-4 sticky top-0 z-30 min-h-[73px] md:min-h-[89px]">
            {(!isSidebarOpen || window.innerWidth < 768) && (
              <button onClick={() => setIsSidebarOpen(true)} className={cn("p-2 hover:bg-gray-100 rounded-lg", isSidebarOpen && "md:hidden")}>
                <Menu size={24} />
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              {selectedRegion ? (
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{selectedRegion} 行程規劃</h2>
              ) : (
                <button 
                  onClick={handleReset}
                  className="text-xl md:text-2xl font-bold text-blue-600 hover:opacity-70 transition-opacity"
                >
                  Travel Go
                </button>
              )}
            </div>
            
            {selectedRegion && (
              <div className="flex bg-gray-100 p-1 rounded-lg md:hidden">
                <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>
                  <List size={20} />
                </button>
                <button onClick={() => setViewMode('map')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'map' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>
                  <MapIcon size={20} />
                </button>
              </div>
            )}
          </header>

          {selectedRegion && (
            <div className="px-4 py-3 md:px-6 md:py-4 bg-white flex items-center gap-4 overflow-x-auto no-scrollbar border-b shadow-sm z-20">
              {currentPlans.map((plan: DayPlan) => (
                <div key={plan.id} className="relative group shrink-0">
                  <button
                    onClick={() => dispatch(selectDay(plan.id))}
                    className={cn(
                      "flex items-center gap-2 pl-4 pr-10 py-2 rounded-full border-2 transition-all text-sm md:text-base relative",
                      selectedDayId === plan.id ? "shadow-md scale-105" : "border-transparent bg-gray-50 opacity-60 hover:opacity-100"
                    )}
                    style={{ 
                      borderColor: selectedDayId === plan.id ? plan.color : 'transparent',
                      backgroundColor: selectedDayId === plan.id ? `${plan.color}15` : undefined,
                      color: selectedDayId === plan.id ? plan.color : '#64748b'
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="font-bold whitespace-nowrap">{plan.id.toUpperCase()}</span>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteDay(e, plan.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white text-gray-400 md:text-gray-300 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button 
                onClick={handleAddDay}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
              >
                <PlusCircle size={28} />
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            <div className={cn(
              "flex-1 overflow-y-auto p-4 md:p-8 md:w-1/2 transition-all duration-300",
              (viewMode === 'map' || !selectedRegion) ? "hidden md:block" : "block"
            )}>
              {selectedRegion ? (
                <div className="max-w-2xl mx-auto space-y-6 text-left">
                  <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 shadow-inner">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter mb-2 ml-1">快速新增景點</p>
                    <PlaceSearch />
                  </div>

                  {selectedDay ? (
                    <div>
                      <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <Calendar className="text-gray-400 w-5 h-5 md:w-6 md:h-6" />
                        <h3 className="text-lg md:text-2xl font-bold" style={{ color: selectedDay.color }}>
                          {selectedDay.title}
                        </h3>
                      </div>
                      
                      <div className="space-y-4 md:space-y-6">
                        {selectedDay.activities.map((activity: Activity, index: number) => (
                          <div key={index} className="flex items-start gap-4 md:gap-5 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group active:scale-[0.98] md:active:scale-100">
                            <div className="mt-0.5 w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm md:text-base shadow-inner" style={{ backgroundColor: selectedDay.color }}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 text-left">
                                <h4 className="font-bold text-base md:text-xl text-gray-800 truncate md:whitespace-normal">{activity.name}</h4>
                                <button onClick={() => handleDeleteActivity(index)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                                  <X size={20} />
                                </button>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <button onClick={() => handleViewOnMap(activity.location)} className="flex items-center gap-1.5 text-blue-500 text-xs md:text-sm font-medium hover:underline">
                                  <MapPin size={14} />
                                  <span>在地圖上查看</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl italic text-left p-8">
                      請點擊上方的「+」按鈕開始規劃行程！
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-gray-400">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-400">
                    <MapIcon size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700">準備好要去哪裡玩了嗎？</h3>
                  <p className="max-w-xs">請點選左側選單中的地區，開始規劃你的專屬旅程。</p>
                </div>
              )}
            </div>

            <div className={cn(
              "flex-1 md:w-1/2 border-l border-gray-200 transition-all duration-300",
              (viewMode === 'list' && selectedRegion) ? "hidden md:block" : "block"
            )}>
              <TravelMap />
            </div>
          </div>
        </main>
      </div>
    </APIProvider>
  );
}

export default App;
