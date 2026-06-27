import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import { MARKETS, SESSIONS, SETUP_TYPES, CONFLUENCES, MISTAKES, OUTCOMES } from "./utils/constants";
import { calculateStreak } from "./utils/streak";
const defaultWeights = {
  "HTF OB": 2,
  "FVG": 2,
  "Premium / Discount": 1,
  "Liquidity Above": 1,
  "Liquidity Below": 1,
  "Market Structure Shift": 2,
  "VWAP": 1,
  "PDH / PDL": 1,
  "Weekly High / Low": 2,
  "Daily Bias Aligned": 2,
  "HTF RB": 2,
  "HTF BB": 2
};
function getConfluenceScore(selectedConfluences, confluencesList) {
  let weights = { ...defaultWeights };
  const savedWeights = localStorage.getItem("confluence_weights");
  if (savedWeights) {
    try {
      weights = { ...weights, ...JSON.parse(savedWeights) };
    } catch (e) {
    }
  }
  confluencesList.forEach((c) => {
    if (weights[c] === void 0) {
      weights[c] = 1;
    }
  });
  let score = 0;
  selectedConfluences.forEach((c) => {
    score += weights[c] !== void 0 ? weights[c] : 1;
  });
  let maxScore = 0;
  confluencesList.forEach((c) => {
    maxScore += weights[c] !== void 0 ? weights[c] : 1;
  });
  return { score, maxScore };
}
export default function AddTradeForm({ trades = [], editingTrade, onSave, onCancel, showToast }) {
  const isEdit = !!editingTrade;
  const [pair, setPair] = useState("");
  const [date, setDate] = useState(() => {
    return (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
  });
  const [market, setMarket] = useState("Crypto");
  const [direction, setDirection] = useState("Long");
  const [session, setSession] = useState("");
  const [setupType, setSetupType] = useState("");
  const [selectedConfluences, setSelectedConfluences] = useState([]);
  const [selectedMistakes, setSelectedMistakes] = useState([]);
  const [pnl, setPnl] = useState("0");
  const [fee, setFee] = useState("0");
  const [netPnl, setNetPnl] = useState(0);
  const [netDaily, setNetDaily] = useState("0");
  const [outcome, setOutcome] = useState("Breakeven");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeQuality, setTradeQuality] = useState("A");
  const [plannedRR, setPlannedRR] = useState("0");
  const [actualRR, setActualRR] = useState("0");
  const [confluencesList, setConfluencesList] = useState(() => {
    const saved = localStorage.getItem("custom_confluences");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
      }
    }
    return CONFLUENCES;
  });
  const [mistakesList, setMistakesList] = useState(() => {
    const saved = localStorage.getItem("custom_mistakes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
      }
    }
    return MISTAKES;
  });
  const [tradeQualitiesList, setTradeQualitiesList] = useState(() => {
    const saved = localStorage.getItem("custom_trade_qualities");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
      }
    }
    return ["A+", "A", "B", "C"];
  });
  useEffect(() => {
    localStorage.setItem("custom_confluences", JSON.stringify(confluencesList));
  }, [confluencesList]);
  useEffect(() => {
    localStorage.setItem("custom_mistakes", JSON.stringify(mistakesList));
  }, [mistakesList]);
  useEffect(() => {
    localStorage.setItem("custom_trade_qualities", JSON.stringify(tradeQualitiesList));
  }, [tradeQualitiesList]);
  const [newConfluenceText, setNewConfluenceText] = useState("");
  const [newConfluenceWeight, setNewConfluenceWeight] = useState("1");
  const [newMistakeText, setNewMistakeText] = useState("");
  const [newTradeQualityPreset, setNewTradeQualityPreset] = useState("");
  const addCustomConfluence = () => {
    const text = newConfluenceText.trim();
    if (!text) {
      showToast("Please type a confluence", "error");
      return;
    }
    if (confluencesList.some((c) => c.toLowerCase() === text.toLowerCase())) {
      showToast("This confluence already exists.", "error");
      return;
    }
    const updated = [...confluencesList, text];
    setConfluencesList(updated);
    setSelectedConfluences([...selectedConfluences, text]);
    const weightVal = parseFloat(newConfluenceWeight) || 1;
    let weights = { ...defaultWeights };
    const savedWeights = localStorage.getItem("confluence_weights");
    if (savedWeights) {
      try {
        weights = { ...weights, ...JSON.parse(savedWeights) };
      } catch (e) {
      }
    }
    weights[text] = weightVal;
    localStorage.setItem("confluence_weights", JSON.stringify(weights));
    setNewConfluenceText("");
    setNewConfluenceWeight("1");
    showToast(`Confluence "${text}" with weight ${weightVal} added and loaded!`, "success");
  };
  const deleteCustomConfluence = (item) => {
    const updated = confluencesList.filter((c) => c !== item);
    setConfluencesList(updated);
    setSelectedConfluences(selectedConfluences.filter((c) => c !== item));
    showToast(`Deleted custom confluence: ${item}`, "success");
  };
  const addCustomMistake = () => {
    const text = newMistakeText.trim();
    if (!text) {
      showToast("Please type a mistake", "error");
      return;
    }
    if (mistakesList.some((m) => m.toLowerCase() === text.toLowerCase())) {
      showToast("This mistake already exists.", "error");
      return;
    }
    const updated = [...mistakesList, text];
    setMistakesList(updated);
    setSelectedMistakes([...selectedMistakes, text]);
    setNewMistakeText("");
    showToast(`Mistake / Behavior "${text}" added and verified!`, "success");
  };
  const deleteCustomMistake = (item) => {
    const updated = mistakesList.filter((m) => m !== item);
    setMistakesList(updated);
    setSelectedMistakes(selectedMistakes.filter((m) => m !== item));
    showToast(`Deleted custom behavior: ${item}`, "success");
  };
  const addCustomTradeQualityPreset = () => {
    const text = newTradeQualityPreset.trim();
    if (!text) {
      showToast("Please type a quality grade preset", "error");
      return;
    }
    if (tradeQualitiesList.some((q) => q.toLowerCase() === text.toLowerCase())) {
      showToast("This preset already exists.", "error");
      return;
    }
    const updated = [...tradeQualitiesList, text];
    setTradeQualitiesList(updated);
    setTradeQuality(text);
    setNewTradeQualityPreset("");
    showToast(`Preset "${text}" added!`, "success");
  };
  const deleteCustomTradeQualityPreset = (item) => {
    const updated = tradeQualitiesList.filter((q) => q !== item);
    setTradeQualitiesList(updated);
    if (tradeQuality === item) {
      setTradeQuality("A");
    }
    showToast(`Deleted trade quality preset: ${item}`, "success");
  };
  const [initialRisk, setInitialRisk] = useState("100");
  const [isStreakBannerDismissed, setIsStreakBannerDismissed] = useState(() => {
    const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
    return localStorage.getItem("dismissed_loss_streak_date") === today;
  });
  const [activeRules, setActiveRules] = useState([]);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [ruleChecksMap, setRuleChecksMap] = useState({});
  const [pendingPayload, setPendingPayload] = useState(null);
  useEffect(() => {
    const fetchActiveRules = async () => {
      try {
        const res = await authFetch("/api/trading_rules");
        if (res.ok) {
          const allRules = await res.json();
          const filtered = allRules.filter((r) => r.is_active);
          setActiveRules(filtered);
          const initialMap = {};
          filtered.forEach((r) => {
            initialMap[r.id] = true;
          });
          setRuleChecksMap(initialMap);
        }
      } catch (err) {
      }
    };
    fetchActiveRules();
  }, []);
  const streakInfo = calculateStreak(trades);
  const showStreakWarning = streakInfo.consecutiveLosses >= 3 && !isStreakBannerDismissed;
  const handleDismissStreak = () => {
    const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
    localStorage.setItem("dismissed_loss_streak_date", today);
    setIsStreakBannerDismissed(true);
  };
  useEffect(() => {
    if (editingTrade) {
      setPair(editingTrade.pair_instrument);
      setDate(editingTrade.date);
      setMarket(editingTrade.market);
      setDirection(editingTrade.direction);
      setSession(editingTrade.session);
      setSetupType(editingTrade.setup_type);
      if (editingTrade.confluences) {
        const missingConfluences = editingTrade.confluences.filter((c) => !confluencesList.includes(c));
        if (missingConfluences.length > 0) {
          setConfluencesList((prev) => [...prev, ...missingConfluences]);
        }
      }
      setSelectedConfluences(editingTrade.confluences || []);
      if (editingTrade.mistakes) {
        const missingMistakes = editingTrade.mistakes.filter((m) => !mistakesList.includes(m));
        if (missingMistakes.length > 0) {
          setMistakesList((prev) => [...prev, ...missingMistakes]);
        }
      }
      setSelectedMistakes(editingTrade.mistakes || []);
      setPnl(editingTrade.pnl_usd.toString());
      setFee(editingTrade.fee_usd.toString());
      setNetDaily(editingTrade.net_daily_amount_usd.toString());
      setOutcome(editingTrade.outcome || "Breakeven");
      setScreenshotUrl(editingTrade.screenshot_url || "");
      setNotes(editingTrade.notes || "");
      setTradeQuality(editingTrade.trade_quality || "A");
      setPlannedRR((editingTrade.planned_rr || 0).toString());
      setActualRR((editingTrade.actual_rr || 0).toString());
    } else {
      setPair("");
      setDate((/* @__PURE__ */ new Date()).toISOString().substring(0, 10));
      setMarket("Crypto");
      setDirection("Long");
      setSession("");
      setSetupType("");
      setSelectedConfluences([]);
      setSelectedMistakes([]);
      setPnl("0");
      setFee("0");
      setNetDaily("0");
      setOutcome("Breakeven");
      setScreenshotUrl("");
      setNotes("");
      setTradeQuality("A");
      setPlannedRR("0");
      setActualRR("0");
    }
  }, [editingTrade]);
  useEffect(() => {
    const pVal = parseFloat(pnl) || 0;
    const fVal = parseFloat(fee) || 0;
    setNetPnl(parseFloat((pVal + fVal).toFixed(2)));
  }, [pnl, fee]);
  useEffect(() => {
    const rVal = parseFloat(initialRisk) || 0;
    const fVal = parseFloat(fee) || 0;
    const absNetPnl = Math.abs(netPnl);
    const divisor = Math.abs(fVal + rVal);
    if (divisor > 0 && absNetPnl > 0) {
      const calc = absNetPnl / divisor;
      setActualRR(calc.toFixed(2));
    } else {
      setActualRR("0");
    }
  }, [netPnl, fee, initialRisk]);
  const toggleConfluence = (item) => {
    if (selectedConfluences.includes(item)) {
      setSelectedConfluences(selectedConfluences.filter((c) => c !== item));
    } else {
      setSelectedConfluences([...selectedConfluences, item]);
    }
  };
  const toggleMistake = (item) => {
    if (selectedMistakes.includes(item)) {
      setSelectedMistakes(selectedMistakes.filter((m) => m !== item));
    } else {
      setSelectedMistakes([...selectedMistakes, item]);
    }
  };
  const commitSave = async (payload, checkList) => {
    setIsSubmitting(true);
    try {
      const saved = await onSave(payload);
      if (saved && saved.id && checkList.length > 0) {
        await authFetch("/api/rule_checks/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trade_id: saved.id,
            date: payload.date,
            checks: checkList
          })
        });
      }
      if (!isEdit) {
        setPair("");
        setSession("");
        setSetupType("");
        setSelectedConfluences([]);
        setSelectedMistakes([]);
        setPnl("0");
        setFee("0");
        setNetDaily("0");
        setOutcome("Breakeven");
        setScreenshotUrl("");
        setNotes("");
        setTradeQuality("A");
        setPlannedRR("0");
        setActualRR("0");
      }
    } catch (err) {
      showToast(err.message || "Failed to save trade.", "error");
    } finally {
      setIsSubmitting(false);
      setIsChecklistOpen(false);
      setPendingPayload(null);
    }
  };
  const handleConfirmChecklist = () => {
    const list = activeRules.map((r) => ({
      rule_id: r.id,
      was_followed: ruleChecksMap[r.id] ? 1 : 0
    }));
    const followedCount = list.filter((item) => item.was_followed === 1).length;
    const brokenCount = list.filter((item) => item.was_followed === 0).length;
    const payloadWithCounts = {
      ...pendingPayload,
      rules_followed_count: followedCount,
      rules_broken_count: brokenCount
    };
    commitSave(payloadWithCounts, list);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pair.trim()) {
      showToast("Pair/Instrument is required.", "error");
      return;
    }
    const payload = {
      id: editingTrade?.id,
      pair_instrument: pair.trim().toUpperCase(),
      date,
      market,
      direction,
      session,
      setup_type: setupType,
      confluences: selectedConfluences,
      mistakes: selectedMistakes,
      pnl_usd: parseFloat(pnl) || 0,
      fee_usd: parseFloat(fee) || 0,
      net_pnl_usd: netPnl,
      net_daily_amount_usd: parseFloat(netDaily) || 0,
      outcome,
      screenshot_url: screenshotUrl.trim(),
      notes: notes.trim(),
      trade_quality: tradeQuality,
      planned_rr: parseFloat(plannedRR) || 0,
      actual_rr: parseFloat(actualRR) || 0
    };
    if (activeRules.length > 0) {
      setPendingPayload(payload);
      setIsChecklistOpen(true);
      return;
    }
    await commitSave(payload, []);
  };
  const outcomeColors = {
    Win: {
      active: "bg-green-600 text-white border-green-500 shadow-lg shadow-green-600/20",
      inactive: "bg-slate-50 dark:bg-[#151225]/45 text-[#475569] dark:text-gray-400 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10"
    },
    Loss: {
      active: "bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20",
      inactive: "bg-slate-50 dark:bg-[#151225]/45 text-[#475569] dark:text-gray-400 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10"
    },
    Breakeven: {
      active: "bg-slate-600 dark:bg-neutral-600 text-white border-slate-500 dark:border-neutral-500 shadow-lg shadow-slate-600/20 dark:shadow-neutral-600/20",
      inactive: "bg-slate-50 dark:bg-[#151225]/45 text-[#475569] dark:text-gray-400 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10"
    },
    Running: {
      active: "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20",
      inactive: "bg-slate-50 dark:bg-[#151225]/45 text-[#475569] dark:text-gray-400 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10"
    }
  };
  return <div className="max-w-4xl mx-auto py-4 px-2">
      {
    /* 5. Alert banner on consecutive losses */
  }
      {showStreakWarning && <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl p-4 flex items-center justify-between shadow-md">
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

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-violet-500/15">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] dark:text-white">
            {isEdit ? "\u270F\uFE0F Edit Trading Log" : "\u2795 Log New Trade"}
          </h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            {isEdit ? "Modify recorded transaction properties" : "Record a trade to analyze statistics and improve metrics"}
          </p>
        </div>
        {onCancel && <button
    onClick={onCancel}
    type="button"
    className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 text-slate-700 hover:text-black dark:text-gray-300 border border-slate-200 dark:border-violet-500/15 dark:hover:text-white rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"
  >
            Cancel
          </button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#0e0b18]/65 border border-[#e2e8f0] dark:border-violet-500/15 rounded-2xl p-6 shadow-xl space-y-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {
    /* Pair */
  }
            <div>
              <label htmlFor="pair" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Pair / Instrument <span className="text-red-500">*</span>
              </label>
              <input
    id="pair"
    type="text"
    required
    value={pair}
    onChange={(e) => setPair(e.target.value.toUpperCase())}
    placeholder="BTCUSD"
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white font-mono placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-all"
  />
            </div>

            {
    /* Date */
  }
            <div>
              <label htmlFor="date" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
    id="date"
    type="date"
    required
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white outline-none transition-all"
  />
            </div>

            {
    /* Segmented control Market */
  }
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Market
              </label>
              <div className="grid grid-cols-2 bg-slate-100 dark:bg-[#151225]/45 border border-slate-250 dark:border-violet-500/15 p-1 rounded-lg">
                {MARKETS.map((m) => <button
    key={m}
    type="button"
    onClick={() => setMarket(m)}
    className={`py-1.5 rounded-md text-xs font-semibold transition-all ${market === m ? "bg-white dark:bg-violet-500/20 text-[#0f172a] dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-gray-500 dark:hover:text-gray-300"}`}
  >
                    {m}
                  </button>)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {
    /* Direction */
  }
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Direction <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
    type="button"
    onClick={() => setDirection("Long")}
    className={`py-2 px-4 rounded-lg font-bold text-sm border transition-all ${direction === "Long" ? "bg-green-50 dark:bg-green-600/10 text-green-600 dark:text-green-400 border-green-550 shadow-md shadow-green-500/5" : "bg-slate-50 dark:bg-[#151225]/45 text-slate-500 dark:text-gray-500 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10 hover:text-slate-700 dark:hover:text-gray-400"}`}
  >
                  Buy / Long
                </button>
                <button
    type="button"
    onClick={() => setDirection("Short")}
    className={`py-2 px-4 rounded-lg font-bold text-sm border transition-all ${direction === "Short" ? "bg-red-50 dark:bg-red-600/10 text-red-600 dark:text-red-400 border-red-500 shadow-md shadow-red-500/5" : "bg-slate-50 dark:bg-[#151225]/45 text-slate-500 dark:text-gray-500 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10 hover:text-slate-700 dark:hover:text-gray-400"}`}
  >
                  Sell / Short
                </button>
              </div>
            </div>

            {
    /* Session */
  }
            <div>
              <label htmlFor="session" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Session
              </label>
              <select
    id="session"
    value={session}
    onChange={(e) => setSession(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white outline-none transition-all cursor-pointer"
  >
                <option value="">Select Session...</option>
                {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {
    /* Setup Type */
  }
            <div>
              <label htmlFor="setupType" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Setup Type
              </label>
              <select
    id="setupType"
    value={setupType}
    onChange={(e) => setSetupType(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white outline-none transition-all cursor-pointer"
  >
                <option value="">Select Setup...</option>
                {SETUP_TYPES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>

          {
    /* Confluences Multi-Grid */
  }
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Confluences (Select all that apply)
              </label>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {confluencesList.map((c) => {
    const isSelected = selectedConfluences.includes(c);
    return <span key={c} className="inline-flex items-center gap-1">
                    <button
      type="button"
      onClick={() => toggleConfluence(c)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected ? "bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400 border-green-500 shadow-sm" : "bg-slate-50 dark:bg-[#151225]/45 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10"}`}
    >
                      {c}
                    </button>
                    {!CONFLUENCES.includes(c) && <button
      type="button"
      onClick={() => deleteCustomConfluence(c)}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-1 rounded-md text-xs font-bold transition cursor-pointer"
      title="Delete custom confluence"
    >
                        ✕
                      </button>}
                  </span>;
  })}
            </div>

            {
    /* Inline custom confluence add */
  }
            <div className="mt-3.5 flex flex-wrap items-center gap-2 bg-slate-50/20 dark:bg-[#151225]/45 p-3 rounded-xl border border-slate-200/40 dark:border-violet-500/15">
              <div className="text-xs font-bold font-mono text-slate-500 dark:text-gray-400 shrink-0">➕ Add Custom:</div>
              <input
    type="text"
    placeholder="e.g. 200 EMA Retest"
    value={newConfluenceText}
    onChange={(e) => setNewConfluenceText(e.target.value)}
    className="flex-1 min-w-[150px] px-3 py-1.5 bg-white dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-xs text-[#0f172a] dark:text-white outline-none focus:border-violet-500 placeholder-slate-450 dark:placeholder-gray-550"
  />
              <select
    value={newConfluenceWeight}
    onChange={(e) => setNewConfluenceWeight(e.target.value)}
    className="px-2 py-1.5 bg-white dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-xs text-[#0f172a] dark:text-white outline-none focus:border-violet-500 cursor-pointer font-sans"
  >
                <option value="1">Weight 1 (Minor)</option>
                <option value="2">Weight 2 (Normal)</option>
                <option value="3">Weight 3 (Major)</option>
              </select>
              <button
    type="button"
    onClick={addCustomConfluence}
    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer"
  >
                Add Confluence
              </button>
            </div>

            {
    /* Live Confluence Score indicators */
  }
            <div className="mt-3 bg-slate-50/20 dark:bg-[#151225]/45 p-3 rounded-xl border border-slate-200/40 dark:border-violet-500/15">
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-slate-500 dark:text-gray-400 font-bold font-mono">Confluence Score</span>
                <span className={`font-black font-mono ${getConfluenceScore(selectedConfluences, confluencesList).score < 4 ? "text-red-600 dark:text-red-400" : getConfluenceScore(selectedConfluences, confluencesList).score < 8 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                  {getConfluenceScore(selectedConfluences, confluencesList).score} / {getConfluenceScore(selectedConfluences, confluencesList).maxScore}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#111] h-1.5 rounded-full overflow-hidden">
                <div
    className={`h-full transition-all duration-300 ${getConfluenceScore(selectedConfluences, confluencesList).score < 4 ? "bg-red-500" : getConfluenceScore(selectedConfluences, confluencesList).score < 8 ? "bg-yellow-500" : "bg-green-500"}`}
    style={{
      width: `${Math.min(100, getConfluenceScore(selectedConfluences, confluencesList).score / (getConfluenceScore(selectedConfluences, confluencesList).maxScore || 1) * 100)}%`
    }}
  />
              </div>
            </div>
          </div>

          {
    /* Mistakes Multi-Grid */
  }
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Mistakes / Trading Behaviors
              </label>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {mistakesList.map((m) => {
    const isSelected = selectedMistakes.includes(m);
    return <span key={m} className="inline-flex items-center gap-1">
                    <button
      type="button"
      onClick={() => toggleMistake(m)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-500 shadow-sm" : "bg-slate-50 dark:bg-[#151225]/45 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10"}`}
    >
                      {m}
                    </button>
                    {!MISTAKES.includes(m) && <button
      type="button"
      onClick={() => deleteCustomMistake(m)}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-1 rounded-md text-xs font-bold transition cursor-pointer"
      title="Delete custom behavior"
    >
                        ✕
                      </button>}
                  </span>;
  })}
            </div>

            {
    /* Inline custom mistake add */
  }
            <div className="mt-3.5 flex flex-wrap items-center gap-2 bg-slate-50/20 dark:bg-[#151225]/45 p-3 rounded-xl border border-slate-200/40 dark:border-violet-500/15">
              <div className="text-xs font-bold font-mono text-slate-500 dark:text-gray-400 shrink-0">➕ Add Custom:</div>
              <input
    type="text"
    placeholder="e.g. Revenge Traded"
    value={newMistakeText}
    onChange={(e) => setNewMistakeText(e.target.value)}
    className="flex-1 min-w-[200px] px-3 py-1.5 bg-white dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-xs text-[#0f172a] dark:text-white outline-none focus:border-violet-500 placeholder-slate-450 dark:placeholder-gray-550"
  />
              <button
    type="button"
    onClick={addCustomMistake}
    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer"
  >
                Add Behavior
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
            {
    /* PnL USD */
  }
            <div>
              <label htmlFor="pnl" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Gross PnL (USD)
              </label>
              <input
    id="pnl"
    type="number"
    step="any"
    value={pnl}
    onChange={(e) => setPnl(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white font-mono outline-none transition-all"
  />
            </div>

            {
    /* Fee USD */
  }
            <div>
              <label htmlFor="fee" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Fees (USD, default negative)
              </label>
              <input
    id="fee"
    type="number"
    step="any"
    value={fee}
    onChange={(e) => setFee(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white font-mono outline-none transition-all"
  />
            </div>

            {
    /* Net PnL (Read-Only) */
  }
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Net PnL (Auto-calculated)
              </label>
              <div
    id="netPnlDisplay"
    className={`w-full px-4 py-2.5 bg-slate-100 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg font-mono font-black text-sm ${netPnl > 0 ? "text-green-600 dark:text-green-500" : netPnl < 0 ? "text-red-600 dark:text-red-500" : "text-slate-500 dark:text-gray-400"}`}
  >
                {netPnl >= 0 ? `+${netPnl.toFixed(2)}` : netPnl.toFixed(2)} USD
              </div>
            </div>

            {
    /* Net Daily Amount */
  }
            <div>
              <label htmlFor="netDaily" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Net Daily Amount (USD)
              </label>
              <input
    id="netDaily"
    type="number"
    step="any"
    value={netDaily}
    onChange={(e) => setNetDaily(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white font-mono outline-none transition-all"
  />
            </div>
          </div>

          {
    /* Outcome segments layout */
  }
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
              Trade Outcome
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {OUTCOMES.map((o) => {
    const isActive = outcome === o;
    const colors = outcomeColors[o];
    return <button
      key={o}
      type="button"
      onClick={() => setOutcome(o)}
      className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all text-center uppercase tracking-wide cursor-pointer ${isActive ? colors.active : colors.inactive}`}
    >
                    {o}
                  </button>;
  })}
            </div>
          </div>

          {
    /* SECTION 2 - NEW COLUMNS IN FORM */
  }
          <div className="border-t border-slate-100 dark:border-violet-500/15 pt-6 space-y-6">
            <h3 className="text-sm font-bold tracking-wider font-mono text-slate-500 dark:text-gray-400 uppercase">
              Advanced Metrics & Trade Quality Custom Fields
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {
    /* 1. Trade Quality */
  }
              <div className="space-y-2">
                <label htmlFor="tradeQualityInput" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Trade Quality (Manually Write & Define)
                </label>
                
                {
    /* Manual text input for trade quality grade */
  }
                <input
    id="tradeQualityInput"
    type="text"
    placeholder="Type quality, e.g. A+ -, A-, D..."
    value={tradeQuality}
    onChange={(e) => setTradeQuality(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white font-mono outline-none transition-all text-sm font-bold"
  />

                {
    /* Grid of presets clickable buttons */
  }
                <div className="text-xs font-bold font-mono text-slate-440 dark:text-gray-500 mt-1">Tap Preset:</div>
                <div className="flex flex-wrap gap-2.5">
                  {tradeQualitiesList.map((preset) => {
    const isActive = tradeQuality.trim() === preset.trim();
    const colorMapping = {
      "A+": "bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/10",
      "A": "bg-green-600 text-white border-green-500 shadow-sm shadow-green-600/10",
      "B": "bg-yellow-500 text-slate-900 border-yellow-400 shadow-sm shadow-yellow-500/10",
      "C": "bg-red-600 text-white border-red-500 shadow-sm shadow-red-600/10"
    };
    const defaultActiveCol = "bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/10";
    const activeColor = colorMapping[preset] || defaultActiveCol;
    const finalColor = isActive ? `${activeColor}` : "bg-slate-50 dark:bg-[#151225]/45 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10 hover:text-[#0f172a] dark:text-white";
    const isPresetDefault = ["A+", "A", "B", "C"].includes(preset);
    return <span key={preset} className="inline-flex items-center gap-1">
                        <button
      type="button"
      onClick={() => setTradeQuality(preset)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${finalColor}`}
    >
                          {preset}
                        </button>
                        {!isPresetDefault && <button
      type="button"
      onClick={() => deleteCustomTradeQualityPreset(preset)}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-1 rounded-md text-xs font-bold transition cursor-pointer font-mono"
      title="Delete custom preset"
    >
                            ✕
                          </button>}
                      </span>;
  })}
                </div>

                {
    /* Inline custom preset add */
  }
                <div className="mt-2.5 flex items-center gap-2 bg-slate-50/20 dark:bg-[#151225]/45 p-2.5 rounded-xl border border-slate-200/40 dark:border-violet-500/15">
                  <div className="text-[10px] font-bold font-mono text-slate-500 dark:text-gray-400 shrink-0">➕ Define Presets:</div>
                  <input
    type="text"
    placeholder="e.g. A-"
    value={newTradeQualityPreset}
    onChange={(e) => setNewTradeQualityPreset(e.target.value)}
    className="flex-1 px-3 py-1 bg-white dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-xs text-[#0f172a] dark:text-white outline-none focus:border-violet-500 placeholder-slate-450 dark:placeholder-gray-550"
  />
                  <button
    type="button"
    onClick={addCustomTradeQualityPreset}
    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer"
  >
                    Save Preset
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-gray-500 font-mono leading-relaxed mt-1">
                  💡 You can manually write any trade quality score or configure fast-click buttons above.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-2">
            {
    /* Screenshot URL */
  }
            <div>
              <label htmlFor="screenshot" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Screenshot URL
              </label>
              <div className="flex gap-3">
                <input
    id="screenshot"
    type="url"
    placeholder="https://tradingview.com/x/..."
    value={screenshotUrl}
    onChange={(e) => setScreenshotUrl(e.target.value)}
    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white font-mono placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-all text-sm"
  />
                <button
    type="button"
    id="openScreenshotBtn"
    onClick={() => {
      if (screenshotUrl) {
        window.open(screenshotUrl, "_blank", "noreferrer,noopener");
      } else {
        showToast("Please enter a screenshot URL first.", "error");
      }
    }}
    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 text-slate-750 hover:text-[#0f172a] dark:text-white border border-slate-200 dark:border-violet-500/15 rounded-lg text-sm transition-all outline-none cursor-pointer"
  >
                  Open
                </button>
              </div>
            </div>

            {
    /* Notes */
  }
            <div>
              <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                Trading Notes & Reflections
              </label>
              <textarea
    id="notes"
    rows={4}
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Log confluences detail, emotions experienced, mistakes made, or why you closed the trade early..."
    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 rounded-lg text-[#0f172a] dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-all text-sm resize-y"
  />
            </div>
          </div>
        </div>

        {
    /* Submit Actions */
  }
        <div className="flex justify-end gap-4">
          {onCancel && <button
    onClick={onCancel}
    type="button"
    className="px-6 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 dark:hover:bg-violet-500/10 text-slate-700 hover:text-black dark:text-gray-300 dark:hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
  >
              Cancel
            </button>}
          <button
    id="submitTradeBtn"
    type="submit"
    disabled={isSubmitting}
    className="btn-neon btn-neon-lg disabled:opacity-50 cursor-pointer"
  >
            {isSubmitting ? "Saving Trades..." : isEdit ? "\u{1F4BE} Save Changes" : "\u{1F680} Log Trade"}
          </button>
        </div>
      </form>

      {
    /* Rules compliance checklist modal */
  }
      {isChecklistOpen && <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e0b18]/90 border border-[#e2e8f0] dark:border-violet-500/15 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-6 animate-scale-in backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white flex items-center gap-2">
                🛡️ Operating Rules Checklist
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">Validate compliance criteria defined by your strategy before confirming this trade.</p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {activeRules.map((r) => {
    const answer = ruleChecksMap[r.id] ?? true;
    return <div key={r.id} className="p-3 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-xl flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-800 dark:text-gray-200 font-sans leading-relaxed">{r.rule_text}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <button
      type="button"
      onClick={() => setRuleChecksMap((prev) => ({ ...prev, [r.id]: true }))}
      className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-normal transition-all border cursor-pointer ${answer ? "bg-green-50 text-green-700 border-green-500/40 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/35 font-bold" : "text-slate-400 dark:text-gray-500 border-slate-200 dark:border-violet-500/15 opacity-50"}`}
    >
                        Followed
                      </button>
                      <button
      type="button"
      onClick={() => setRuleChecksMap((prev) => ({ ...prev, [r.id]: false }))}
      className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-normal transition-all border cursor-pointer ${!answer ? "bg-red-50 text-red-700 border-red-500/40 dark:bg-red-500/10 dark:text-red-100 dark:border-red-500/35 font-bold" : "text-slate-400 dark:text-gray-500 border-slate-200 dark:border-violet-500/15 opacity-50"}`}
    >
                        Broken
                      </button>
                    </div>
                  </div>;
  })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-violet-500/15">
              <button
    type="button"
    onClick={() => {
      setIsChecklistOpen(false);
      setPendingPayload(null);
    }}
    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 border border-slate-200 dark:border-violet-500/15 rounded-xl text-xs text-slate-700 dark:text-gray-300 font-semibold cursor-pointer"
  >
                Go Back
              </button>
              <button
    type="button"
    onClick={handleConfirmChecklist}
    className="btn-neon btn-neon-sm cursor-pointer"
  >
                Confirm State & Save Trade
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
