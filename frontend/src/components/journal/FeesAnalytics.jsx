import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import { OutcomeBadge, DirectionBadge } from "./Badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { Calculator, Percent, Sparkles, Scale, AlertTriangle, Coins, TrendingUp, RefreshCw } from "lucide-react";
export default function FeesAnalytics({ showToast, trades }) {
  const [loading, setLoading] = useState(true);
  const [feesData, setFeesData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const fetchFeesData = async () => {
    setLoading(true);
    try {
      const response = await authFetch("/api/analytics/fees");
      if (!response.ok) throw new Error("Crashed retrieving fees databases metrics.");
      const data = await response.json();
      setFeesData(data);
    } catch (err) {
      showToast(err.message || "Error loading fees analytics.", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFeesData();
  }, [trades]);
  if (loading) {
    return <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="animate-spin h-10 w-10 text-red-500" />
        <p className="text-gray-400 text-sm font-mono tracking-wider">Compiling Fee Matrix Logs...</p>
      </div>;
  }
  if (!feesData) {
    return <p className="text-center text-gray-500 py-12">No fees analytics database found.</p>;
  }
  const sortedTrades = [...trades].sort((a, b) => b.date.localeCompare(a.date));
  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const paginatedTrades = sortedTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  let totalGross = 0;
  let totalFeesPaid = 0;
  let totalNet = 0;
  trades.forEach((t) => {
    totalGross += t.pnl_usd;
    totalFeesPaid += Math.abs(t.fee_usd);
    totalNet += t.net_pnl_usd;
  });
  const totalFeePct = totalGross <= 0 ? 0 : totalFeesPaid / totalGross * 100;
  return <div className="space-y-6 pb-10">
      {
    /* Title */
  }


      {
    /* 4 Summary Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {
    /* Total Fees */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-md dark:shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-650 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-gray-400">Total Fees Paid</p>
            <h4 className="text-xl font-black font-mono text-red-605 dark:text-red-400 mt-1">
              -${Math.abs(feesData.totalFees).toFixed(2)}
            </h4>
          </div>
        </div>

        {
    /* Avg Fee */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-md dark:shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-605 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-gray-400">Avg Fee / Trade</p>
            <h4 className="text-xl font-black font-mono text-[#0f172a] dark:text-gray-300 mt-1">
              -${Math.abs(feesData.averageFeePerTrade).toFixed(2)}
            </h4>
          </div>
        </div>

        {
    /* Biggest Single Fee */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-md dark:shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-605 border border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-gray-400">Biggest Single Fee</p>
            <h4 className="text-xl font-black font-mono text-red-605 dark:text-red-400 mt-1">
              -${Math.abs(feesData.biggestSingleFee).toFixed(2)}
            </h4>
          </div>
        </div>

        {
    /* Fees % of Gross PnL */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl p-5 shadow-md dark:shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 text-yellow-605 border border-yellow-105 dark:bg-yellow-950/30 dark:text-yellow-500 dark:border-yellow-900/40 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-gray-400">Fees % of Gross PnL</p>
            <h4 className="text-xl font-black font-mono text-yellow-600 dark:text-yellow-400 mt-1">
              {feesData.feesPercentageOfGross.toFixed(1)}%
            </h4>
          </div>
        </div>
      </div>

      {
    /* Fee Impact Panels */
  }
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {
    /* Card 1: Turns Wins into Losses */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-orange-200 dark:border-orange-900/20 bg-gradient-to-br from-white to-orange-50/20 dark:from-[#1a1a1a] dark:to-orange-950/[0.05] p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-5 h-5 text-orange-555" />
            <span>Broker Fee Drag Impact</span>
          </div>
          <div className="my-5">
            <h5 className="text-2xl font-black text-[#0f172a] dark:text-white font-mono">
              {feesData.feeImpact.feesTurnedWinsToLosses} Classic Trades
            </h5>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              Fees turned {feesData.feeImpact.feesTurnedWinsToLosses} winning trades directly into losses. High-frequency entries in high-slippage pairs can erode net profits.
            </p>
          </div>
        </div>

        {
    /* Card 2: Lost revenue absolute */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-red-200 dark:border-red-900/20 bg-gradient-to-br from-white to-red-50/20 dark:from-[#1a1a1a] dark:to-red-950/[0.05] p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wide">
            <Sparkles className="w-5 h-5 text-red-555 animate-pulse" />
            <span>Wasted Capital Stream</span>
          </div>
          <div className="my-5">
            <h5 className="text-2xl font-black text-red-655 dark:text-red-400 font-mono">
              ${feesData.feeImpact.extraMoneyWithoutFees.toFixed(2)} USD
            </h5>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              You would have saved or earned exactly ${feesData.feeImpact.extraMoneyWithoutFees.toFixed(2)} more without broker commissions during this period.
            </p>
          </div>
        </div>

        {
    /* Card 3: Most expensive trading day */
  }
        <div className="bg-white dark:bg-[#1a1a1a] border border-purple-250 dark:border-purple-900/20 bg-gradient-to-br from-white to-purple-50/25 dark:from-[#1a1a1a] dark:to-transparent p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center space-x-2 text-purple-650 dark:text-purple-400 font-bold text-xs uppercase tracking-wide">
            <TrendingUp className="w-5 h-5 text-purple-555" />
            <span>Heavy Slippage Outflow Day</span>
          </div>
          <div className="my-5">
            {feesData.feeImpact.mostExpensiveTradingDay.date ? <>
                <h5 className="text-lg font-bold text-[#0f172a] dark:text-white font-mono truncate">
                  {feesData.feeImpact.mostExpensiveTradingDay.date}
                </h5>
                <p className="text-2xl font-black font-mono text-purple-650 dark:text-purple-400 mt-1">
                  -${feesData.feeImpact.mostExpensiveTradingDay.amount.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 font-sans leading-tight">
                  Your most expensive trading day by brokerage slippage fees.
                </p>
              </> : <span className="text-xs text-slate-400 dark:text-gray-500">No trading day recorded yet.</span>}
          </div>
        </div>
      </div>

      {
    /* Charts Layout */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {
    /* Cumulative Fees Chart */
  }
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">Cumulative Fees (Absolute Drag)</h3>
          <div className="h-60 w-full text-xs">
            {feesData.cumulativeFees.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 dark:text-gray-600">No fee logs available</div> : <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feesData.cumulativeFees} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <defs>
                    <filter id="feesLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#222]" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
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
                  <Line type="monotone" dataKey="fees" name="Total Fees" stroke="#fb7185" strokeWidth={3.5} dot={{ r: 4, stroke: "#fb7185", strokeWidth: 1, fill: "#0e0b18" }} filter="url(#feesLineGlow)" />
                </LineChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Daily Fees Bar Chart */
  }
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">Daily Fees Outflow</h3>
          <div className="h-60 w-full text-xs">
            {feesData.dailyFees.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 dark:text-gray-600">No fee logs available</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feesData.dailyFees} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="feesRedGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#be123c" stopOpacity={0.4} />
                    </linearGradient>
                    <filter id="feesBarGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#222]" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
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
                  <Bar dataKey="fees" name="Daily Fee" fill="url(#feesRedGlow)" filter="url(#feesBarGlow)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* Fees by Contract Horizontal Chart */
  }
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">Fees by Trading Instrument</h3>
          <div className="h-60 w-full text-xs">
            {feesData.feesByContract.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 dark:text-gray-600">No fee logs available</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feesData.feesByContract} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="instrumentRedGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#be123c" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0.9} />
                    </linearGradient>
                    <filter id="instrumentBarGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#222]" />
                  <YAxis dataKey="pair" stroke="#64748b" type="category" width={60} />
                  <XAxis stroke="#64748b" type="number" />
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
                  <Bar dataKey="fees" name="Fees Paid" fill="url(#instrumentRedGlow)" filter="url(#instrumentBarGlow)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>

      </div>

      {
    /* Fees Breakdown Datagrid Table */
  }
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl space-y-4">
        <div className="p-5 border-b border-slate-100 dark:border-[#2a2a2a]">
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">Brokerage Commissions Ledger</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Granular breakdown showing the cost percentage of fees against gross trade outcomes.</p>
        </div>

        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#121212] border-b border-slate-200 dark:border-[#2a2a2a] text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-4">Pair</th>
                <th className="py-3 px-4 text-center">Direction</th>
                <th className="py-3 px-4 text-right">Gross PnL</th>
                <th className="py-3 px-4 text-right text-red-600 dark:text-red-400">Commission Fee</th>
                <th className="py-3 px-4 text-right">Net Return PnL</th>
                <th className="py-3 px-4 text-right">Fee Impact %</th>
                <th className="py-3 px-5 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242424] text-sm text-[#0f172a] dark:text-gray-300">
              {paginatedTrades.length === 0 ? <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 dark:text-gray-500 text-xs italic">
                    No transactions recorded to populate fee list.
                  </td>
                </tr> : paginatedTrades.map((t) => {
    const feeAbs = Math.abs(t.fee_usd);
    const grossAbs = Math.abs(t.pnl_usd);
    const feePct = grossAbs === 0 ? 0 : feeAbs / grossAbs * 100;
    const isHighImpact = feePct > 5;
    return <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#202020]/20 select-text">
                      <td className="py-3 px-5 font-mono text-xs text-slate-500 dark:text-gray-400">{t.date}</td>
                      <td className="py-3 px-4 font-bold text-[#0f172a] dark:text-white">{t.pair_instrument}</td>
                      <td className="py-3 px-4 text-center"><DirectionBadge direction={t.direction} /></td>
                      
                      {
      /* Gross PnL */
    }
                      <td className={`py-3 px-4 text-right font-mono ${t.pnl_usd >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        {t.pnl_usd >= 0 ? `+$${t.pnl_usd.toFixed(2)}` : `-$${Math.abs(t.pnl_usd).toFixed(2)}`}
                      </td>

                      {
      /* Fee in red */
    }
                      <td className="py-3 px-4 text-right font-mono text-red-600 dark:text-red-500">
                        -${feeAbs.toFixed(2)}
                      </td>

                      {
      /* Net PnL */
    }
                      <td className={`py-3 px-4 text-right font-mono ${t.net_pnl_usd >= 0 ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600 dark:text-red-400"}`}>
                        {t.net_pnl_usd >= 0 ? `+$${t.net_pnl_usd.toFixed(2)}` : `-$${Math.abs(t.net_pnl_usd).toFixed(2)}`}
                      </td>

                      {
      /* Fee % optionally highlighted if > 5% */
    }
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block font-mono text-xs px-2.5 py-0.5 rounded ${isHighImpact ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/30" : "text-slate-500 dark:text-gray-400"}`}>
                          {feePct.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 px-5 text-center"><OutcomeBadge outcome={t.outcome} /></td>
                    </tr>;
  })}
            </tbody>
            
            {
    /* Total Row */
  }
            {trades.length > 0 && <tfoot className="bg-slate-50/80 dark:bg-[#121212] border-t-2 border-slate-200 dark:border-[#2c2c2c] text-sm font-bold text-[#0f172a] dark:text-white">
                <tr>
                  <td className="py-4 px-5">Total Sum</td>
                  <td className="py-4 px-4">—</td>
                  <td className="py-4 px-4 text-center">—</td>
                  <td className={`py-4 px-4 text-right font-mono ${totalGross >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                    {totalGross >= 0 ? `+$${totalGross.toFixed(2)}` : `-$${Math.abs(totalGross).toFixed(2)}`}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-red-600 dark:text-red-500">
                    -${totalFeesPaid.toFixed(2)}
                  </td>
                  <td className={`py-4 px-4 text-right font-mono ${totalNet >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {totalNet >= 0 ? `+$${totalNet.toFixed(2)}` : `-$${Math.abs(totalNet).toFixed(2)}`}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-xs text-yellow-650 dark:text-yellow-500">
                    {totalFeePct.toFixed(1)}% Avg
                  </td>
                  <td className="py-4 px-5 text-center">—</td>
                </tr>
              </tfoot>}
          </table>
        </div>

        {
    /* Pagination in fees ledger */
  }
        {totalPages > 1 && <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#121212] border-t border-slate-100 dark:border-[#2a2a2a] text-xs text-slate-500 dark:text-gray-400">
            <div>
              Showing page <span className="font-bold text-[#0f172a] dark:text-white">{currentPage}</span> of{" "}
              <span className="font-bold text-[#0f172a] dark:text-white">{totalPages}</span> sheets
            </div>

            <div className="flex items-center space-x-2">
              <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
    className="p-1 px-3 rounded bg-white hover:bg-slate-100 dark:bg-[#111] dark:hover:bg-[#222] border border-slate-200 dark:border-[#333] text-slate-700 dark:text-gray-300 disabled:opacity-40 transition-all cursor-pointer font-mono"
  >
                Prev
              </button>
              <button
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage(currentPage + 1)}
    className="p-1 px-3 rounded bg-white hover:bg-slate-100 dark:bg-[#111] dark:hover:bg-[#222] border border-slate-200 dark:border-[#333] text-slate-700 dark:text-gray-300 disabled:opacity-40 transition-all cursor-pointer font-mono"
  >
                Next
              </button>
            </div>
          </div>}
      </div>
    </div>;
}
