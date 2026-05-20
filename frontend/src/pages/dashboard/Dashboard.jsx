import { useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiBookOpen,
  FiAlertTriangle,
  FiXCircle,
  FiShoppingBag,
  FiCpu,
  FiArrowRight
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

// ==========================================
// MOCK DATA CONFIGURATIONS (BRAND THEMED)
// ==========================================
const MOCK_RANGE_SERIES = {
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    current: [4200, 5100, 4800, 6200, 5900, 7800, 9100],
    previous: [3500, 3900, 4100, 4800, 5000, 6100, 6800],
  },
  '30d': {
    labels: ['Apr 19', 'Apr 22', 'Apr 25', 'Apr 28', 'May 1', 'May 4', 'May 7', 'May 10', 'May 13', 'May 16', 'May 17'],
    current: [1200, 1500, 1800, 2100, 2800, 3100, 3400, 4100, 4500, 5200, 6100],
    previous: [900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3800, 4200],
  }
};

const MOCK_HEATMAP_DATA = [
  { month: 'Jan', revenue: 36500, volume: 140 },
  { month: 'Feb', revenue: 32700, volume: 110 },
  { month: 'Mar', revenue: 40300, volume: 170 },
  { month: 'Apr', revenue: 44500, volume: 210 },
  { month: 'May', revenue: 43200, volume: 190 },
  { month: 'Jun', revenue: 36400, volume: 150 },
  { month: 'Jul', revenue: 40200, volume: 165 },
  { month: 'Aug', revenue: 48500, volume: 250 },
  { month: 'Sep', revenue: 63000, volume: 380 },
  { month: 'Oct', revenue: 64800, volume: 410 },
  { month: 'Nov', revenue: 40400, volume: 290 },
  { month: 'Dec', revenue: 50600, volume: 320 },
];

const MOCK_INVENTORY_ITEMS = [
  { id: 1, title: 'The Stationery Shop', currentStock: 6, avgWeeklySales: 14, predictedDemand: 45 },
  { id: 2, title: 'The Pragmatic Programmer', currentStock: 9, avgWeeklySales: 8, predictedDemand: 25 },
  { id: 3, title: 'JavaScript: The Good Parts', currentStock: 5, avgWeeklySales: 18, predictedDemand: 50 },
  { id: 4, title: 'Atomic Habits', currentStock: 2, avgWeeklySales: 22, predictedDemand: 80 },
  { id: 5, title: 'Sapiens', currentStock: 22, avgWeeklySales: 5, predictedDemand: 15 },
];

const MOCK_AI_DEMAND_FORECAST = [
  { title: 'Atomic Habits', growth: 42, confidence: 94 },
  { title: 'The Stationery Shop', growth: 35, confidence: 89 },
  { title: 'JavaScript: The Good Parts', growth: 28, confidence: 85 },
  { title: 'The Pragmatic Programmer', growth: 19, confidence: 81 },
  { title: 'Deep Work', growth: 15, confidence: 78 }
];

const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
const formatInteger = (val) => Number(val || 0).toLocaleString();

// ==========================================
// MAIN DASHBOARD CONSOLE COMPONENT
// ==========================================
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('sales'); 
  const [salesRange, setSalesRange] = useState('30d');

  const maxVolume = useMemo(() => Math.max(...MOCK_HEATMAP_DATA.map(d => d.volume)), []);
  const currentSalesSeries = useMemo(() => MOCK_RANGE_SERIES[salesRange] || MOCK_RANGE_SERIES['30d'], [salesRange]);

  const stockSummary = useMemo(() => {
    return {
      lowStock: MOCK_INVENTORY_ITEMS.filter(i => i.currentStock <= 10 && i.currentStock > 0).length,
      outOfStock: MOCK_INVENTORY_ITEMS.filter(i => i.currentStock === 0).length,
    };
  }, []);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen font-sans relative">

      {/* Main Console Top Navigation Panel Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Operations Control Console</p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Management Dashboard</h2>
        </div>

        {/* PERFECTLY ALIGNED AND SYNCED SEGMENTED TAB WRAPPER */}
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 border-none cursor-pointer ${
              activeTab === 'sales' ? 'text-white' : 'text-slate-600 bg-transparent hover:bg-slate-300/60 hover:text-slate-900'
            }`}
            style={activeTab === 'sales' ? { backgroundColor: '#0f172a' } : {}}
          >
            📊 Sales Performance
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 border-none cursor-pointer ${
              activeTab === 'inventory' ? 'text-white' : 'text-slate-600 bg-transparent hover:bg-slate-300/60 hover:text-slate-900'
            }`}
            style={activeTab === 'inventory' ? { backgroundColor: '#0f172a' } : {}}
          >
            📦 Inventory Logistics
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAB 1: SALES PERFORMANCE CONTROL GRAPHICS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
          
          {/* Card KPI Metrix Row Container Panels */}
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between min-h-[110px]">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-black text-slate-900 leading-none">{formatCurrency(125400)}</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-[#0f172a] shrink-0 w-12 h-12 flex items-center justify-center"><FiBarChart2 className="w-6 h-6" /></div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between min-h-[110px]">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                <h3 className="text-2xl font-black text-slate-900 leading-none">420</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-[#0f172a] shrink-0 w-12 h-12 flex items-center justify-center"><FiShoppingBag className="w-6 h-6" /></div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between min-h-[110px]">
              <div className="space-y-1 overflow-hidden">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Best Seller Book</p>
                <h3 className="text-base font-black text-slate-900 truncate pr-1">Atomic Habits</h3>
                <span className="text-xs font-bold text-[#0ea5e9] bg-sky-50 px-2 py-0.5 rounded-md inline-block">85 units sold</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-[#0f172a] shrink-0 w-12 h-12 flex items-center justify-center"><FiBookOpen className="w-6 h-6" /></div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between min-h-[110px]">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Order Value</p>
                <h3 className="text-2xl font-black text-slate-900 leading-none">{formatCurrency(299)}</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-[#0f172a] shrink-0 w-12 h-12 flex items-center justify-center"><FiBarChart2 className="w-6 h-6" /></div>
            </div>
          </section>

          {/* Full-width Sales Velocity Trend Chart Container */}
          <section className="w-full">
            <article className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Sales Velocity Trend</h4>
                  <p className="text-xs font-medium text-slate-400">Timeline monitoring compared with previous cycles.</p>
                </div>
                <select
                  value={salesRange}
                  onChange={(e) => setSalesRange(e.target.value)}
                  className="text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white text-slate-700 cursor-pointer outline-none focus:border-[#0f172a]"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              <div className="h-80">
                <Line
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                  data={{
                    labels: currentSalesSeries.labels,
                    datasets: [
                      { label: 'Current Period', data: currentSalesSeries.current, borderColor: '#0f172a', backgroundColor: 'transparent', pointRadius: 4, tension: 0.25 },
                      { label: 'Previous Period', data: currentSalesSeries.previous, borderColor: '#94a3b8', borderDash: [6, 6], backgroundColor: 'transparent', pointRadius: 2, tension: 0.25 }
                    ]
                  }}
                />
              </div>
            </article>
          </section>

          {/* Season-wise density matrix block element */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h4 className="font-bold text-slate-900 text-lg">Season-wise Sales Density Matrix</h4>
              <p className="text-xs font-medium text-slate-400 mb-4">Color-weighted blocks display direct seasonal transaction volumes cleanly.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {MOCK_HEATMAP_DATA.map((item) => {
                const opacityWeight = (item.volume / maxVolume) * 0.75 + 0.25; 
                const isDarkBg = opacityWeight > 0.6;
                return (
                  <div
                    key={item.month}
                    title={`Exact Avg: ${formatCurrency(item.revenue)} (${item.volume} items)`}
                    style={{ backgroundColor: `rgba(15, 23, 42, ${opacityWeight})` }}
                    className="p-4 rounded-xl flex flex-col justify-between h-24 border border-slate-900/5 transition-all duration-200 hover:scale-[1.04] cursor-pointer shadow-xs"
                  >
                    <span className={`text-sm font-black tracking-wide ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>{item.month}</span>
                    <span className={`text-xs font-black tracking-tight ${isDarkBg ? 'text-slate-100' : 'text-slate-800'}`}>{formatCurrency(item.revenue)}</span>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPERATIONAL INVENTORY MODULES AREA                                  */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
          
          {/* Dual-State Stock Overview Row Panel */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attention Items</p>
                <h3 className="text-sm font-bold text-amber-600 mt-0.5">{stockSummary.lowStock} Categories Running Low</h3>
              </div>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500"><FiAlertTriangle className="w-4 h-4" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Out of Stock</p>
                <h3 className="text-sm font-bold text-rose-600 mt-0.5">{stockSummary.outOfStock} Categories Depleted</h3>
              </div>
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500"><FiXCircle className="w-4 h-4" /></div>
            </div>
          </section>

          {/* STACKED AREA TOP: PRODUCT DEMAND FORECAST LIST */}
          <article className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 text-slate-800 rounded-lg"><FiCpu className="w-4 h-4" /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Product Demand Predictions</h4>
                <p className="text-[11px] text-slate-400">AI-predicted transaction trend vectors for current catalog books.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_AI_DEMAND_FORECAST.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/60 hover:bg-slate-100/50 transition-all">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                    <span className="text-[10px] font-medium text-slate-400">Confidence: {item.confidence}%</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md shrink-0">
                    +{item.growth}% demand
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* STACKED AREA BOTTOM: HIGHLY USER FRIENDLY SMART PROCUREMENT CONSOLE */}
          <article className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Procurement Order Console</h4>
                <p className="text-[11px] text-slate-400">Active stock lifecycle depletion data and auto-calculated restock recommendations.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3.5 pl-5">Catalog Book Title</th>
                    <th className="p-3.5 text-center">Available Stock</th>
                    <th className="p-3.5 text-center">Weekly Run-Rate</th>
                    <th className="p-3.5 pr-5 text-right">Smart Recommendation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {MOCK_INVENTORY_ITEMS.map((item) => {
                    const daysUntilStockout = parseFloat((item.currentStock / (item.avgWeeklySales / 7)).toFixed(1));
                    const isCritical = daysUntilStockout <= 3.0;
                    const calculatedReorder = item.predictedDemand - item.currentStock;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3.5 pl-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCritical ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                            {item.title}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-800">{formatInteger(item.currentStock)} units</td>
                        <td className="p-3.5 text-center text-slate-500">{formatInteger(item.avgWeeklySales)} units/wk</td>
                        <td className="p-3.5 pr-5 text-right">
                          {calculatedReorder <= 0 ? (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-100">
                              ✨ Stock Optimal (Surplus of {Math.abs(calculatedReorder)} units)
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md text-left">
                              <span>Demand calls for {item.predictedDemand} units</span>
                              <FiArrowRight className="text-slate-300" />
                              <span className="text-slate-900 font-bold">Secure at least {calculatedReorder} books</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
