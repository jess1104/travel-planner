import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, MapPin, Calendar, Map as MapIcon, ChevronRight, List } from 'lucide-react';
import type { RootState } from './store';
import { selectRegion, selectDay } from './store/travelSlice';
import type { DayPlan, Activity } from './store/travelSlice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import TravelMap from './components/TravelMap'; // 引入地圖元件

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // 增加視圖切換 (特別是手機版)
  
  const { regions, selectedRegion, plans, selectedDayId } = useSelector((state: RootState) => state.travel);
  const dispatch = useDispatch();

  const currentPlans: DayPlan[] = plans[selectedRegion] || [];
  const selectedDay = currentPlans.find((p: DayPlan) => p.id === selectedDayId) || currentPlans[0];

  const handleRegionSelect = (region: string) => {
    dispatch(selectRegion(region));
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] w-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
      
      {/* 手機版遮罩 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 側邊欄 */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:w-20"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between min-h-[73px]">
          {(isSidebarOpen || window.innerWidth >= 768) && (
            <h1 className={cn("font-bold text-xl text-blue-600 truncate", !isSidebarOpen && "md:hidden")}>
              Travel Go
            </h1>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg ml-auto"
          >
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
                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                selectedRegion === region 
                  ? "bg-blue-50 text-blue-600 font-medium" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <MapIcon size={20} className="flex-shrink-0" />
              {(isSidebarOpen || (window.innerWidth < 768)) && <span className="truncate">{region}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 p-4 md:p-6 flex items-center gap-3 md:gap-4 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{selectedRegion} 行程規劃</h2>
          </div>
          
          {/* 手機版 列表/地圖 切換按鈕 */}
          <div className="flex bg-gray-100 p-1 rounded-lg md:hidden">
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'map' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}
            >
              <MapIcon size={20} />
            </button>
          </div>
        </header>

        {/* 日期切換列 */}
        <div className="px-4 py-3 md:px-6 md:py-4 bg-white flex gap-3 overflow-x-auto no-scrollbar border-b shadow-sm z-20">
          {currentPlans.map((plan: DayPlan) => (
            <button
              key={plan.id}
              onClick={() => dispatch(selectDay(plan.id))}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-sm md:text-base",
                selectedDayId === plan.id
                  ? "shadow-sm scale-105"
                  : "border-transparent bg-gray-50 opacity-60 hover:opacity-100"
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
          ))}
        </div>

        {/* 內容區：列表與地圖的容器 */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* 景點列表 (手機版根據 viewMode 顯示) */}
          <div className={cn(
            "flex-1 overflow-y-auto p-4 md:p-8 md:w-1/2 transition-all duration-300",
            viewMode === 'map' ? "hidden md:block" : "block"
          )}>
            {selectedDay ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <Calendar className="text-gray-400 w-5 h-5 md:w-6 md:h-6" />
                  <h3 className="text-lg md:text-2xl font-bold" style={{ color: selectedDay.color }}>
                    {selectedDay.title}
                  </h3>
                </div>
                
                <div className="space-y-4 md:space-y-6">
                  {selectedDay.activities.map((activity: Activity, index: number) => (
                    <div 
                      key={index}
                      className="flex items-start gap-4 md:gap-5 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group active:scale-[0.98] md:active:scale-100"
                    >
                      <div 
                        className="mt-0.5 w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm md:text-base shadow-inner"
                        style={{ backgroundColor: selectedDay.color }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-base md:text-xl text-gray-800 mb-1 truncate md:whitespace-normal">{activity.name}</h4>
                        <button 
                          onClick={() => setViewMode('map')}
                          className="flex items-center gap-1.5 text-blue-500 text-xs md:text-sm font-medium cursor-pointer md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                          <MapPin size={14} className="md:w-4 md:h-4" />
                          <span>在地圖上查看</span>
                          <ChevronRight size={12} className="md:hidden ml-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                請選擇日期來查看行程
              </div>
            )}
          </div>

          {/* 地圖區域 (電腦版佔一半，手機版佔全螢幕) */}
          <div className={cn(
            "flex-1 md:w-1/2 border-l border-gray-200 transition-all duration-300",
            viewMode === 'list' ? "hidden md:block" : "block"
          )}>
            <TravelMap />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
