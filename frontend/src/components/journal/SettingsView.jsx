import { useState } from "react";
import { Database, FileSpreadsheet, Trash2, AlertTriangle, ShieldCheck, Sliders, Settings } from "lucide-react";

export default function SettingsView({ trades, onClearAll, showToast, onExportCSV }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [initialBalance, setInitialBalance] = useState(
    () => localStorage.getItem("initial_balance") || "10000"
  );
  const [drawdownThreshold, setDrawdownThreshold] = useState(
    () => localStorage.getItem("drawdown_threshold") || "10"
  );
  const [dailyLossLimit, setDailyLossLimit] = useState(
    () => localStorage.getItem("daily_loss_limit") || "500"
  );
  const [dailyProfitTarget, setDailyProfitTarget] = useState(
    () => localStorage.getItem("daily_profit_target") || "1000"
  );
  const [weightHtf, setWeightHtf] = useState(() => localStorage.getItem("weight_htf") || "30");
  const [weightSr, setWeightSr] = useState(() => localStorage.getItem("weight_sr") || "25");
  const [weightVol, setWeightVol] = useState(() => localStorage.getItem("weight_vol") || "20");
  const [weightMa, setWeightMa] = useState(() => localStorage.getItem("weight_ma") || "15");
  const [weightCandle, setWeightCandle] = useState(() => localStorage.getItem("weight_candle") || "10");

  const handleSaveRiskSettings = (e) => {
    e.preventDefault();
    const htf = parseFloat(weightHtf || "0");
    const sr = parseFloat(weightSr || "0");
    const vol = parseFloat(weightVol || "0");
    const ma = parseFloat(weightMa || "0");
    const candle = parseFloat(weightCandle || "0");
    if (htf + sr + vol + ma + candle !== 100) {
      showToast("⚠️ Confluence Weights must sum up exactly to 100%!", "error");
      return;
    }
    localStorage.setItem("initial_balance", initialBalance);
    localStorage.setItem("drawdown_threshold", drawdownThreshold);
    localStorage.setItem("daily_loss_limit", dailyLossLimit);
    localStorage.setItem("daily_profit_target", dailyProfitTarget);
    localStorage.setItem("weight_htf", weightHtf);
    localStorage.setItem("weight_sr", weightSr);
    localStorage.setItem("weight_vol", weightVol);
    localStorage.setItem("weight_ma", weightMa);
    localStorage.setItem("weight_candle", weightCandle);
    showToast("✅ Risk settings and Confluence Weights updated successfully!", "success");
  };

  const handleExportCSV = () => {
    onExportCSV();
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await onClearAll();
      setIsConfirmOpen(false);
    } catch (err) {
      showToast(err.message || "Failed to clear trades database.", "error");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 text-slate-800 dark:text-white animate-fade-in">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-md dark:shadow-lg gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">System Settings & Risk Profiles</h2>
          <p className="text-xs text-slate-500 dark:text-gray-500 italic mt-1">Configure account targets, confluence model weights, and data backups.</p>
        </div>
      </div>

      {/* SECTION 1: Data Management */}
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-md dark:shadow-xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-150 dark:border-[#222] pb-3">
          <Database className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">System Data Management</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Perform backup files export operations or factory wipe database caches.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 select-none">
          {/* CSV export */}
          <div className="p-5 border border-slate-200 dark:border-violet-500/15 bg-slate-50/50 dark:bg-[#1e1e1e]/40 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-blue-500" />
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Local Backup Export</h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                Compile and download all of your trading records including confluences applied, notes, and metrics as a single formatted CSV backup spreadsheet compatible with standard Microsoft Excel.
              </p>
            </div>
            <button
              id="exportAllBtn"
              onClick={handleExportCSV}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] border border-slate-200 dark:border-[#3c3c3c] hover:border-blue-500/30 dark:hover:bg-[#2b2b2b] text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 mt-4"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>Export All Trades as CSV</span>
            </button>
          </div>

          {/* Hard reset */}
          <div className="p-5 border border-red-200 dark:border-red-950/20 bg-red-50/20 dark:bg-red-950/5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <Trash2 className="w-8 h-8 text-red-500" />
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Clean Database Logs</h4>
              <p className="text-xs text-red-655 dark:text-red-400/80 leading-relaxed font-semibold">
                Warning: Wipe transaction tables immediately. This operation completely wipes all records of confluences, commissions, notes, dates, and outcomes permanently.
              </p>
            </div>
            <button
              id="wipeDatabaseBtn"
              onClick={() => setIsConfirmOpen(true)}
              className="w-full py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-955/30 border border-red-200 dark:border-red-900/40 dark:hover:bg-red-850 hover:text-red-700 dark:hover:text-white text-red-655 dark:text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 mt-4"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Trades</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Risk Controls & Account Configurations */}
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-md dark:shadow-xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-150 dark:border-[#222] pb-3">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Account Balance & Risk Boundaries</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Configure safety thresholds, initial funds balance, and daily trading targets.</p>
          </div>
        </div>

        <form onSubmit={handleSaveRiskSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">Initial Account Funds ($)</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 dark:focus:border-violet-500/50 rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none font-mono transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">Max Account Drawdown Limit (%)</label>
              <input
                type="number"
                value={drawdownThreshold}
                onChange={(e) => setDrawdownThreshold(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 dark:focus:border-violet-500/50 rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none font-mono transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">Daily Loss Limit (USD)</label>
              <input
                type="number"
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 dark:focus:border-violet-500/50 rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none font-mono transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">Daily Profit Target (USD)</label>
              <input
                type="number"
                value={dailyProfitTarget}
                onChange={(e) => setDailyProfitTarget(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 dark:focus:border-violet-500/50 rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none font-mono transition-all"
              />
            </div>
          </div>

          <div className="border-t border-slate-150 dark:border-[#2a2a2a] pt-6 space-y-4">
            <div className="flex items-center space-x-3 pb-2">
              <Sliders className="w-5 h-5 text-yellow-500" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Confluence Alignment Model Weights</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">Set percentage weights for confluences (total weight must equal 100%).</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">HTF Trend (%)</label>
                <input
                  type="number"
                  value={weightHtf}
                  onChange={(e) => setWeightHtf(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">S/R Zones (%)</label>
                <input
                  type="number"
                  value={weightSr}
                  onChange={(e) => setWeightSr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">Volume (%)</label>
                <input
                  type="number"
                  value={weightVol}
                  onChange={(e) => setWeightVol(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">Moving Avg (%)</label>
                <input
                  type="number"
                  value={weightMa}
                  onChange={(e) => setWeightMa(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold font-mono">Candles (%)</label>
                <input
                  type="number"
                  value={weightCandle}
                  onChange={(e) => setWeightCandle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="btn-neon btn-neon-sm cursor-pointer"
            >
              Save Configuration Options
            </button>
          </div>
        </form>
      </div>

      {/* CONFIRMATION DIALOG FOR CLEARING DATABASE */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#0e0b18]/95 border border-slate-200 dark:border-violet-500/15 max-w-md w-full rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center space-x-3 text-red-500 font-bold text-sm uppercase mb-4 border-b border-slate-150 dark:border-[#222] pb-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span>Double-Verification Check</span>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-gray-300 mb-6 leading-relaxed">
              Are you absolutely, 100% sure you want to <strong className="text-red-500 uppercase">wipe out all database records</strong>? 
              This is a full data destruction process. This operation is permanent and irreversible, clearing all metrics and reset logs.
            </p>

            <div className="flex justify-end gap-3 font-semibold text-sm">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isClearing}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 text-slate-700 dark:text-gray-300 rounded-xl border border-slate-200 dark:border-violet-500/15 cursor-pointer outline-none"
              >
                No, Keep My Data
              </button>
              <button
                id="confirmResetBtn"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-5 py-2 bg-red-655 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 cursor-pointer outline-none flex items-center space-x-1"
              >
                <span>{isClearing ? "Clearing SQL Tables..." : "Yes, Delete Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
