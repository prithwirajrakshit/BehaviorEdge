import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { AlertOctagon, TrendingUp, ShieldAlert, Award } from "lucide-react";
export default function MistakesView({ trades }) {
  const weights = {
    htf: parseFloat(localStorage.getItem("weight_htf") || "30"),
    sr: parseFloat(localStorage.getItem("weight_sr") || "25"),
    vol: parseFloat(localStorage.getItem("weight_vol") || "20"),
    ma: parseFloat(localStorage.getItem("weight_ma") || "15"),
    candle: parseFloat(localStorage.getItem("weight_candle") || "10")
  };
  const getConfluenceScore = (confluences) => {
    let score = 0;
    const conStrList = confluences.map(String);
    if (conStrList.some((c) => c.includes("HTF") || c.includes("Bias"))) {
      score += weights.htf;
    }
    if (conStrList.some((c) => c === "FVG" || c.includes("Liquidity") || c.includes("Discount") || c.includes("High") || c.includes("PD"))) {
      score += weights.sr;
    }
    if (conStrList.some((c) => c === "VWAP")) {
      score += weights.vol;
    }
    if (conStrList.some((c) => c === "Market Structure Shift" || c === "MSS")) {
      score += weights.ma;
    }
    if (conStrList.length > 0) {
      score += weights.candle;
    }
    return score;
  };
  const tradesWithMistakes = trades.filter(
    (t) => t.mistakes && t.mistakes.length > 0 && !t.mistakes.includes("No Mistake") && t.mistakes[0] !== ""
  );
  const cleanTrades = trades.filter(
    (t) => !t.mistakes || t.mistakes.length === 0 || t.mistakes.includes("No Mistake") || t.mistakes[0] === ""
  );
  const totalCostOfMistakes = tradesWithMistakes.reduce((acc, t) => {
    if (t.net_pnl_usd < 0) {
      return acc + Math.abs(t.net_pnl_usd);
    }
    return acc;
  }, 0);
  const profitLostToMistakes = tradesWithMistakes.reduce((acc, t) => {
    return acc + (t.net_pnl_usd < 0 ? Math.abs(t.net_pnl_usd) : 0);
  }, 0);
  const avgLossWithMistakes = tradesWithMistakes.length > 0 ? tradesWithMistakes.reduce((acc, t) => acc + (t.net_pnl_usd < 0 ? t.net_pnl_usd : 0), 0) / tradesWithMistakes.length : 0;
  const avgLossClean = cleanTrades.length > 0 ? cleanTrades.reduce((acc, t) => acc + (t.net_pnl_usd < 0 ? t.net_pnl_usd : 0), 0) / cleanTrades.length : 0;
  const freqMap = {};
  trades.forEach((t) => {
    if (t.mistakes) {
      t.mistakes.forEach((m) => {
        if (m && m !== "No Mistake" && m !== "") {
          freqMap[m] = (freqMap[m] || 0) + 1;
        }
      });
    }
  });
  const frequencyData = Object.keys(freqMap).map((m) => ({
    mistake: m,
    count: freqMap[m]
  })).sort((a, b) => b.count - a.count);
  const bucketLow = trades.filter((t) => getConfluenceScore(t.confluences) < 40);
  const bucketMid = trades.filter((t) => getConfluenceScore(t.confluences) >= 40 && getConfluenceScore(t.confluences) <= 70);
  const bucketHigh = trades.filter((t) => getConfluenceScore(t.confluences) > 70);
  const calcWinRate = (arr) => {
    if (arr.length === 0) return 0;
    const wins = arr.filter((t) => t.outcome === "Win").length;
    return wins / arr.length * 100;
  };
  const confluenceCorrelationData = [
    { bucket: "<40 Low", count: bucketLow.length, winRate: parseFloat(calcWinRate(bucketLow).toFixed(1)) },
    { bucket: "40-70 Mid", count: bucketMid.length, winRate: parseFloat(calcWinRate(bucketMid).toFixed(1)) },
    { bucket: ">70 High", count: bucketHigh.length, winRate: parseFloat(calcWinRate(bucketHigh).toFixed(1)) }
  ];
  const qualityCategories = ["A+", "A", "B", "C", "D"];
  const qualityStats = qualityCategories.map((q) => {
    const qTrades = trades.filter((t) => t.trade_quality === q);
    const sumNet = qTrades.reduce((acc, t) => acc + (t.net_pnl_usd || 0), 0);
    const avgNet = qTrades.length > 0 ? sumNet / qTrades.length : 0;
    return {
      quality: q,
      avgPnL: parseFloat(avgNet.toFixed(2)),
      count: qTrades.length
    };
  });
  const QUALITY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#78716c"];
  const qualityPieData = qualityStats.filter((q) => q.count > 0).map((q, idx) => ({
    name: `Quality ${q.quality}`,
    value: q.count,
    color: QUALITY_COLORS[idx % QUALITY_COLORS.length] || "#444444"
  }));
  const plannedRREff = trades.filter((t) => (t.planned_rr || 0) > 0);
  const avgPlannedRR = plannedRREff.length > 0 ? plannedRREff.reduce((acc, t) => acc + (t.planned_rr || 0), 0) / plannedRREff.length : 0;
  const avgActualRR = plannedRREff.length > 0 ? plannedRREff.reduce((acc, t) => acc + (t.actual_rr || 0), 0) / plannedRREff.length : 0;
  const rrTrendData = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-15).map((t, idx) => ({
    index: idx + 1,
    pair: t.pair_instrument,
    planned: t.planned_rr || 0,
    actual: t.actual_rr || 0
  }));
  const setupLeaderboard = {};
  trades.forEach((t) => {
    if (t.setup_type) {
      if (!setupLeaderboard[t.setup_type]) {
        setupLeaderboard[t.setup_type] = { count: 0, wins: 0, pnl: 0 };
      }
      setupLeaderboard[t.setup_type].count += 1;
      if (t.outcome === "Win") setupLeaderboard[t.setup_type].wins += 1;
      setupLeaderboard[t.setup_type].pnl += t.net_pnl_usd || 0;
    }
  });
  const setupLeaderboardData = Object.keys(setupLeaderboard).map((s) => ({
    setup: s,
    count: setupLeaderboard[s].count,
    winRate: parseFloat((setupLeaderboard[s].wins / setupLeaderboard[s].count * 100).toFixed(1)),
    pnl: parseFloat(setupLeaderboard[s].pnl.toFixed(2))
  })).sort((a, b) => b.pnl - a.pnl);
  const sessions = ["ASIA", "LONDON", "NY", "OVERLAP"];
  const sessionStats = sessions.map((s) => {
    const sTrades = trades.filter((t) => t.session === s);
    const wins = sTrades.filter((t) => t.outcome === "Win").length;
    return {
      session: s,
      count: sTrades.length,
      winRate: sTrades.length > 0 ? Math.round(wins / sTrades.length * 100) : 0,
      pnl: sTrades.reduce((acc, t) => acc + (t.net_pnl_usd || 0), 0)
    };
  });
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  };
  const dayStats = days.map((d) => {
    const dTrades = trades.filter((t) => getDayName(t.date) === d);
    const wins = dTrades.filter((t) => t.outcome === "Win").length;
    return {
      day: d,
      count: dTrades.length,
      winRate: dTrades.length > 0 ? Math.round(wins / dTrades.length * 100) : 0,
      pnl: dTrades.reduce((acc, t) => acc + (t.net_pnl_usd || 0), 0)
    };
  });
  return <div className="space-y-8 pb-10 text-slate-800 dark:text-white animate-fade-in">
      {
    /* Header Segment */
  }
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-md dark:shadow-lg gap-4">
        <div>
          <span className="text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 font-mono text-red-655 dark:text-red-400 px-3 py-1.5 rounded-lg select-none font-bold">
            Analytics & Error Intelligence
          </span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">Trading Performance Center</h2>
          <p className="text-xs text-slate-550 dark:text-gray-500 font-mono mt-1">Deep analysis covering emotional traps, confluence alignment, and setup optimization.</p>
        </div>
      </div>

      {
    /* Row 1: Section 6 Mistake Stats Row */
  }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-5 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 dark:text-gray-405 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Absolute Error Loss</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-xl lg:text-3xl font-black font-mono tracking-tight text-red-600 dark:text-red-500">
              -${totalCostOfMistakes.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Capital leaked directly in trades with behavioral mistakes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-5 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 dark:text-gray-405 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Mistake Lost Margin</span>
            <AlertOctagon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="text-xl lg:text-3xl font-black font-mono tracking-tight text-orange-600 dark:text-orange-400">
              -${profitLostToMistakes.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Gross cost of mistake-related trades</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-5 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 dark:text-gray-405 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Avg Error Trade Loss</span>
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="text-xl lg:text-3xl font-black font-mono tracking-tight text-slate-700 dark:text-gray-300">
              {avgLossWithMistakes < 0 ? `-$${Math.abs(avgLossWithMistakes).toFixed(2)}` : "\u2014"}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Average outcome when committing mistakes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-5 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 dark:text-gray-405 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Avg Clean PnL</span>
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-xl lg:text-3xl font-black font-mono tracking-tight text-green-655 dark:text-green-400">
              {avgLossClean < 0 ? `-$${Math.abs(avgLossClean).toFixed(2)}` : "\u2014"}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Average outcome when adhering to trading discipline</p>
          </div>
        </div>
      </div>

      {
    /* Row 2: Charts for Section 6 (Mistakes Frequency) & Section 7 (Confluence Alignment Graph) */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {
    /* Card 1: Behavior Frequency */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase font-mono">🚫 Mistake Frequency Analysis</h3>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Categorized tracking of behavioral/psychological mistakes</p>
          </div>
          <div className="h-64 w-full">
            {frequencyData.length === 0 ? <div className="text-xs text-center text-slate-450 dark:text-gray-600 font-mono py-24">No mistakes logged yet! Keep it clean.</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData} layout="vertical" margin={{ left: 20 }}>
                  <defs>
                    <linearGradient id="mistakeRedGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#be123c" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0.9} />
                    </linearGradient>
                    <filter id="mistakeBarGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-100 dark:stroke-[#222]" />
                  <XAxis type="number" stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} tickLine={false} />
                  <YAxis dataKey="mistake" type="category" stroke="currentColor" className="text-slate-500 dark:text-gray-400" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "rgba(14, 11, 24, 0.9)", 
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderColor: "rgba(124, 58, 237, 0.4)", 
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(124, 58, 237, 0.15)",
                      borderWidth: "1px",
                      padding: "8px 12px"
                    }} 
                    itemStyle={{ color: "#a78bfa", fontFamily: "Inter, sans-serif", fontSize: "0.78rem" }} 
                    labelStyle={{ color: "#ffffff", fontFamily: "Inter, sans-serif", fontWeight: "bold", fontSize: "0.8rem", marginBottom: "4px" }} 
                  />
                  <Bar dataKey="count" fill="url(#mistakeRedGlow)" filter="url(#mistakeBarGlow)" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Card 2: Confluence Alignment Graph */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase font-mono">📈 Confluence Alignment vs. Win Rate</h3>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Correlating your Confluence score segments with winning probabilities</p>
          </div>
          <div className="h-64 w-full col-span-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confluenceCorrelationData} margin={{ top: 10, bottom: 10 }}>
                <defs>
                  <filter id="confluenceLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-100 dark:stroke-[#222]" />
                <XAxis dataKey="bucket" stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} tickLine={false} />
                <YAxis stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} tickLine={false} label={{ value: "Win Rate %", angle: -90, position: "insideLeft", stroke: "currentColor", className: "text-slate-400 dark:text-gray-550", fontSize: "11" }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "rgba(14, 11, 24, 0.9)", 
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: "rgba(124, 58, 237, 0.4)", 
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(124, 58, 237, 0.15)",
                    borderWidth: "1px",
                    padding: "8px 12px"
                  }} 
                  itemStyle={{ color: "#a78bfa", fontFamily: "Inter, sans-serif", fontSize: "0.78rem" }} 
                  labelStyle={{ color: "#ffffff", fontFamily: "Inter, sans-serif", fontWeight: "bold", fontSize: "0.8rem", marginBottom: "4px" }} 
                />
                <Line type="monotone" dataKey="winRate" stroke="#60a5fa" name="Win Rate %" strokeWidth={3.5} dot={{ r: 4, stroke: "#60a5fa", strokeWidth: 1, fill: "#0e0b18" }} activeDot={{ r: 6, fill: "#60a5fa", stroke: "#2563eb", strokeWidth: 2 }} filter="url(#confluenceLineGlow)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {
    /* Row 3: Section 8 Trade Quality & Section 9 R/R Efficiency */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {
    /* Card 3: Trade Quality Analytics */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase font-mono">🎖️ Trade Quality Analytics</h3>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Average PnL by setup quality bracket (A+ down to D)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="h-56 w-full sm:col-span-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityStats}>
                  <defs>
                    <linearGradient id="qualityBlueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4} />
                    </linearGradient>
                    <filter id="qualityBarGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-100 dark:stroke-[#222]" />
                  <XAxis dataKey="quality" stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "rgba(14, 11, 24, 0.9)", 
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderColor: "rgba(124, 58, 237, 0.4)", 
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(124, 58, 237, 0.15)",
                      borderWidth: "1px",
                      padding: "8px 12px"
                    }} 
                    itemStyle={{ color: "#a78bfa", fontFamily: "Inter, sans-serif", fontSize: "0.78rem" }} 
                    labelStyle={{ color: "#ffffff", fontFamily: "Inter, sans-serif", fontWeight: "bold", fontSize: "0.8rem", marginBottom: "4px" }} 
                  />
                  <Bar dataKey="avgPnL" fill="url(#qualityBlueGlow)" filter="url(#qualityBarGlow)" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <p className="text-xs text-slate-450 dark:text-gray-400 font-mono font-bold">Distribution</p>
              {qualityStats.map((item, idx) => <div key={item.quality} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: QUALITY_COLORS[idx] }} />
                  <span className="text-slate-800 dark:text-white font-bold font-mono">{item.quality}:</span>
                  <span className="text-slate-400 dark:text-gray-500">[{item.count} trades]</span>
                </div>)}
            </div>
          </div>
        </div>

        {
    /* Card 4: R/R Efficiency Tracking */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase font-mono">🎯 Planned vs. Actual R/R</h3>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Measuring your R/R optimization and target extraction efficiency</p>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="text-slate-500 dark:text-gray-400">Planned: <strong>{avgPlannedRR.toFixed(1)}R</strong></span>
              <span className="text-blue-600 dark:text-blue-400 ml-3">Actual: <strong>{avgActualRR.toFixed(1)}R</strong></span>
            </div>
          </div>
          <div className="h-56 w-full">
            {rrTrendData.length === 0 ? <div className="text-xs text-center text-slate-450 dark:text-gray-600 font-mono py-24">Set Planned & Actual Risk/Rewards to log trends.</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rrTrendData}>
                  <defs>
                    <linearGradient id="rrPlannedGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#64748b" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="rrActualGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                    </linearGradient>
                    <filter id="rrBarGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-100 dark:stroke-[#222]" />
                  <XAxis dataKey="pair" stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={9} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "rgba(14, 11, 24, 0.9)", 
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderColor: "rgba(124, 58, 237, 0.4)", 
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(124, 58, 237, 0.15)",
                      borderWidth: "1px",
                      padding: "8px 12px"
                    }} 
                    itemStyle={{ color: "#a78bfa", fontFamily: "Inter, sans-serif", fontSize: "0.78rem" }} 
                    labelStyle={{ color: "#ffffff", fontFamily: "Inter, sans-serif", fontWeight: "bold", fontSize: "0.8rem", marginBottom: "4px" }} 
                  />
                  <Legend verticalAlign="top" fontSize={10} wrapperStyle={{ color: "currentColor" }} />
                  <Bar dataKey="planned" name="Planned R/R" fill="url(#rrPlannedGlow)" filter="url(#rrBarGlow)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="actual" name="Actual R/R" fill="url(#rrActualGlow)" filter="url(#rrBarGlow)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>
      </div>

      {
    /* Row 4: Section 10 Setup Leaderboard & Section 11 Heatmaps */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {
    /* Setup Type Leaderboard */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase font-mono">🏆 Setup Leaderboard</h3>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Ranking of registered setups by net profit accumulation</p>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] mt-4 pr-1 scrollbar-thin">
            {setupLeaderboardData.length === 0 ? <div className="text-xs text-slate-450 dark:text-gray-600 font-mono text-center py-24">No setups registered yet.</div> : setupLeaderboardData.map((item, idx) => <div key={item.setup} className="bg-slate-50 dark:bg-[#121212] border border-slate-150 dark:border-[#222] rounded-xl p-3 flex justify-between items-center transition-all hover:bg-slate-100 dark:hover:bg-[#222]/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/10 px-2 py-0.5 rounded font-mono font-bold font-mono">#{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{item.setup}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className={`font-black block ${item.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-655 dark:text-red-400"}`}>
                      {item.pnl >= 0 ? `+$${item.pnl.toFixed(0)}` : `-$${Math.abs(item.pnl).toFixed(0)}`}
                    </span>
                    <span className="text-[9px] text-slate-450 dark:text-gray-500 font-bold block">WR: {item.winRate}% ({item.count} Tr)</span>
                  </div>
                </div>)}
          </div>
        </div>

        {
    /* Heatmaps (NY/LONDON / Days) */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] p-5 rounded-2xl shadow-md dark:shadow-xl space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase font-mono">⌛ Periodic Market Heatmaps</h3>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Highlighting top-performing trading windows & days of the week</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 flex-1">
            {
    /* Heatmap 1: Trading Sessions */
  }
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 font-mono uppercase">⏰ Session Distribution</h4>
              <div className="space-y-2">
                {sessionStats.map((item) => <div key={item.session} className="relative bg-slate-50 dark:bg-[#121212] rounded-xl p-3 border border-slate-150 dark:border-[#222] overflow-hidden">
                    <div
    className={`absolute top-0 bottom-0 left-0 opacity-[0.05]`}
    style={{
      width: `${item.winRate}%`,
      backgroundColor: item.pnl >= 0 ? "#10b981" : "#ef4444"
    }}
  />
                    <div className="relative flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{item.session}</span>
                      <div className="text-right font-mono text-xs">
                        <span className={`font-black text-xs block ${item.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-655 dark:text-red-400"}`}>
                          {item.pnl >= 0 ? `+$${item.pnl.toFixed(0)}` : `-$${Math.abs(item.pnl).toFixed(0)}`}
                        </span>
                        <span className="text-[9px] text-slate-450 dark:text-gray-500 font-bold uppercase tracking-wider block">Win rate: {item.winRate}%</span>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>

            {
    /* Heatmap 2: Days of Week */
  }
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 font-mono uppercase">📅 Day of Week Distribution</h4>
              <div className="space-y-2">
                {dayStats.map((item) => <div key={item.day} className="relative bg-slate-50 dark:bg-[#121212] rounded-xl p-3 border border-slate-150 dark:border-[#222] overflow-hidden">
                    <div
    className={`absolute top-0 bottom-0 left-0 opacity-[0.05]`}
    style={{
      width: `${item.winRate}%`,
      backgroundColor: item.pnl >= 0 ? "#10b981" : "#ef4444"
    }}
  />
                    <div className="relative flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{item.day}</span>
                      <div className="text-right font-mono text-xs">
                        <span className={`font-black text-xs block ${item.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-655 dark:text-red-400"}`}>
                          {item.pnl >= 0 ? `+$${item.pnl.toFixed(0)}` : `-$${Math.abs(item.pnl).toFixed(0)}`}
                        </span>
                        <span className="text-[9px] text-slate-450 dark:text-gray-500 font-bold uppercase tracking-wider block">Win rate: {item.winRate}%</span>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
