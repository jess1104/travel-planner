import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, MapPin, Calendar, Map as MapIcon } from 'lucide-react';
import type { RootState } from './store';
import { selectRegion, selectDay } from './store/travelSlice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 這是一個常用的小工具，合併 Tailwind 類名時非常方便
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 使用 useSelector 從 redux 拿資料
  const { regions, selectedRegion, plans, selectedDayId } = useSelector((state: RootState) => state.travel);
  const dispatch = useDispatch();

  // 根據目前選中的地區和天數，找出對應的內容
  const currentPlans = plans[selectedRegion] || [];
  const selectedDay = currentPlans.find(p => p.id === selectedDayId) || currentPlans[0];

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
      {/* 漢堡選單 / 側邊欄 (Sidebar) */}
      <aside 
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
          isSidebarOpen ? "w-64" : "w-0 md:w-20 overflow-hidden"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          {isSidebarOpen && <h1 className="font-bold text-xl text-blue-600">Travel Go</h1>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {isSidebarOpen && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">我的旅程</p>}
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => dispatch(selectRegion(region))}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                selectedRegion === region 
                  ? "bg-blue-50 text-blue-600 font-medium" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <MapIcon size={20} />
              {isSidebarOpen && <span>{region}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 頂部標題 */}
        <header className="bg-white border-b border-gray-200 p-6 flex items-center gap-4">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
            >
              <Menu size={24} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedRegion} 行程規劃</h2>
          </div>
        </header>

        {/* 日期切換列 (使用顏色區分) */}
        <div className="p-6 bg-white flex gap-4 overflow-x-auto border-b">
          {currentPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => dispatch(selectDay(plan.id))}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border-2 transition-all",
                selectedDayId === plan.id
                  ? "shadow-md scale-105"
                  : "border-transparent bg-gray-50 opacity-60 hover:opacity-100"
              )}
              style={{ 
                borderColor: selectedDayId === plan.id ? plan.color : 'transparent',
                backgroundColor: selectedDayId === plan.id ? `${plan.color}15` : undefined,
                color: selectedDayId === plan.id ? plan.color : '#64748b'
              }}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: plan.color }}
              />
              <span className="font-bold whitespace-nowrap">{plan.id.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* 詳細景點內容 */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedDay ? (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Calendar className="text-gray-400" />
                <h3 className="text-2xl font-bold" style={{ color: selectedDay.color }}>
                  {selectedDay.title}
                </h3>
              </div>
              
              <div className="space-y-6">
                {selectedDay.activities.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-5 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group"
                  >
                    <div 
                      className="mt-1 w-10 h-10 rounded-full flex items-center justify-center text-white font-black shadow-inner"
                      style={{ backgroundColor: selectedDay.color }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl text-gray-800 mb-1">{activity}</h4>
                      <div className="flex items-center gap-1.5 text-blue-500 text-sm font-medium cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <MapPin size={16} />
                        <span>在地圖上查看</span>
                      </div>
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
      </main>
    </div>
  );
}

export default App;
