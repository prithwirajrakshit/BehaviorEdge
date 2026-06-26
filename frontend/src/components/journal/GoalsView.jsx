import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import { Award, Calendar, Zap, CheckCircle, ShieldCheck } from "lucide-react";
export default function GoalsView({ trades, showToast }) {
  const [goals, setGoals] = useState([]);
  const [weekStart, setWeekStart] = useState("");
  const [goalText, setGoalText] = useState("");
  const [pnlTarget, setPnlTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const fetchGoals = async () => {
    try {
      const res = await authFetch("/api/weekly_goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (e) {
    }
  };
  useEffect(() => {
    fetchGoals();
  }, []);
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!weekStart || !goalText) {
      showToast("Please provide a week start date and goal text description.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/weekly_goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: weekStart,
          goal_text: goalText,
          pnl_target: parseFloat(pnlTarget || "0"),
          actual_pnl: 0,
          status: "Pending"
        })
      });
      if (res.ok) {
        showToast("Weekly goals registered successfully!", "success");
        setGoalText("");
        setPnlTarget("");
        setWeekStart("");
        fetchGoals();
      } else {
        throw new Error("Could not record goal");
      }
    } catch (err) {
      showToast(err.message || "Error occurred creating target goal.", "error");
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const g = goals.find((x) => x.id === id);
      if (!g) return;
      const res = await authFetch("/api/weekly_goals", {
        method: "POST",
        // upserts using week_start
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...g,
          status: newStatus
        })
      });
      if (res.ok) {
        showToast(`Goal status updated to ${newStatus}!`, "success");
        fetchGoals();
      }
    } catch (e) {
      showToast("Could not modify goal status.", "error");
    }
  };
  const greenWeek = trades.filter((t) => t.outcome === "Win").length >= 3;
  const highYield = trades.some((t) => (t.net_pnl_usd || 0) >= 1e3);
  const totalTradesCount = trades.length;
  const winCount = trades.filter((t) => t.outcome === "Win").length;
  const sniperAccuracy = totalTradesCount >= 5 && winCount / totalTradesCount >= 0.65;
  const last5Trades = trades.slice(-5);
  const absoluteDiscipline = last5Trades.length >= 3 && !last5Trades.some(
    (t) => t.mistakes && t.mistakes.length > 0 && !t.mistakes.includes("No Mistake")
  );
  return <div className="space-y-8 pb-10 text-slate-800 dark:text-white animate-fade-in">
      {
    /* Page Header */
  }
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-md dark:shadow-lg gap-4">
        <div>
          <span className="text-xs bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 font-mono text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg select-none font-bold">
            🎯 Goals & Gamified Achievements
          </span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">Milestones & Achievements</h2>
          <p className="text-xs text-slate-500 dark:text-gray-500 font-mono mt-1">Set actionable financial benchmarks and track performance badges.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {
    /* Creation Grid & Goal list */
  }
        <div className="lg:col-span-2 space-y-6">
          {
    /* Create Goal Card */
  }
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4">
            <h3 className="text-sm font-bold tracking-wide uppercase font-mono text-slate-800 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Establish Weekly Targets</span>
            </h3>
            <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold font-mono">Week Start Date</label>
                <input
    type="date"
    value={weekStart}
    onChange={(e) => setWeekStart(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-550 font-mono"
    required
  />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold font-mono">PnL Target Target (USD)</label>
                <input
    type="number"
    value={pnlTarget}
    onChange={(e) => setPnlTarget(e.target.value)}
    placeholder="e.g. 500"
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-550 font-mono"
  />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold font-mono">Benchmark Description / Rules</label>
                <input
    type="text"
    value={goalText}
    onChange={(e) => setGoalText(e.target.value)}
    placeholder="e.g., Hold Trades to 1.5R target minimum, no FOMO entries today"
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-550"
    required
  />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
    type="submit"
    disabled={saving}
    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50 active:scale-95 shadow-md"
  >
                  {saving ? "Saving..." : "Establish Weekly Goal"}
                </button>
              </div>
            </form>
          </div>

          {
    /* Goal List Cards */
  }
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-400 dark:text-gray-400 tracking-wider">Weekly Benchmarks</h3>
            {goals.length === 0 ? <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-10 rounded-2xl text-center text-xs text-slate-400 dark:text-gray-500 font-mono shadow-sm">
                No target goals recorded yet. Use the scheduler above to establish targets.
              </div> : goals.map((g) => <div key={g.week_start} className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-xl shadow-md flex justify-between items-center text-slate-800 dark:text-white">
                  <div className="space-y-1 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">Week starting: {g.week_start}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono uppercase ${g.status === "Achieved" ? "bg-green-50 dark:bg-green-500/10 text-green-655 dark:text-green-400" : g.status === "Failed" ? "bg-red-50 dark:bg-red-500/10 text-red-655 dark:text-red-400" : "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"}`}>
                        {g.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-gray-300 font-bold">{g.goal_text}</p>
                    {g.pnl_target > 0 && <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono block">Financial Target: <strong>+${g.pnl_target.toFixed(0)}</strong></span>}
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row items-center justify-end">
                    {g.status === "Pending" && <>
                        <button
    onClick={() => handleUpdateStatus(g.id, "Achieved")}
    className="px-2.5 py-1 bg-green-50 hover:bg-green-100 dark:bg-green-500/15 dark:hover:bg-green-500/30 text-green-655 dark:text-green-400 border border-green-200 dark:border-green-550/20 text-[10px] rounded-lg font-black font-mono cursor-pointer transition-colors"
  >
                          Achieved
                        </button>
                        <button
    onClick={() => handleUpdateStatus(g.id, "Failed")}
    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/30 text-red-655 dark:text-red-400 border border-red-200 dark:border-red-550/20 text-[10px] rounded-lg font-black font-mono cursor-pointer transition-colors"
  >
                          Failed
                        </button>
                      </>}
                  </div>
                </div>)}
          </div>
        </div>

        {
    /* Gamified Achievement Badges */
  }
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl flex flex-col justify-between h-full">
            <div className="space-y-1 border-b border-slate-150 dark:border-[#222] pb-3 mb-4">
              <h3 className="text-sm font-bold tracking-wide uppercase font-mono text-slate-800 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                <span>Achievement Badges</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-gray-550 font-mono">Earn badges automatically through your journal logging history and trade discipline!</p>
            </div>

            <div className="space-y-4">
              {
    /* Badge 1 */
  }
              <div className={`p-3.5 rounded-xl border flex gap-3.5 items-center transition-all ${greenWeek ? "bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20" : "bg-slate-50/70 dark:bg-[#1e1e1e]/40 border-slate-150 dark:border-[#333] opacity-60"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${greenWeek ? "bg-green-100 dark:bg-green-500/15 text-green-655 dark:text-green-400" : "bg-slate-100 dark:bg-[#222] text-slate-400 dark:text-gray-600"}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Green Week Catalyst</h4>
                  <p className="text-[10px] text-slate-450 dark:text-gray-500 mt-0.5">Win 3 or more total trades on record</p>
                </div>
              </div>

              {
    /* Badge 2 */
  }
              <div className={`p-3.5 rounded-xl border flex gap-3.5 items-center transition-all ${highYield ? "bg-yellow-50 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/20" : "bg-slate-50/70 dark:bg-[#1e1e1e]/40 border-slate-150 dark:border-[#333] opacity-60"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${highYield ? "bg-yellow-105 dark:bg-yellow-500/15 text-yellow-605 dark:text-yellow-400" : "bg-slate-100 dark:bg-[#222] text-slate-400 dark:text-gray-600"}`}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">High Yield Tactician</h4>
                  <p className="text-[10px] text-slate-450 dark:text-gray-500 mt-0.5">Capture a single profit payout exceeding $1,000</p>
                </div>
              </div>

              {
    /* Badge 3 */
  }
              <div className={`p-3.5 rounded-xl border flex gap-3.5 items-center transition-all ${sniperAccuracy ? "bg-blue-50 dark:bg-[#3b82f6]/5 border-blue-200 dark:border-[#3b82f6]/20" : "bg-slate-50/70 dark:bg-[#1e1e1e]/40 border-slate-150 dark:border-[#333] opacity-60"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sniperAccuracy ? "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-[#222] text-slate-400 dark:text-gray-600"}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Sniper Accuracy</h4>
                  <p className="text-[10px] text-slate-450 dark:text-gray-500 mt-0.5">Win rate above 65% with 5+ trades completed</p>
                </div>
              </div>

              {
    /* Badge 4 */
  }
              <div className={`p-3.5 rounded-xl border flex gap-3.5 items-center transition-all ${absoluteDiscipline ? "bg-purple-50 dark:bg-purple-500/5 border-purple-200 dark:border-purple-500/20" : "bg-slate-50/70 dark:bg-[#1e1e1e]/40 border-slate-150 dark:border-[#333] opacity-60"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${absoluteDiscipline ? "bg-purple-100 dark:bg-purple-500/15 text-purple-650 dark:text-purple-400" : "bg-slate-100 dark:bg-[#222] text-slate-400 dark:text-gray-600"}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Absolute Discipline</h4>
                  <p className="text-[10px] text-slate-450 dark:text-gray-500 mt-0.5">No psychological errors logged in last 5 trades</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
