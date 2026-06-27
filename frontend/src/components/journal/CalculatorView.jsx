import { useState } from "react";
export default function CalculatorView() {
  const [activeTab, setActiveTab] = useState("position");
  const [accountBalance, setAccountBalance] = useState(1e4);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entryPrice, setEntryPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [cashRisked, setCashRisked] = useState(null);
  const [positionSize, setPositionSize] = useState(null);
  const [notionalSize, setNotionalSize] = useState(null);
  const [leverageRequired, setLeverageRequired] = useState(null);
  const [rrEntry, setRrEntry] = useState(0);
  const [rrStop, setRrStop] = useState(0);
  const [rrTarget, setRrTarget] = useState(0);
  const [stopDistance, setStopDistance] = useState(null);
  const [targetDistance, setTargetDistance] = useState(null);
  const [rrRatio, setRrRatio] = useState(null);
  const applyPresetRisk = (pct) => {
    setRiskPercent(pct);
  };
  const calculatePositionSizing = (e) => {
    e.preventDefault();
    if (entryPrice <= 0 || stopLoss <= 0 || accountBalance <= 0) return;
    const riskCash = accountBalance * riskPercent / 100;
    const distance = Math.abs(entryPrice - stopLoss);
    if (distance <= 0) return;
    const units = riskCash / distance;
    const totalNotionalVal = units * entryPrice;
    const lev = totalNotionalVal / accountBalance;
    setCashRisked(parseFloat(riskCash.toFixed(2)));
    setPositionSize(parseFloat(units.toFixed(4)));
    setNotionalSize(parseFloat(totalNotionalVal.toFixed(2)));
    setLeverageRequired(parseFloat(lev.toFixed(1)));
  };
  const calculateRR = (e) => {
    e.preventDefault();
    if (rrEntry <= 0 || rrStop <= 0 || rrTarget <= 0) return;
    const riskDistance = Math.abs(rrEntry - rrStop);
    const profitDistance = Math.abs(rrTarget - rrEntry);
    if (riskDistance <= 0) return;
    const ratio = profitDistance / riskDistance;
    setStopDistance(parseFloat(riskDistance.toFixed(4)));
    setTargetDistance(parseFloat(profitDistance.toFixed(4)));
    setRrRatio(parseFloat(ratio.toFixed(2)));
  };
  return <div className="space-y-8 pb-10 text-[#0f172a] dark:text-white">
      {
    /* Top Header info */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a] dark:text-white mt-2">Position Planning Suite</h2>
          <p className="text-xs text-slate-500 dark:text-gray-500 italic mt-1">Acquire type safety and capital calculation constraints dynamically beforehand.</p>
        </div>
      </div>

      {
    /* Tabs list selector */
  }
      <div className="flex border-b border-slate-200 dark:border-[#222]">
        <button
    onClick={() => setActiveTab("position")}
    className={`py-3 px-6 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === "position" ? "border-[#e11d75] text-[#e11d75] dark:text-white font-bold" : "border-transparent text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white"}`}
  >
          Position Size Planning
        </button>
        <button
    onClick={() => setActiveTab("rr")}
    className={`py-3 px-6 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === "rr" ? "border-[#e11d75] text-[#e11d75] dark:text-white font-bold" : "border-transparent text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white"}`}
  >
          Risk / Reward Metric Planning
        </button>
      </div>

      {
    /* Calculator Views grid */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === "position" ? <>
            {
    /* Sizing Input Form */
  }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#0f172a] dark:text-white">Position Sizing Parameters</h3>
              <form onSubmit={calculatePositionSizing} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-medium">Account Balance ($)</label>
                    <input
    type="number"
    value={accountBalance}
    onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-violet-500/15 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[#0f172a] dark:text-white"
    required
  />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-medium">Risk Percentage (%)</label>
                    <input
    type="number"
    step="0.01"
    value={riskPercent}
    onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-violet-500/15 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[#0f172a] dark:text-white"
    required
  />
                  </div>
                </div>

                {
    /* Risk Presets */
  }
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-semibold">Presets Alignment</span>
                  <div className="flex flex-wrap gap-2 select-none">
                    <button
    type="button"
    onClick={() => applyPresetRisk(0.5)}
    className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 text-slate-700 dark:text-gray-300 dark:hover:text-white border border-slate-200 dark:border-violet-500/15 rounded-lg transition-colors font-mono cursor-pointer"
  >
                      Conservative (0.5%)
                    </button>
                    <button
    type="button"
    onClick={() => applyPresetRisk(1)}
    className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 text-slate-700 dark:text-gray-300 dark:hover:text-white border border-slate-200 dark:border-violet-500/15 rounded-lg transition-colors font-mono cursor-pointer"
  >
                      Standard (1.0%)
                    </button>
                    <button
    type="button"
    onClick={() => applyPresetRisk(2.5)}
    className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 text-slate-700 dark:text-gray-300 dark:hover:text-white border border-slate-200 dark:border-violet-500/15 rounded-lg transition-colors font-mono cursor-pointer"
  >
                      Aggressive (2.5%)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-[#222] pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-medium">Entry Price ($)</label>
                    <input
    type="number"
    step="any"
    placeholder="e.g. 67500"
    onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-violet-500/15 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[#0f172a] dark:text-white"
    required
  />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-medium">Stop Loss ($)</label>
                    <input
    type="number"
    step="any"
    placeholder="e.g. 66800"
    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-violet-500/15 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[#0f172a] dark:text-white"
    required
  />
                  </div>
                </div>

                <button
    type="submit"
    className="w-full btn-neon mt-4 cursor-pointer"
  >
                  Calculate Sizing Constraints
                </button>
              </form>
            </div>

            {
    /* Sizing Performance Output */
  }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono mb-4 text-[#0f172a] dark:text-white">Sizing Performance Results</h3>
                {cashRisked === null ? <div className="text-center py-24 text-xs text-slate-400 dark:text-gray-500 font-mono uppercase">Provide Sizing parameters to trigger math outcome</div> : <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#222] p-4 rounded-xl flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-gray-400">Total Capital Risked</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-500 font-mono">${cashRisked.toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#222] p-4 rounded-xl flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-gray-400">Calculated Position Units</span>
                      <span className="text-sm font-bold text-[#0f172a] dark:text-white font-mono">{positionSize} Units</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#222] p-4 rounded-xl flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-gray-400">Notional/Asset Value</span>
                      <span className="text-sm font-bold text-[#0f172a] dark:text-white font-mono">${notionalSize?.toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#242424] p-4 rounded-xl flex justify-between items-center">
                      <span className="text-xs text-slate-650 dark:text-gray-400 font-semibold">Minimum Leverage Needed</span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">{leverageRequired}x Leverage</span>
                    </div>
                  </div>}
              </div>
            </div>
          </> : <>
            {
    /* RR Form */
  }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#0f172a] dark:text-white">Risk / Reward Input Parameters</h3>
              <form onSubmit={calculateRR} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-medium">Entry Price ($)</label>
                  <input
    type="number"
    step="any"
    onChange={(e) => setRrEntry(parseFloat(e.target.value) || 0)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-violet-500/15 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[#0f172a] dark:text-white"
    required
  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-medium">Stop Loss ($)</label>
                    <input
    type="number"
    step="any"
    onChange={(e) => setRrStop(parseFloat(e.target.value) || 0)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-violet-500/15 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[#0f172a] dark:text-white"
    required
  />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-mono font-medium">Target Price ($)</label>
                    <input
    type="number"
    step="any"
    onChange={(e) => setRrTarget(parseFloat(e.target.value) || 0)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-violet-500/15 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[#0f172a] dark:text-white"
    required
  />
                  </div>
                </div>

                <button
    type="submit"
    className="w-full btn-neon mt-4 cursor-pointer"
  >
                  Calculate Risk vs Reward
                </button>
              </form>
            </div>

            {
    /* RR Results */
  }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono mb-4 text-[#0f172a] dark:text-white">Risk Reward Extraction Calculations</h3>
                {rrRatio === null ? <div className="text-center py-24 text-xs text-slate-400 dark:text-gray-500 font-mono uppercase">Provide targets to calculate profit-to-draw ratios</div> : <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#222] p-4 rounded-xl flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-gray-400">Loss Distance Limit (Risk)</span>
                      <span className="text-sm font-bold text-red-650 dark:text-red-400 font-mono">{stopDistance} points / units</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#222] p-4 rounded-xl flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-gray-400">Profit Target Distance (Reward)</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400 font-mono">{targetDistance} points / units</span>
                    </div>

                    <div className="bg-slate-100/50 dark:bg-[#121212] border border-slate-200 dark:border-[#242424] p-5 rounded-xl flex justify-between items-center border-l-4 border-l-blue-500 shadow-md">
                      <span className="text-xs text-slate-600 dark:text-gray-300 font-bold uppercase">Calculated Risk/Reward Ratio</span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">1 : {rrRatio} R</span>
                    </div>
                  </div>}
              </div>
            </div>
          </>}
      </div>
    </div>;
}
