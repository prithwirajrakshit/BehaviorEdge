import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import { Calendar, TrendingUp, HelpCircle, Bookmark } from "lucide-react";
export default function WeeklyReview({ trades, showToast }) {
  const [pivotWeekDate, setPivotWeekDate] = useState(() => {
    const today = new Date();
    const day = today.getUTCDay();
    const diff = today.getUTCDate() - day + (day === 0 ? -6 : 1);
    today.setUTCDate(diff);
    return today;
  });
  const [weeklyGoal, setWeeklyGoal] = useState(null);
  const [lessons, setLessons] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [saving, setSaving] = useState(false);
  const weekStartStr = pivotWeekDate.toISOString().substring(0, 10);
  const sundayText = () => {
    const sun = new Date(pivotWeekDate.getTime());
    sun.setUTCDate(pivotWeekDate.getUTCDate() + 6);
    return sun.toISOString().substring(0, 10);
  };
  const fetchWeekGoal = async () => {
    try {
      const res = await authFetch("/api/weekly_goals");
      if (res.ok) {
        const list = await res.json();
        const found = list.find((g) => g.week_start === weekStartStr);
        setWeeklyGoal(found || null);
      }
    } catch (err) {
    }
  };
  useEffect(() => {
    fetchWeekGoal();
    setLessons(localStorage.getItem(`lessons_${weekStartStr}`) || "");
    setAdjustments(localStorage.getItem(`adjustments_${weekStartStr}`) || "");
  }, [weekStartStr]);
  const handlePrevWeek = () => {
    const prev = new Date(pivotWeekDate.getTime());
    prev.setUTCDate(pivotWeekDate.getUTCDate() - 7);
    setPivotWeekDate(prev);
  };
  const handleNextWeek = () => {
    const next = new Date(pivotWeekDate.getTime());
    next.setUTCDate(pivotWeekDate.getUTCDate() + 7);
    setPivotWeekDate(next);
  };
  const mondayTime = pivotWeekDate.getTime();
  const nextMondayTime = mondayTime + 7 * 24 * 60 * 60 * 1e3;
  const weekTrades = trades.filter((t) => {
    const tTime = new Date(t.date).getTime();
    return tTime >= mondayTime && tTime < nextMondayTime;
  });
  const weeklyNetPnl = weekTrades.reduce((acc, t) => acc + (t.net_pnl_usd || 0), 0);
  const weeklyWinRate = weekTrades.length > 0 ? weekTrades.filter((t) => t.outcome === "Win").length / weekTrades.length * 100 : 0;
  const handleSaveReview = () => {
    setSaving(true);
    try {
      localStorage.setItem(`lessons_${weekStartStr}`, lessons);
      localStorage.setItem(`adjustments_${weekStartStr}`, adjustments);
      showToast(`Weekly review logs saved successfully for week ${weekStartStr}!`, "success");
    } catch (e) {
      showToast("Error saving review logs.", "error");
    } finally {
      setSaving(false);
    }
  };
  return <div className="space-y-8 pb-10 text-slate-800 dark:text-white">
      {
    /* Header and week controller */
  }
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-md dark:shadow-lg gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">Weekly Performance Review</h2>
          <p className="text-xs text-slate-500 dark:text-gray-500 font-mono mt-1">Review outcomes, evaluate week rules adherence, and capture core insights.</p>
        </div>

        {
    /* Date navigators */
  }
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#2a2a2a] p-1.5 rounded-xl text-xs font-semibold">
          <button
    onClick={handlePrevWeek}
    className="p-1 px-2.5 bg-white dark:bg-[#222] hover:bg-slate-100 dark:hover:bg-[#333] text-slate-700 dark:text-gray-300 rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-[#333]"
  >
            ← Previous Week
          </button>
          
          <span className="text-slate-600 dark:text-gray-405 font-mono px-1 font-bold">
            {weekStartStr} – {sundayText()}
          </span>

          <button
    onClick={handleNextWeek}
    className="p-1 px-2.5 bg-white dark:bg-[#222] hover:bg-slate-100 dark:hover:bg-[#333] text-slate-700 dark:text-gray-300 rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-[#333]"
  >
            Next Week →
          </button>
        </div>
      </div>

      {
    /* Grid segments */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {
    /* Weekly stats summary */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4">
          <h3 className="text-sm font-bold tracking-wide uppercase font-mono border-b border-slate-150 dark:border-[#222] pb-3 text-slate-800 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Weekly Statistics</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#121212] p-3 rounded-xl border border-slate-150 dark:border-[#222] text-center">
              <span className="text-[10px] text-slate-400 dark:text-gray-500 block uppercase">Net Return PnL</span>
              <span className={`text-lg font-black block font-mono mt-1 ${weeklyNetPnl >= 0 ? "text-green-655 dark:text-green-400" : "text-red-655 dark:text-red-400"}`}>
                {weeklyNetPnl >= 0 ? `+$${weeklyNetPnl.toFixed(2)}` : `-$${Math.abs(weeklyNetPnl).toFixed(2)}`}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-[#121212] p-3 rounded-xl border border-slate-150 dark:border-[#222] text-center">
              <span className="text-[10px] text-slate-400 dark:text-gray-500 block uppercase">Win Rate</span>
              <span className="text-lg font-black block font-mono mt-1 text-green-655 dark:text-green-400">
                {weeklyWinRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#121212] p-4 rounded-xl border border-slate-150 dark:border-[#222] flex justify-between items-center text-xs">
            <span className="text-slate-600 dark:text-gray-400">Total Completed Trades:</span>
            <span className="font-bold font-mono text-slate-800 dark:text-white">{weekTrades.length} Trades</span>
          </div>

          <div className="bg-slate-50 dark:bg-[#121212] p-4 rounded-xl border border-slate-150 dark:border-[#222] space-y-1 text-xs">
            <span className="text-slate-500 dark:text-gray-400 block font-semibold mb-1 uppercase tracking-wider text-[10px]">Setup Frequency List</span>
            {weekTrades.length === 0 ? <span className="text-[10px] text-slate-400 dark:text-gray-600 block italic">No setups loaded this week.</span> : <div className="space-y-1 font-mono text-[11px]">
                {Array.from(new Set(weekTrades.map((x) => x.setup_type).filter(Boolean))).map((setup) => {
    const sCount = weekTrades.filter((t) => t.setup_type === setup).length;
    return <div key={setup} className="flex justify-between items-center text-slate-500 dark:text-gray-400">
                      <span>• {setup}</span>
                      <span className="text-slate-800 dark:text-white">({sCount} Trades)</span>
                    </div>;
  })}
              </div>}
          </div>
        </div>

        {
    /* Weekly Goal vs rules target correlation */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4">
          <h3 className="text-sm font-bold tracking-wide uppercase font-mono border-b border-slate-150 dark:border-[#222] pb-3 text-slate-800 dark:text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Weekly Goal Evaluation</span>
          </h3>

          {weeklyGoal ? <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#121212] p-4 rounded-xl border border-slate-200 dark:border-blue-500/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono uppercase">Target benchmark</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${weeklyGoal.status === "Achieved" ? "bg-green-50 dark:bg-green-500/15 text-green-655 dark:text-green-400" : weeklyGoal.status === "Failed" ? "bg-red-50 dark:bg-red-500/15 text-red-655 dark:text-red-500" : "bg-yellow-50 dark:bg-yellow-500/15 text-yellow-650 dark:text-yellow-500"}`}>
                    {weeklyGoal.status}
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-white leading-relaxed">{weeklyGoal.goal_text}</p>
                {weeklyGoal.pnl_target > 0 && <span className="text-[10px] text-slate-500 dark:text-gray-500 font-mono block">Weekly financial target Goal: <strong>+${weeklyGoal.pnl_target}</strong></span>}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-250 dark:border-yellow-550/10 p-3.5 rounded-xl text-yellow-805 dark:text-neutral-300 text-xs">
                👉 Evaluate if you was loyal to your self-declared rules. Update target status on the <strong>Goals</strong> page.
              </div>
            </div> : <div className="text-center py-16 space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-400 dark:text-gray-600 mx-auto" />
              <div className="text-xs text-slate-500 dark:text-gray-500 font-mono">No weekly goal set for Monday {weekStartStr} yet. Create one in the Goals tab!</div>
            </div>}
        </div>

        {
    /* Weekly Journal Reflection logs inputs */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide uppercase font-mono border-b border-slate-150 dark:border-[#222] pb-3 text-slate-800 dark:text-white flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              <span>Review Reflection Logs</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-gray-400 font-bold font-mono">Lessons Learned This Week</label>
                <textarea
    value={lessons}
    onChange={(e) => setLessons(e.target.value)}
    placeholder="e.g. Stop fighting low volume ranges, respect stop loss rules..."
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 min-h-[75px] resize-y"
  />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-gray-400 font-bold font-mono">Next Week's Adjustments</label>
                <textarea
    value={adjustments}
    onChange={(e) => setAdjustments(e.target.value)}
    placeholder="e.g. Limit daily entries to max 3, reduce risk sizes..."
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 min-h-[75px] resize-y"
  />
              </div>
            </div>
          </div>

          <button
    onClick={handleSaveReview}
    disabled={saving}
    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all mt-4 cursor-pointer shadow-md"
  >
            {saving ? "Saving Reflection Logs..." : "Save Weekly Review Logs"}
          </button>
        </div>
      </div>
    </div>;
}
