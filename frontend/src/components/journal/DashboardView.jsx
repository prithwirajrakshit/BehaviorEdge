import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  AreaChart,
  Area
} from "recharts";
import {
  Coins,
  TrendingUp,
  Percent,
  TrendingDown,
  Activity,
  Calculator,
  ShieldCheck,
  Zap
} from "lucide-react";
import { calculateStreak } from "./utils/streak";
function calculateDrawdownMetrics(trades, initialBalance = 1e4) {
  const sorted = [...trades].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || 0) - (b.id || 0);
  });
  let currentBalance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdownPct = 0;
  const drawdownHistory = [];
  sorted.forEach((t) => {
    if (t.outcome !== "Running") {
      currentBalance += t.net_pnl_usd || 0;
    }
    if (currentBalance > peakBalance) {
      peakBalance = currentBalance;
    }
    const drawdownPct = peakBalance > 0 ? (peakBalance - currentBalance) / peakBalance * 100 : 0;
    if (drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
    }
    drawdownHistory.push({
      date: t.date,
      balance: currentBalance,
      peak: peakBalance,
      drawdownPct: parseFloat(drawdownPct.toFixed(2))
    });
  });
  const currentDrawdownUsd = peakBalance - currentBalance;
  const currentDrawdownPct = peakBalance > 0 ? currentDrawdownUsd / peakBalance * 100 : 0;
  return {
    currentBalance,
    peakBalance,
    currentDrawdownUsd,
    currentDrawdownPct,
    maxDrawdownPct,
    drawdownHistory
  };
}
export default function DashboardView({ showToast, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [trades, setTrades] = useState([]);
  const [newsEvents, setNewsEvents] = useState([]);
  const [isStreakBannerDismissed, setIsStreakBannerDismissed] = useState(() => {
    const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
    return localStorage.getItem("dismissed_dashboard_streak_date") === today;
  });
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes, tradesRes, dbRes] = await Promise.all([
        authFetch("/api/analytics/summary"),
        authFetch("/api/analytics/charts"),
        authFetch("/api/trades"),
        authFetch("/api/market_events").catch(() => null)
      ]);
      if (!sumRes.ok || !chartRes.ok || !tradesRes.ok) throw new Error("Failed to retrieve analytics databases.");
      const sumData = await sumRes.json();
      const chartData = await chartRes.json();
      const tradesData = await tradesRes.json();
      let newsData = [];
      if (dbRes && dbRes.ok) {
        const dbRows = await dbRes.json();
        newsData = dbRows.map((row) => ({
          id: row.id,
          title: row.title,
          country: row.category || row.country || "USD",
          date: row.date,
          time: row.time || "",
          impact: row.impact || "High",
          forecast: row.forecast || "",
          previous: row.previous || "",
          actual: row.actual || ""
        }));
      }
      setSummary(sumData);
      setCharts(chartData);
      setTrades(tradesData);
      setNewsEvents(newsData);
    } catch (err) {
      showToast(err.message || "Error occurred fetching analytics.", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAnalytics();
  }, []);
  if (loading) {
    return <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-gray-400 text-sm font-mono tracking-wider">Syncing Metrics & Recalculating Stats...</p>
      </div>;
  }
  if (!summary || !charts) {
    return <p className="text-center text-gray-500 py-12">No analytics available.</p>;
  }
  const DONUT_COLORS = {
    Win: "#22c55e",
    // green-500
    Loss: "#ef4444",
    // red-500
    Breakeven: "#737373",
    // neutral-500
    Running: "#3b82f6"
    // blue-500
  };
  const donutData = charts.outcomeDistribution.map((item) => ({
    name: item.outcome,
    value: item.count,
    color: DONUT_COLORS[item.outcome] || "#404040"
  })).filter((x) => x.value > 0);
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
  const todayTrades = trades.filter((t) => t.date === todayStr);
  const todaysNetPnl = todayTrades.reduce((acc, t) => acc + (t.net_pnl_usd || 0), 0);
  const dailyLossLimit = parseFloat(localStorage.getItem("daily_loss_limit") || "500");
  const dailyProfitTarget = parseFloat(localStorage.getItem("daily_profit_target") || "1000");
  const lossPct = todaysNetPnl < 0 ? Math.min(100, Math.abs(todaysNetPnl) / dailyLossLimit * 100) : 0;
  const profitPct = todaysNetPnl > 0 ? Math.min(100, todaysNetPnl / dailyProfitTarget * 100) : 0;
  let todayStatus = "active";
  if (todaysNetPnl <= -dailyLossLimit) {
    todayStatus = "locked";
  } else if (todaysNetPnl >= dailyProfitTarget) {
    todayStatus = "target";
  }
  const initialBalanceSetting = parseFloat(localStorage.getItem("initial_balance") || "10000");
  const drawdownThresholdSetting = parseFloat(localStorage.getItem("drawdown_threshold") || "10");
  const drawdownMetrics = calculateDrawdownMetrics(trades, initialBalanceSetting);
  const showDrawdownLimitWarning = drawdownMetrics.currentDrawdownPct >= drawdownThresholdSetting;
  const streakInfo = calculateStreak(trades);
  const showStreakWarning = streakInfo.consecutiveLosses >= 3 && !isStreakBannerDismissed;
  let totalRulesChecked = 0;
  let totalRulesFollowed = 0;
  trades.forEach((t) => {
    const fCount = t.rules_followed_count || 0;
    const bCount = t.rules_broken_count || 0;
    totalRulesFollowed += fCount;
    totalRulesChecked += fCount + bCount;
  });
  const followRate = totalRulesChecked === 0 ? 100 : Math.round(totalRulesFollowed / totalRulesChecked * 100);
  let followColor = "text-green-400";
  let followProgressBg = "bg-green-500";
  if (followRate < 70) {
    followColor = "text-red-500";
    followProgressBg = "bg-red-500";
  } else if (followRate < 90) {
    followColor = "text-yellow-500";
    followProgressBg = "bg-yellow-500";
  }
  const keyEventsThisWeek = newsEvents.filter((e) => {
    const currency = (e.country || "").toUpperCase();
    const isUSDorEUR = currency === "USD" || currency === "EUR";
    const isHigh = String(e.impact || "").toLowerCase() === "high";
    return isUSDorEUR && isHigh;
  });
  const sortedKeyEventsTable = [...keyEventsThisWeek].sort((a, b) => {
    const dDiff = (a.date || "").localeCompare(b.date || "");
    if (dDiff !== 0) return dDiff;
    if (a.time === "All Day") return -1;
    if (b.time === "All Day") return 1;
    return (a.time || "").localeCompare(b.time || "");
  });
  const getCurrencyFlagDashboard = (currency) => {
    const flags = {
      USD: "\u{1F1FA}\u{1F1F8}",
      EUR: "\u{1F1EA}\u{1F1FA}",
      GBP: "\u{1F1EC}\u{1F1E7}",
      JPY: "\u{1F1EF}\u{1F1F5}",
      CAD: "\u{1F1E8}\u{1F1E6}",
      AUD: "\u{1F1E6}\u{1F1FA}",
      NZD: "\u{1F1F3}\u{1F1FF}",
      CHF: "\u{1F1E8}\u{1F1ED}"
    };
    return flags[currency.toUpperCase()] || "\u{1F3F3}\uFE0F";
  };
  const getEventTimeISTandEST = (timeStr, dateStr) => {
    if (!timeStr || timeStr.toLowerCase().trim() === "all day") {
      return { ist: "All Day", est: "All Day" };
    }
    try {
      const match = timeStr.match(/(\d+:\d+)\s*(am|pm)/i);
      if (match) {
        const [time, period] = match.slice(1);
        const [hours, minutes] = time.split(":").map(Number);
        let h = hours % 12 + (period.toLowerCase() === "pm" ? 12 : 0);
        const [year, month, day] = dateStr.split("-").map(Number);
        const estDate = new Date(Date.UTC(year, month - 1, day, h, minutes));
        const istDate = new Date(estDate.getTime() + 9.5 * 60 * 60 * 1e3);
        const fmt = (d) => d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC"
        });
        return { est: fmt(estDate), ist: fmt(istDate) };
      } else {
        return { ist: timeStr, est: timeStr };
      }
    } catch {
      return { ist: timeStr, est: timeStr };
    }
  };
  const handleDismissStreak = () => {
    const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
    localStorage.setItem("dismissed_dashboard_streak_date", today);
    setIsStreakBannerDismissed(true);
  };
  return <div className="space-y-6 pb-10">
      {
    /* Consecutive Losses Warning Banner */
  }
      {showStreakWarning && <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <p className="text-xs sm:text-sm font-medium">
              You're on a {streakInfo.consecutiveLosses}-loss streak. Consider reviewing your last trades before continuing.
            </p>
          </div>
          <button
    type="button"
    onClick={handleDismissStreak}
    className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-yellow-500 transition-colors cursor-pointer"
  >
            ✕
          </button>
        </div>}

      {
    /* Drawdown Alert Banner */
  }
      {showDrawdownLimitWarning && <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 flex items-center gap-2 shadow-md animate-pulse">
          <span className="text-xl">🚨</span>
          <p className="text-xs sm:text-sm font-medium uppercase font-mono tracking-wider">
            DRAWDOWN ALERT: Current drawdown of {drawdownMetrics.currentDrawdownPct.toFixed(2)}% exceeds your {drawdownThresholdSetting}% limit! Stop trading or reduce risk.
          </p>
        </div>}
      {
    /* 9 Stat Cards Grid */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-10 gap-4">
        {
    /* Total Net PnL */
  }
        <div className="xl:col-span-2 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Net PnL</span>
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className={`text-xl lg:text-2xl font-black font-mono tracking-tight ${summary.totalNetPnl >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
              {summary.totalNetPnl >= 0 ? `+$${summary.totalNetPnl.toFixed(2)}` : `-$${Math.abs(summary.totalNetPnl).toFixed(2)}`}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-sans">Accumulated earnings post margins</p>
          </div>
        </div>

        {
    /* Win Rate % */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Win Rate</span>
            <Percent className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black font-mono text-green-600 dark:text-green-400 tracking-tight">
              {summary.winRate.toFixed(1)}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#2a2a2a] h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${summary.winRate}%` }} />
            </div>
          </div>
        </div>

        {
    /* Total Trades */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Trades</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black font-mono text-[#0f172a] dark:text-white tracking-tight">
              {summary.totalTrades}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-sans">Total logged items</p>
          </div>
        </div>

        {
    /* Profit Factor */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Prof. Factor</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className={`text-xl lg:text-2xl font-black font-mono tracking-tight ${summary.profitFactor >= 1.5 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-500"}`}>
              {summary.profitFactor.toFixed(2)}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-sans">Gross Wins / Losses</p>
          </div>
        </div>

        {
    /* Average Win (USD) */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Avg Win</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black font-mono text-green-600 dark:text-green-400 tracking-tight">
              +${summary.averageWin.toFixed(2)}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-sans">Per winning trade</p>
          </div>
        </div>

        {
    /* Average Loss (USD) */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Avg Loss</span>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black font-mono text-red-600 dark:text-red-400 tracking-tight">
              -${Math.abs(summary.averageLoss).toFixed(2)}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-sans">Per losing trade</p>
          </div>
        </div>

        {
    /* Best / Worst Trade (USD) */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Best Trade</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black font-mono text-green-600 dark:text-green-400 tracking-tight">
              +${summary.bestTrade.toFixed(2)}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-sans">Record single gain</p>
          </div>
        </div>

        {
    /* Total Fees Paid */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Fees</span>
            <Calculator className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black font-mono text-red-600 dark:text-red-400 tracking-tight">
              -${summary.totalFees.toFixed(2)}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-sans">Abs tracking fees</p>
          </div>
        </div>

        {
    /* Rules Followed Rate % Card */
  }
        <div className="xl:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center text-[#475569] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Rules Followed</span>
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className={`text-xl lg:text-2xl font-black font-mono tracking-tight ${followColor.includes("text-green") ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-500"}`}>
              {followRate}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#2a2a2a] h-1.5 mt-2 rounded-full overflow-hidden" title={`${followRate}% follow-rate`}>
              <div className={`${followProgressBg} h-full transition-all duration-500`} style={{ width: `${followRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {
    /* Risk Controls & Streak Trackers Row */
  }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {
    /* Card 1: Today's Status (Daily Loss Limit / Profit Target) */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222] pb-3">
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">Today's Risk Status</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${todayStatus === "locked" ? "bg-red-500/10 text-red-500 animate-pulse" : todayStatus === "target" ? "bg-green-500/10 text-green-500 animate-pulse" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
              {todayStatus === "locked" ? "\u{1F7E5} Locked / Hit Limit" : todayStatus === "target" ? "\u{1F3C6} Target Hit" : "\u{1F7E2} Active / On Track"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-xs text-[#475569] dark:text-gray-400 font-mono">Today's Net PnL</span>
              <span className={`text-lg font-black font-mono ${todaysNetPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {todaysNetPnl >= 0 ? `+$${todaysNetPnl.toFixed(2)}` : `-$${Math.abs(todaysNetPnl).toFixed(2)}`}
              </span>
            </div>

            {
    /* Daily Loss Limit Progress */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#475569] dark:text-gray-400">Daily Loss Limit (${dailyLossLimit})</span>
                <span className="text-red-500 dark:text-red-400">{lossPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#222] h-2 rounded-full overflow-hidden">
                <div
    className={`h-full transition-all duration-300 ${lossPct >= 100 ? "bg-red-600 animate-pulse" : "bg-red-500/85"}`}
    style={{ width: `${lossPct}%` }}
  />
              </div>
            </div>

            {
    /* Daily Profit Target Progress */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#475569] dark:text-gray-400">Daily Profit Target (${dailyProfitTarget})</span>
                <span className="text-green-600 dark:text-green-400">{profitPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#222] h-2 rounded-full overflow-hidden">
                <div
    className={`h-full transition-all duration-300 ${profitPct >= 100 ? "bg-green-500 animate-pulse" : "bg-green-500/85"}`}
    style={{ width: `${profitPct}%` }}
  />
              </div>
            </div>
          </div>
        </div>

        {
    /* Card 2: 🔥 Streak Tracker */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222] pb-3">
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">🔥 Streak Tracker</h3>
            <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-slate-100 dark:bg-[#222] rounded border border-slate-200 dark:border-[#333]">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-1">
            <div className="bg-slate-50 dark:bg-[#222]/30 border border-slate-100 dark:border-[#333]/30 p-3 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#475569] dark:text-gray-400 font-semibold">Current Streak</p>
              <h4 className="text-lg font-black font-mono mt-1 text-[#0f172a] dark:text-white">
                {streakInfo.type === "Win" ? "\u{1F525}" : streakInfo.type === "Loss" ? "\u2744\uFE0F" : "\u2796"}{" "}
                {streakInfo.count} {streakInfo.type !== "none" ? `${streakInfo.type}s` : "None"}
              </h4>
            </div>

            <div className="bg-slate-50 dark:bg-[#222]/30 border border-slate-100 dark:border-[#333]/30 p-3 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#475569] dark:text-gray-400 font-semibold">Consecutive Losses</p>
              <h4 className={`text-lg font-black font-mono mt-1 ${streakInfo.consecutiveLosses >= 3 ? "text-red-500 dark:text-red-400 font-black" : "text-gray-400 dark:text-gray-500"}`}>
                {streakInfo.consecutiveLosses}
              </h4>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-[#222] pt-3 flex justify-between text-[11px] font-mono">
            <div>
              <span className="text-[#475569] dark:text-gray-400">Best Win: </span>
              <span className="font-bold text-green-600 dark:text-green-400">{streakInfo.maxWinStreak}</span>
            </div>
            <div>
              <span className="text-[#475569] dark:text-gray-400">Worst Loss: </span>
              <span className="font-bold text-red-500 dark:text-red-400">{streakInfo.maxLossStreak}</span>
            </div>
          </div>
        </div>

        {
    /* Card 3: Drawdown Tracker */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222] pb-3">
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">📉 Drawdown Tracker</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${showDrawdownLimitWarning ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"}`}>
              Drawdown: {drawdownMetrics.currentDrawdownPct.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-50 dark:bg-[#222]/20 py-2 px-1 rounded-lg">
              <span className="text-[9px] uppercase text-[#475569] dark:text-gray-500 block font-semibold">Peak Bal.</span>
              <span className="text-[#0f172a] dark:text-white font-bold block mt-0.5">${drawdownMetrics.peakBalance.toFixed(0)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#222]/20 py-2 px-1 rounded-lg">
              <span className="text-[9px] uppercase text-[#475569] dark:text-gray-500 block font-semibold">Current DD</span>
              <span className="text-red-500 dark:text-red-400 font-bold block mt-0.5">-${drawdownMetrics.currentDrawdownUsd.toFixed(0)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#222]/20 py-2 px-1 rounded-lg">
              <span className="text-[9px] uppercase text-[#475569] dark:text-gray-500 block font-semibold">Max DD %</span>
              <span className="text-red-500 dark:text-red-400 font-bold block mt-0.5">{drawdownMetrics.maxDrawdownPct.toFixed(1)}%</span>
            </div>
          </div>

          {
    /* Drawdown Mini area chart */
  }
          <div className="h-16 w-full">
            {drawdownMetrics.drawdownHistory.length === 0 ? <div className="text-[10px] text-[#475569] dark:text-gray-600 text-center py-4">No drawdown record</div> : <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownMetrics.drawdownHistory} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", fontSize: "10px" }}
    itemStyle={{ color: "#0f172a" }}
    labelStyle={{ color: "#0f172a" }}
    labelClassName="hidden"
  />
                  <Area type="monotone" dataKey="drawdownPct" stroke="#ef4444" fillOpacity={1} fill="url(#drawdownGrad)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Card 4: ⚡ Key Events This Week */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222] pb-3">
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide flex items-center gap-1.5">
              <span>⚡ Key Events This Week</span>
            </h3>
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider bg-red-500/10 text-red-500 px-2 py-0.5 rounded">
              High Impact
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 space-y-2.5 scrollbar-thin">
            {newsEvents.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <p className="text-xs text-slate-500 dark:text-gray-400 font-bold leading-normal leading-relaxed">
                  📂 Import News Calendar (Forex) CSV to see key events
                </p>
                <button
    type="button"
    onClick={() => onNavigate && onNavigate("ff_calendar")}
    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow"
  >
                  Go to Calendar
                </button>
              </div> : keyEventsThisWeek.length === 0 ? <div className="h-full flex items-center justify-center text-center p-3">
                <p className="text-xs text-green-600 dark:text-green-400 font-bold leading-normal">
                  ✅ No USD/EUR High-Impact events — clear to trade
                </p>
              </div> : sortedKeyEventsTable.map((e, idx) => {
    const times = getEventTimeISTandEST(e.time, e.date);
    let readableDate = "";
    try {
      const parts = e.date.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        readableDate = `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
      }
    } catch {
      readableDate = e.date;
    }
    return <div key={idx} className="flex justify-between items-start gap-2.5 bg-slate-50 dark:bg-[#121212] p-2.5 rounded-xl border border-slate-100 dark:border-[#222]">
                    <div className="space-y-0.5 overflow-hidden text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#475569] dark:text-gray-500 font-bold" title={e.country}>
                          {getCurrencyFlagDashboard(e.country)} {e.country}
                        </span>
                        <span className="text-[9px] text-[#475569] dark:text-gray-400 font-bold bg-slate-100 dark:bg-[#1e1e1e] px-1 rounded">
                          {readableDate}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-[#0f172a] dark:text-white leading-tight truncate" title={e.title}>
                        {e.title}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-black text-[#0f172a] dark:text-white font-mono">{times.ist}</div>
                      <div className="text-[9px] text-[#94a3b8] dark:text-gray-500 font-mono">IST</div>
                    </div>
                  </div>;
  })}
          </div>

          <div className="border-t border-slate-100 dark:border-[#222] pt-3 text-right">
            <button
    onClick={() => onNavigate && onNavigate("ff_calendar")}
    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors flex items-center gap-1 justify-end ml-auto cursor-pointer"
  >
              <span>View full calendar</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {
    /* 8 charts layout */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {
    /* Chart 1 — Cumulative PnL Curve */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">1. Cumulative PnL Curve (USD)</h3>
          <div className="h-72 w-full text-xs">
            {charts.cumulativePnl.length === 0 ? <div className="flex justify-center items-center h-full text-gray-400 dark:text-gray-600">No data available</div> : <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.cumulativePnl} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#2a2a2a]" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
    itemStyle={{ color: "#0f172a" }}
    labelStyle={{ color: "#0f172a" }}
    labelClassName="font-mono text-xs"
  />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="pnl" name="Cum. PnL" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Chart 2 — Daily PnL Bar Chart */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">2. Daily Net PnL Performance</h3>
          <div className="h-72 w-full text-xs">
            {charts.dailyPnl.length === 0 ? <div className="flex justify-center items-center h-full text-gray-400 dark:text-gray-600">No data available</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.dailyPnl} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#2a2a2a]" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
    itemStyle={{ color: "#0f172a" }}
    labelStyle={{ color: "#0f172a" }}
  />
                  <Bar dataKey="pnl" name="Daily PnL">
                    {charts.dailyPnl.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Chart 3 — Win Rate by Session */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">3. Win Rate % by Trading Session</h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.winRateBySession} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#2a2a2a]" />
                <XAxis dataKey="session" stroke="#64748b" />
                <YAxis stroke="#64748b" unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }} itemStyle={{ color: "#0f172a" }} labelStyle={{ color: "#0f172a" }} />
                <Bar dataKey="winRate" name="Win Rate" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {
    /* Chart 4 — PnL by Setup Type */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">4. PnL Performance by Setup Type</h3>
          <div className="h-72 w-full text-xs">
            {charts.pnlBySetup.length === 0 ? <div className="flex justify-center items-center h-full text-gray-400 dark:text-gray-600">No setups logged</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.pnlBySetup} layout="vertical" margin={{ left: 30, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#2a2a2a]" />
                  <YAxis dataKey="setup" stroke="#64748b" type="category" width={80} />
                  <XAxis stroke="#64748b" type="number" />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }} itemStyle={{ color: "#0f172a" }} labelStyle={{ color: "#0f172a" }} />
                  <Bar dataKey="pnl" name="Setup PnL">
                    {charts.pnlBySetup.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10b981" : "#f43f5e"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Chart 5 — Most Common Mistakes */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">5. Mistakes Occurrences Tracker</h3>
          <div className="h-72 w-full text-xs">
            {charts.mostCommonMistakes.length === 0 ? <div className="flex justify-center items-center h-full text-gray-400 dark:text-gray-600">Perfect track record! No mistakes logged.</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.mostCommonMistakes} layout="vertical" margin={{ left: 40, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#2a2a2a]" />
                  <YAxis dataKey="mistake" stroke="#64748b" type="category" width={100} />
                  <XAxis stroke="#64748b" type="number" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }} itemStyle={{ color: "#0f172a" }} labelStyle={{ color: "#0f172a" }} />
                  <Bar dataKey="count" name="Frequency" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Chart 6 — Win Rate by Direction */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">6. Directional Win Rate Performance</h3>
          <div className="grid grid-cols-2 gap-4 h-72 py-6">
            {
    /* Long Card */
  }
            <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-6 text-center select-none shadow-md">
              <Zap className="w-8 h-8 text-green-600 dark:text-green-500 mb-3 animate-bounce" />
              <p className="text-xs uppercase font-semibold text-[#475569] dark:text-gray-400">Buy / Long</p>
              <h4 className="text-3xl font-black font-mono text-green-600 dark:text-green-400 mt-2">
                {charts.winRateByDirection.longWinRate}%
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-sans">Win rate on bullish entries</p>
            </div>
            
            {
    /* Short Card */
  }
            <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center select-none shadow-md">
              <Zap className="w-8 h-8 text-red-600 dark:text-red-500 mb-3 animate-bounce" />
              <p className="text-xs uppercase font-semibold text-[#475569] dark:text-gray-400">Sell / Short</p>
              <h4 className="text-3xl font-black font-mono text-red-600 dark:text-red-400 mt-2">
                {charts.winRateByDirection.shortWinRate}%
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-sans">Win rate on bearish entries</p>
            </div>
          </div>
        </div>

        {
    /* Chart 8 — Outcome Distribution (Donut Chart) -- Show early before confluence table if desired */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">8. Trade Outcomes Balance Distribution</h3>
          <div className="flex flex-col sm:flex-row items-center justify-around h-72 select-none">
            {donutData.length === 0 ? <div className="text-gray-400 dark:text-gray-600 text-xs">No outcome records</div> : <>
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
    data={donutData}
    innerRadius={55}
    outerRadius={80}
    paddingAngle={4}
    dataKey="value"
  >
                        {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }} itemStyle={{ color: "#0f172a" }} labelStyle={{ color: "#0f172a" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-3 font-mono text-xs w-full sm:w-auto px-6">
                  {charts.outcomeDistribution.map((item) => {
    const color = DONUT_COLORS[item.outcome] || "#404040";
    return <div key={item.outcome} className="flex items-center justify-between gap-6 py-0.5 border-b border-slate-100 dark:border-[#222]">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-[#475569] dark:text-gray-300">{item.outcome}</span>
                        </div>
                        <div className="text-[#0f172a] dark:text-white font-bold text-right font-mono">
                          {item.count} <span className="text-gray-400 dark:text-gray-500 font-normal">({item.percentage}%)</span>
                        </div>
                      </div>;
  })}
                </div>
              </>}
          </div>
        </div>

        {
    /* Chart 7 — Confluences Performance (Inline Table) */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">7. Confluences Performance Tracker</h3>
          <div className="overflow-y-auto h-72 pr-1 border border-[#e2e8f0] dark:border-[#222] rounded-xl bg-slate-50/50 dark:bg-[#121212]/50">
            <table className="w-full text-xs font-sans text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#121212] border-b border-[#e2e8f0] dark:border-[#222] text-[#475569] dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Confluence</th>
                  <th className="py-2.5 px-3 text-center">Frequency</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e1e1e] text-[#475569] dark:text-gray-300">
                {charts.confluencesPerformance.length === 0 ? <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-400 dark:text-gray-500">No confluences tracked</td>
                  </tr> : charts.confluencesPerformance.map((conf) => <tr key={conf.confluence} className="hover:bg-slate-100/50 dark:hover:bg-[#222]/40">
                      <td className="py-2 px-3 font-medium text-[#0f172a] dark:text-white">{conf.confluence}</td>
                      <td className="py-2 px-3 text-center font-mono">{conf.count}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-green-600 dark:text-green-400">{conf.winRate}%</td>
                    </tr>)}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>;
}
