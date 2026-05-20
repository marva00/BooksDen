import { useEffect, useMemo, useState } from 'react';
import { FiCpu, FiPercent } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
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

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getCurrentDiscount = (oldPrice, newPrice) => {
  const listPrice = Number(oldPrice || 0);
  const salePrice = Number(newPrice || 0);

  if (listPrice <= 0 || salePrice <= 0 || listPrice <= salePrice) return 20;
  return Math.min(50, Math.max(0, Math.round(((listPrice - salePrice) / listPrice) * 100 / 10) * 10));
};

const PromotionalScenarioEngine = ({ oldPrice = 0, newPrice = 0, onApplyDiscount }) => {
  const [simulatedDiscount, setSimulatedDiscount] = useState(getCurrentDiscount(oldPrice, newPrice));
  const basePrice = Number(oldPrice || newPrice || 850);

  useEffect(() => {
    setSimulatedDiscount(getCurrentDiscount(oldPrice, newPrice));
  }, [oldPrice, newPrice]);

  const simulationMetrics = useMemo(() => {
    const discount = Number(simulatedDiscount || 0);
    const baseWeeklySales = 40;
    const elasticityCoefficient = 2.0;
    const salesMultiplier = 1 + (discount / 100) * elasticityCoefficient;
    const calculatedUnits = Math.round(baseWeeklySales * salesMultiplier);

    const unitPrice = basePrice * (1 - discount / 100);
    const totalRevenue = calculatedUnits * unitPrice;
    const costOfGoodsPercent = 0.55;
    const totalProfit = totalRevenue - calculatedUnits * (basePrice * costOfGoodsPercent);

    let status = 'optimal';
    let message = 'AI Verdict: Perfect elasticity point. Volume expansion cleanly outpaces your markdown reduction.';

    if (discount === 0) {
      status = 'neutral';
      message = 'AI Verdict: Standard price points active. Margins secure but seasonal inventory clear rate remains flat.';
    } else if (discount > 30) {
      status = 'loss-warning';
      message = 'AI Warning: Volume threshold reached but discount is too deep. Gross net-margins are collapsing despite high unit turnover.';
    } else if (discount < 15) {
      status = 'under-powered';
      message = 'AI Advisory: Small markdown entry. Not enough user incentive to trigger major customer conversion velocity adjustments.';
    }

    return {
      calculatedUnits,
      unitPrice,
      totalRevenue,
      totalProfit,
      status,
      message,
    };
  }, [basePrice, simulatedDiscount]);

  const chartDataStructure = useMemo(() => {
    const modifications = [0, 10, 20, 30, 40, 50];
    const baseWeeklySales = 40;
    const elasticityCoefficient = 2.0;

    const volumeData = modifications.map((discount) =>
      Math.round(baseWeeklySales * (1 + (discount / 100) * elasticityCoefficient))
    );
    const grossRevenueData = modifications.map(
      (discount, index) => volumeData[index] * (basePrice * (1 - discount / 100))
    );

    return {
      labels: modifications.map((discount) => (discount === 0 ? 'Base Price' : `-${discount}% Disc`)),
      datasets: [
        {
          label: 'Estimated Weekly Revenue (PKR)',
          data: grossRevenueData,
          borderColor: '#0f172a',
          backgroundColor: modifications.map((discount) =>
            discount === Number(simulatedDiscount) ? '#38bdf8' : 'rgba(15, 23, 42, 0.1)'
          ),
          type: 'bar',
          yAxisID: 'yRevenue',
          borderRadius: 6,
        },
        {
          label: 'Predicted Sales Volume (Units)',
          data: volumeData,
          borderColor: '#38bdf8',
          backgroundColor: 'transparent',
          type: 'line',
          yAxisID: 'yVolume',
          pointRadius: 5,
          pointBackgroundColor: '#0f172a',
          tension: 0.2,
        },
      ],
    };
  }, [basePrice, simulatedDiscount]);

  const handleApplyDiscount = () => {
    if (typeof onApplyDiscount !== 'function') return;
    onApplyDiscount(Number(simulationMetrics.unitPrice.toFixed(0)));
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
      <article className="card-surface bg-white p-5">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">Interactive Elasticity & Markdown Yield Curves</h4>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Simulate how a markdown may change weekly revenue before saving the product price.
          </p>
        </div>
        <div className="h-80">
          <Bar
            data={chartDataStructure}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                yRevenue: {
                  type: 'linear',
                  position: 'left',
                  title: { display: true, text: 'Simulated Gross Revenue (PKR)', font: { weight: 'bold' } },
                },
                yVolume: {
                  type: 'linear',
                  position: 'right',
                  grid: { drawOnChartArea: false },
                  title: { display: true, text: 'Expected Volume Run-Rate (Units)', font: { weight: 'bold' } },
                },
              },
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </div>
      </article>

      <article className="card-surface flex flex-col justify-between bg-white p-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#0ea5e9]">
            <FiPercent className="h-5 w-5" />
            <h4 className="text-base font-semibold text-slate-900">Promotional Scenario Engine</h4>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Set Target Campaign Markdown</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm text-[#0f172a]">
                {simulatedDiscount}% Off
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="10"
              value={simulatedDiscount}
              onChange={(event) => setSimulatedDiscount(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#0f172a]"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Base</span>
              <span>-10%</span>
              <span>-20%</span>
              <span>-30%</span>
              <span>-40%</span>
              <span>Half Off</span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <FiCpu className="text-[#0ea5e9]" /> Dynamic Revenue Forecast
            </p>

            <div className="grid grid-cols-2 gap-2 text-slate-800">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <span className="block text-[10px] font-bold uppercase text-slate-400">New Item Price</span>
                <strong className="text-sm font-black text-slate-900">{formatCurrency(simulationMetrics.unitPrice)}</strong>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Est. Unit Sales</span>
                <strong className="text-sm font-black text-[#0f172a]">
                  {simulationMetrics.calculatedUnits} books/wk
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-800">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Est. Revenue</span>
                <strong className="text-sm font-black text-slate-900">
                  {formatCurrency(simulationMetrics.totalRevenue)}
                </strong>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Est. Profit</span>
                <strong className="text-sm font-black text-slate-900">
                  {formatCurrency(simulationMetrics.totalProfit)}
                </strong>
              </div>
            </div>

            <div
              className={`rounded-xl border p-3 text-xs font-semibold leading-relaxed transition-all ${
                simulationMetrics.status === 'loss-warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : simulationMetrics.status === 'optimal'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              {simulationMetrics.message}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApplyDiscount}
          disabled={!basePrice || !onApplyDiscount}
          className="admin-btn-primary mt-4 w-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Apply Forecast Price
        </button>
      </article>
    </section>
  );
};

export default PromotionalScenarioEngine;
