import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import { Scroll, Trash2, Edit, Save, Award, Sliders, ToggleLeft, ToggleRight, CheckSquare, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const CATEGORIES = [
  "Entry Rules",
  "Exit Rules",
  "Risk Rules",
  "Session Rules",
  "Mindset Rules",
  "Setup Rules"
];
export default function RulesView({ trades, showToast }) {
  const [rules, setRules] = useState([]);
  const [ruleChecks, setRuleChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [ruleText, setRuleText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isActive, setIsActive] = useState(true);
  const fetchRulesAndChecks = async () => {
    try {
      setLoading(true);
      const resRules = await authFetch("/api/trading_rules");
      if (!resRules.ok) throw new Error("Could not pull rules directory.");
      const dataRules = await resRules.json();
      setRules(dataRules);
      const resChecks = await authFetch("/api/rule_checks");
      if (resChecks.ok) {
        const dataChecks = await resChecks.json();
        setRuleChecks(dataChecks);
      }
    } catch (err) {
      showToast(err.message || "Error sync rules metrics.", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRulesAndChecks();
  }, []);
  const resetForm = () => {
    setEditingId(null);
    setRuleText("");
    setCategory(CATEGORIES[0]);
    setIsActive(true);
  };
  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!ruleText.trim()) {
      showToast("Rule text cannot be empty.", "error");
      return;
    }
    const payload = {
      rule_text: ruleText.trim(),
      category,
      is_active: isActive
    };
    const endpoint = editingId ? `/api/trading_rules/${editingId}` : "/api/trading_rules";
    const method = editingId ? "PUT" : "POST";
    try {
      const res = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to record compliance rule.");
      showToast(`Rule successfully ${editingId ? "updated" : "created"}!`, "success");
      resetForm();
      fetchRulesAndChecks();
    } catch (err) {
      showToast(err.message || "Error saving rule.", "error");
    }
  };
  const handleToggleActive = async (rule) => {
    const nextActive = !rule.is_active;
    try {
      const res = await authFetch(`/api/trading_rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive })
      });
      if (!res.ok) throw new Error("Active toggle update failed.");
      showToast(`Rule toggled ${nextActive ? "Active" : "Inactive"}.`, "success");
      fetchRulesAndChecks();
    } catch (err) {
      showToast(err.message || "Could not update status.", "error");
    }
  };
  const handleTriggerEdit = (rule) => {
    setEditingId(rule.id || null);
    setRuleText(rule.rule_text);
    setCategory(rule.category || CATEGORIES[0]);
    setIsActive(!!rule.is_active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDeleteRule = async (id) => {
    if (!window.confirm("Wipe out this trading rule entirely from directory?")) return;
    try {
      const res = await authFetch(`/api/trading_rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Clear deletion rejected.");
      showToast("Trading policy rule wiped.", "success");
      if (editingId === id) resetForm();
      fetchRulesAndChecks();
    } catch (err) {
      showToast(err.message || "Error deleting policy.", "error");
    }
  };
  const calcBrokenRate = (broken, checked) => {
    if (checked === 0) return 0;
    return Math.round(broken / checked * 100);
  };
  const getVerdict = (rate) => {
    if (rate < 10) return { label: "Well Followed", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20" };
    if (rate <= 30) return { label: "Needs Attention", color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20" };
    return { label: "Frequently Broken", color: "text-red-655 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" };
  };
  const computePnlWhenBroken = (ruleId) => {
    const brokensForThisRule = ruleChecks.filter((rc) => rc.rule_id === ruleId && !rc.was_followed);
    let sumPnl = 0;
    brokensForThisRule.forEach((c) => {
      const matchedTrade = trades.find((t) => t.id === c.trade_id);
      if (matchedTrade) {
        sumPnl += matchedTrade.net_pnl_usd;
      }
    });
    return sumPnl;
  };
  const performanceRows = rules.map((rule) => {
    const checked = rule.times_checked;
    const broken = rule.times_broken;
    const rate = calcBrokenRate(broken, checked);
    const pnlWhenBroken = computePnlWhenBroken(rule.id);
    const verdict = getVerdict(rate);
    return {
      ...rule,
      checked,
      broken,
      rate,
      pnlWhenBroken,
      verdict
    };
  }).sort((a, b) => b.rate - a.rate);
  const getComplianceChartData = () => {
    const dates = Array.from({ length: 4 }).map((_, i) => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i * 7);
      return d;
    }).reverse();
    return dates.map((dateStart, idx) => {
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 7);
      const startStr = dateStart.toISOString().substring(0, 10);
      const endStr = dateEnd.toISOString().substring(0, 10);
      const label = `Wk -${3 - idx}`;
      const checksInWeek = ruleChecks.filter((rc) => rc.date >= startStr && rc.date <= endStr);
      const totalChecked = checksInWeek.length;
      const totalBroken = checksInWeek.filter((rc) => !rc.was_followed).length;
      const brokenRate = totalChecked === 0 ? 0 : Math.round(totalBroken / totalChecked * 100);
      return {
        name: label,
        "Broken Rate (%)": brokenRate,
        "Total Checked": totalChecked
      };
    });
  };
  const chartData = getComplianceChartData();
  return <div className="space-y-8 pb-10 text-slate-800 dark:text-white animate-fade-in">
      
      {
    /* Page Header */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-md dark:shadow-lg gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">Compliance & Policy Administration</h2>
          <p className="text-xs text-slate-500 dark:text-gray-500 italic mt-1">Formalize self-regulations, mindset policies, and process execution criteria.</p>
        </div>
      </div>

      {
    /* SECTION A: Add/Edit Rules Form & Side-by-Side Policies List */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {
    /* Form panel */
  }
        <div className="lg:col-span-5 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-6 shadow-md dark:shadow-xl space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-150 dark:border-[#2a2a2a] pb-3">
            <Scroll className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                {editingId ? "Edit Policy Rule" : "Create Trading Policy Directive"}
              </h3>
              <p className="text-xs text-slate-400 dark:text-gray-400 italic">Formalize self-regulations and psychological risk thresholds.</p>
            </div>
          </div>

          <form onSubmit={handleSaveRule} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Rule text statement</label>
              <textarea
    value={ruleText}
    onChange={(e) => setRuleText(e.target.value)}
    placeholder="e.g. Do not risk more than 1% per trade. Avoid FOMO entries."
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-550 rounded-xl p-3 text-xs text-slate-800 dark:text-white min-h-[90px]"
    required
  />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Category</label>
              <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-550 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
  >
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-[#151225]/45 border border-slate-150 dark:border-violet-500/15 rounded-xl p-3">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Active Rule Status</p>
                <p className="text-[10px] text-slate-450 dark:text-gray-400 font-mono">Inactive rules will hide from checkout checklists</p>
              </div>
              <button
    type="button"
    onClick={() => setIsActive(!isActive)}
    className="text-blue-600 dark:text-blue-500 hover:text-blue-500 transition cursor-pointer"
  >
                {isActive ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-300 dark:text-gray-600" />}
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
    type="button"
    onClick={resetForm}
    className="px-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#323232] rounded-xl text-xs text-slate-600 dark:text-gray-300 font-bold cursor-pointer transition-colors"
  >
                Reset
              </button>
              <button
    type="submit"
    className="btn-neon btn-neon-sm flex items-center gap-1.5 cursor-pointer"
  >
                <Save className="w-3.5 h-3.5" />
                <span>Save Policy Option</span>
              </button>
            </div>
          </form>
        </div>

        {
    /* Directory layout */
  }
        <div className="lg:col-span-7 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-6 shadow-md dark:shadow-xl space-y-5">
          <div className="border-b border-slate-150 dark:border-[#2a2a2a] pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Policy Book Checklist</h3>
              <p className="text-xs text-slate-400 dark:text-gray-400 italic">Review status and performance rates of all listed items.</p>
            </div>
            <span className="text-[10px] font-mono bg-pink-50 dark:bg-pink-500/10 text-[#e11d75] dark:text-[#f43f5e] border border-pink-200 dark:border-pink-500/20 px-2.5 py-1 rounded-full font-bold">
              {rules.length} total rules
            </span>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {loading ? <div className="text-center py-10 font-mono text-xs text-slate-450 dark:text-gray-500">Querying active parameters...</div> : rules.length > 0 ? CATEGORIES.map((cat) => {
    const catRules = rules.filter((r) => r.category === cat);
    if (catRules.length === 0) return null;
    return <div key={cat} className="space-y-2">
                    <p className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-400 dark:text-gray-550 pl-1">{cat}</p>
                    <div className="space-y-2">
                      {catRules.map((rule) => <div
      key={rule.id}
      className={`p-3.5 rounded-xl border transition-all flex justify-between items-center ${rule.is_active ? "bg-slate-50 dark:bg-[#151225]/45 border-slate-150 dark:border-violet-500/15 hover:border-slate-205 dark:hover:border-violet-500/25" : "bg-slate-50/50 dark:bg-[#151225]/25 border-slate-200/50 dark:border-violet-500/10 opacity-60"}`}
    >
                          <div className="space-y-2 max-w-[70%]">
                            <p className="text-xs text-slate-700 dark:text-gray-200 font-sans leading-relaxed font-bold">{rule.rule_text}</p>
                            <div className="flex gap-2 font-mono text-[9px] select-none flex-wrap">
                              <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200/50 dark:border-green-500/10 px-1.5 py-0.5 rounded font-bold">Checked: {rule.times_checked}</span>
                              <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/10 px-1.5 py-0.5 rounded font-bold">Broken: {rule.times_broken}</span>
                              <span className="text-[#e11d75] dark:text-[#f43f5e] bg-pink-50 dark:bg-pink-500/10 border border-pink-200/50 dark:border-pink-500/10 px-1.5 py-0.5 rounded font-bold">
                                {calcBrokenRate(rule.times_broken, rule.times_checked)}% rate
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
      onClick={() => handleToggleActive(rule)}
      className="text-slate-400 hover:text-slate-705 dark:text-gray-400 dark:hover:text-white transition cursor-pointer"
      title={rule.is_active ? "Disable rule" : "Enable rule"}
    >
                              {rule.is_active ? <CheckSquare className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-gray-600" />}
                            </button>
                            <button
      onClick={() => handleTriggerEdit(rule)}
      className="p-1 hover:bg-slate-100 dark:hover:bg-violet-500/10 text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white rounded-lg transition cursor-pointer"
    >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
      onClick={() => handleDeleteRule(rule.id)}
      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:bg-red-100 rounded-lg transition cursor-pointer"
    >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>)}
                    </div>
                  </div>;
  }) : <p className="text-center py-10 text-slate-400 dark:text-gray-550 font-mono text-xs">No policies defined. Creating one above to activate strict discipline.</p>}
          </div>
        </div>
      </div>

      {
    /* CLUSTERING LAYOUT FOR CHART & TABLE */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-bold">
        
        {
    /* SECTION B: Rules Performance Table (cols 8/12) */
  }
        <div className="lg:col-span-8 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-6 shadow-md dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-[#2a2a2a] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wide">Leakage Performance</h3>
                <p className="text-[10px] text-slate-400 dark:text-gray-500">Rules ranked by Broken Rate descending.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 tracking-wider">COMPLIANCE LEDGER</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-gray-400">
              <thead>
                <tr className="border-b border-slate-150 dark:border-violet-500/15 font-mono uppercase tracking-wider text-[10px] text-slate-400 dark:text-gray-500">
                  <th className="py-2.5">Rule text</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-center">Checked / Broken</th>
                  <th className="py-2.5 text-center">Broken Rate</th>
                  <th className="py-3 text-right">PnL Flow</th>
                  <th className="py-2.5 pl-4 text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-violet-500/10 font-mono">
                {performanceRows.length > 0 ? performanceRows.map((row) => <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-[#1f1f1f] transition-all">
                      <td className="py-3 font-semibold text-slate-800 dark:text-white max-w-[200px] truncate" title={row.rule_text}>
                        {row.rule_text}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-gray-400 text-[10px]">{row.category}</td>
                      <td className="py-3 text-center text-slate-700 dark:text-gray-300">
                        {row.checked} <span className="text-slate-350 dark:text-gray-600">/</span> <span className="text-red-500 dark:text-red-400">{row.broken}</span>
                      </td>
                      <td className="py-3 text-center font-black text-red-600 dark:text-red-400">{row.rate}%</td>
                      <td className={`py-3 text-right font-black ${row.pnlWhenBroken < 0 ? "text-red-600 dark:text-red-400" : row.pnlWhenBroken > 0 ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-gray-550"}`}>
                        {row.pnlWhenBroken > 0 ? "+" : ""}${row.pnlWhenBroken.toFixed(2)}
                      </td>
                      <td className="py-3 text-center pl-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] border ${row.verdict.color}`}>
                          {row.verdict.label}
                        </span>
                      </td>
                    </tr>) : <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-gray-600 italic">No historical rules checklist checks recorded. Execute checks in Pre-Trade!</td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </div>

        {
    /* SECTION C: Rules Compliance Chart (cols 4/12) */
  }
        <div className="lg:col-span-4 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-150 dark:border-violet-500/15 pb-3 mb-4">
              <Sliders className="w-4 h-4 text-red-500 dark:text-red-400" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wide">Historical Leaks Trail</h3>
                <p className="text-[10px] text-slate-450 dark:text-gray-400">Trend of broken rates % over the last 4 weeks.</p>
              </div>
            </div>

            <div className="h-[180px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rulesRedGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#be123c" stopOpacity={0.4} />
                    </linearGradient>
                    <filter id="rulesBarGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-100 dark:stroke-violet-500/10" />
                  <XAxis dataKey="name" stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-slate-405 dark:text-gray-500" fontSize={10} domain={[0, 100]} tickLine={false} />
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
                  <Bar dataKey="Broken Rate (%)" fill="url(#rulesRedGlow)" filter="url(#rulesBarGlow)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#151225]/45 p-3 rounded-xl border border-slate-150 dark:border-violet-500/15 text-[10px] text-slate-500 dark:text-gray-400 font-mono mt-4 leading-relaxed font-bold">
            💡 <strong className="text-slate-750 dark:text-gray-300">Policy advice:</strong> A lower bars height demonstrates increasing compliance to rules across your trading sessions.
          </div>
        </div>

      </div>

    </div>;
}
