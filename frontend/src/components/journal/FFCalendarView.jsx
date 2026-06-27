import { authFetch } from './utils/authFetch';
import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  X
} from "lucide-react";
const currenciesList = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF"];
const impactsList = ["High", "Medium", "Low"];
export default function FFCalendarView({ trades, showToast }) {
  const [dbEvents, setDbEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manDate, setManDate] = useState(() => (/* @__PURE__ */ new Date()).toISOString().substring(0, 10));
  const [manTime, setManTime] = useState("08:30");
  const [manEvent, setManEvent] = useState("");
  const [manCurrency, setManCurrency] = useState("USD");
  const [manImpact, setManImpact] = useState("High");
  const [manForecast, setManForecast] = useState("");
  const [manPrevious, setManPrevious] = useState("");
  const [selectedCurrencies, setSelectedCurrencies] = useState(["USD", "EUR"]);
  const [selectedImpacts, setSelectedImpacts] = useState(["High"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticker, setTicker] = useState(0);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1e4);
    return () => clearInterval(interval);
  }, []);
  const fetchDbEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/market_events");
      if (res.ok) {
        const data = await res.json();
        const normalised = data.map((d) => ({
          id: d.id,
          date: d.date,
          time: d.time || "",
          title: d.title || "Unknown Event",
          category: d.category || d.country || "USD",
          impact: d.impact || "High",
          actual: d.actual || "",
          forecast: d.forecast || "",
          previous: d.previous || "",
          notes: d.notes || ""
        }));
        setDbEvents(normalised);
      }
    } catch (err) {
      console.error("Error fetching calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDbEvents();
  }, [fetchDbEvents]);
  const handleClearAllEvents = async () => {
    try {
      const res = await authFetch("/api/market_events", { method: "DELETE" });
      if (res.ok) {
        showToast("\u{1F5D1}\uFE0F All calendar events cleared successfully!", "success");
        setSelectedFile(null);
        setDbEvents([]);
        setIsConfirmClearOpen(false);
        fetchDbEvents();
      } else {
        showToast("Failed to clear events.", "error");
      }
    } catch (err) {
      showToast(err.message || "Error clearing events database.", "error");
    }
  };
  const handleDeleteIndividualEvent = async (id) => {
    try {
      const res = await authFetch(`/api/market_events/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("\u2705 Event deleted successfully", "success");
        setEventToDelete(null);
        fetchDbEvents();
      } else {
        showToast("Failed to delete event.", "error");
      }
    } catch (err) {
      showToast(err.message || "Error occurred.", "error");
    }
  };
  const handleAddManualEvent = async (e) => {
    e.preventDefault();
    if (!manDate || !manEvent) {
      showToast("Date and Event Name are required.", "error");
      return;
    }
    let formatTime = manTime;
    try {
      const parts = manTime.split(":");
      if (parts.length === 2) {
        let hrs = parseInt(parts[0], 10);
        const mins = parts[1];
        const ampm = hrs >= 12 ? "pm" : "am";
        hrs = hrs % 12;
        if (hrs === 0) hrs = 12;
        formatTime = `${hrs}:${mins}${ampm}`;
      }
    } catch {
    }
    try {
      const res = await authFetch("/api/market_events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: manDate,
          time: formatTime,
          title: manEvent,
          category: manCurrency,
          impact: manImpact,
          forecast: manForecast,
          previous: manPrevious,
          actual: "",
          notes: "Manually Added"
        })
      });
      if (res.status === 201) {
        showToast("\u2705 Manually added economic event successfully!", "success");
        setManEvent("");
        setManForecast("");
        setManPrevious("");
        setShowManualForm(false);
        fetchDbEvents();
      } else if (res.status === 409) {
        showToast("Skip: Event already exists.", "error");
      } else {
        showToast("Failed to save manual event.", "error");
      }
    } catch (err) {
      showToast(err.message || "Error creating manual event.", "error");
    }
  };

  const convertESTtoIST = (timeStr, dateStr) => {
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
  const getCurrencyFlag = (currency) => {
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
  const parseValueFraction = (valStr) => {
    if (!valStr) return null;
    const matches = valStr.match(/[-+]?[0-9]*\.?[0-9]+/);
    if (!matches) return null;
    let parsed = parseFloat(matches[0]);
    if (valStr.toUpperCase().includes("M")) parsed *= 1e3;
    if (valStr.toUpperCase().includes("B")) parsed *= 1e6;
    return parsed;
  };
  const getActualVsForecastColor = (actual, forecast, title) => {
    if (!actual) return "text-gray-500 font-bold italic text-[11px]";
    if (!forecast) return "text-white font-bold font-mono text-xs";
    const actNum = parseValueFraction(actual);
    const forNum = parseValueFraction(forecast);
    if (actNum === null || forNum === null) return "text-white font-bold font-mono text-xs";
    if (actNum === forNum) return "text-gray-300 font-medium font-mono text-xs";
    const isHigherBetter = actNum > forNum;
    const normalizedHigherBetter = title.toLowerCase().includes("unemployment") || title.toLowerCase().includes("cpi") ? !isHigherBetter : isHigherBetter;
    return normalizedHigherBetter ? "text-green-400 font-black font-mono text-xs" : "text-red-400 font-black font-mono text-xs";
  };
  const toggleCurrency = (currency) => {
    if (currency === "ALL") {
      if (selectedCurrencies.length === currenciesList.length) {
        setSelectedCurrencies([]);
      } else {
        setSelectedCurrencies([...currenciesList]);
      }
    } else {
      setSelectedCurrencies(
        (prev) => prev.includes(currency) ? prev.filter((c) => c !== currency) : [...prev, currency]
      );
    }
  };
  const toggleImpact = (impact) => {
    if (impact === "ALL") {
      if (selectedImpacts.length === impactsList.length) {
        setSelectedImpacts([]);
      } else {
        setSelectedImpacts([...impactsList]);
      }
    } else {
      setSelectedImpacts(
        (prev) => prev.includes(impact) ? prev.filter((i) => i !== impact) : [...prev, impact]
      );
    }
  };
  const filteredEvents = dbEvents.filter((e) => {
    const meetsCurrency = selectedCurrencies.includes(e.category.toUpperCase());
    const meetsImpact = selectedImpacts.includes(e.impact);
    const meetsSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
    return meetsCurrency && meetsImpact && meetsSearch;
  });
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
  const highImpactCount = dbEvents.filter((e) => e.impact === "High").length;
  const usdEventsCount = dbEvents.filter((e) => e.category.toUpperCase() === "USD").length;
  const getEventTimestamp = (e) => {
    if (!e.time || e.time.toLowerCase().trim() === "all day") {
      return (/* @__PURE__ */ new Date(`${e.date}T00:00:00-05:00`)).getTime();
    }
    const match = e.time.match(/(\d+:\d+)\s*(am|pm)/i);
    if (match) {
      const [time, period] = match.slice(1);
      const [hours, minutes] = time.split(":").map(Number);
      let h = hours % 12 + (period.toLowerCase() === "pm" ? 12 : 0);
      return (/* @__PURE__ */ new Date(`${e.date}T${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00-05:00`)).getTime();
    }
    return (/* @__PURE__ */ new Date(`${e.date}T00:00:00-05:00`)).getTime();
  };
  const getNextHighImpactEvent = () => {
    const now = Date.now();
    const upcomingHighEvents = dbEvents.filter((e) => e.impact === "High").map((e) => ({ ...e, timestamp: getEventTimestamp(e) })).filter((e) => e.timestamp > now).sort((a, b) => a.timestamp - b.timestamp);
    if (upcomingHighEvents.length === 0) {
      return { title: "None scheduled", countdown: "" };
    }
    const nextEvent = upcomingHighEvents[0];
    const diffMs = nextEvent.timestamp - now;
    const totalMins = Math.floor(diffMs / (60 * 1e3));
    const days = Math.floor(totalMins / (24 * 60));
    const hours = Math.floor(totalMins % (24 * 60) / 60);
    const mins = totalMins % 60;
    let countdown = "in ";
    if (days > 0) countdown += `${days}d `;
    if (hours > 0 || days > 0) countdown += `${hours}h `;
    countdown += `${mins}m`;
    return {
      title: `${nextEvent.category} \u2014 ${nextEvent.title}`,
      countdown
    };
  };
  const nextHighImpact = getNextHighImpactEvent();
  const groupedEvents = {};
  filteredEvents.forEach((e) => {
    const dateKey = e.date;
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(e);
  });
  const sortedDateKeys = Object.keys(groupedEvents).sort();
  const formatDateHeader = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };
  const renderManualForm = () => <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-blue-500/35 rounded-2xl p-6 shadow-2xl space-y-4 max-w-2xl mx-auto my-4 text-left">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#2d2d2d] pb-3">
        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span>📝 Add Economic Event Manually</span>
        </h3>
        <button
    onClick={() => setShowManualForm(false)}
    className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
  >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleAddManualEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
        <div className="space-y-1">
          <label className="text-slate-500 dark:text-gray-400 font-bold block">Date *</label>
          <input
    type="date"
    required
    value={manDate}
    onChange={(e) => setManDate(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2d2d2d] rounded-xl px-3.5 py-2 text-slate-850 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
  />
        </div>

        <div className="space-y-1">
          <label className="text-slate-500 dark:text-gray-400 font-bold block">Time *</label>
          <input
    type="time"
    required
    value={manTime}
    onChange={(e) => setManTime(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2d2d2d] rounded-xl px-3.5 py-2 text-slate-850 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
  />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-slate-500 dark:text-gray-400 font-bold block">Event Name *</label>
          <input
    type="text"
    required
    placeholder="e.g. FOMC Rate Decision"
    value={manEvent}
    onChange={(e) => setManEvent(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2d2d2d] rounded-xl px-3.5 py-2 text-slate-855 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
  />
        </div>

        <div className="space-y-1">
          <label className="text-slate-500 dark:text-gray-400 font-bold block">Currency *</label>
          <select
    value={manCurrency}
    onChange={(e) => setManCurrency(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2d2d2d] rounded-xl px-3 py-2 text-slate-855 dark:text-white focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
  >
            {currenciesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-500 dark:text-gray-400 font-bold block">Impact *</label>
          <select
    value={manImpact}
    onChange={(e) => setManImpact(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2d2d2d] rounded-xl px-3 py-2 text-slate-855 dark:text-white focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
  >
            <option value="High">🔴 High Impact</option>
            <option value="Medium">🟡 Medium Impact</option>
            <option value="Low">🟢 Low Impact</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-500 dark:text-gray-400 font-bold block">Forecast (Estimate Value)</label>
          <input
    type="text"
    placeholder="e.g. 5.2%"
    value={manForecast}
    onChange={(e) => setManForecast(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2d2d2d] rounded-xl px-3.5 py-2 text-slate-855 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
  />
        </div>

        <div className="space-y-1">
          <label className="text-slate-500 dark:text-gray-400 font-bold block">Previous (Prior Value)</label>
          <input
    type="text"
    placeholder="e.g. 5.0%"
    value={manPrevious}
    onChange={(e) => setManPrevious(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-250 dark:border-[#2d2d2d] rounded-xl px-3.5 py-2 text-slate-855 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
  />
        </div>

        <div className="sm:col-span-2 pt-2 flex justify-end gap-3">
          <button
    type="button"
    onClick={() => setShowManualForm(false)}
    className="px-5 py-2.5 bg-slate-100 dark:bg-[#2a2a2a] text-slate-700 dark:text-white rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#333] transition-colors cursor-pointer"
  >
            Cancel
          </button>
          <button
    type="submit"
    className="btn-neon btn-neon-sm cursor-pointer"
  >
            Save Event
          </button>
        </div>
      </form>
    </div>;
  return <div className="space-y-6">
      
      {
    /* HEADER ROW */
  }
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 p-5 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#0f172a] dark:text-white tracking-tight flex items-center gap-2">
            📅 News Calendar (Forex)
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-sans">
            Verify macro-economic schedules safely to filter out news-based trade execution risks.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
          <button
    onClick={() => setShowManualForm(!showManualForm)}
    className="btn-neon btn-neon-ghost btn-neon-sm cursor-pointer shrink-0"
    title="Add economic event manually to database"
  >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>

          {dbEvents.length > 0 && <button
    onClick={() => setIsConfirmClearOpen(true)}
    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-500/20 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
    title="Delete all calendar events from SQLite"
  >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Events</span>
            </button>}
        </div>
      </div>

      {showManualForm && renderManualForm()}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl shadow-lg space-y-4 animate-pulse">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Fetching weekly economic calendar...</p>
        </div>
      ) : dbEvents.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-12 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-xl space-y-4">
          <AlertCircle className="w-10 h-10 text-slate-400 dark:text-gray-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-sans">No Economic Events Found</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-sans">
            We couldn't retrieve any economic events for this week. Please check your internet connection or try again.
          </p>
          <button
            onClick={fetchDbEvents}
            className="btn-neon btn-neon-sm cursor-pointer inline-flex items-center gap-1.5"
          >
            Retry Fetching
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {
      /* TOP 4 SUMMARY STATISTICS CARDS */
    }
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {
      /* Card 1: High Impact Count */
    }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-4 flex items-center justify-between shadow-md dark:shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider font-mono">High Impact Total</span>
                <div className="text-2xl font-black text-red-650 dark:text-red-500 font-mono">
                  {highImpactCount}
                </div>
                <p className="text-[10px] text-slate-450 dark:text-gray-505 font-sans leading-none">🔴 High gravity volatility schedules stored</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-650 dark:text-red-500 rounded-xl">
                <ShieldAlert className="w-5 h-5 bg-transparent" />
              </div>
            </div>

            {
      /* Card 2: USD Events Count */
    }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-4 flex items-center justify-between shadow-md dark:shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider font-mono">USD Events Total</span>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {usdEventsCount}
                </div>
                <p className="text-[10px] text-slate-450 dark:text-gray-505 font-sans leading-none">🇺🇸 Driving core interest & market index trendlines</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>

            {
      /* Card 3: Next High Impact countdown */
    }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-4 flex items-center justify-between shadow-md dark:shadow-lg col-span-1">
              <div className="space-y-1 w-full overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider font-mono">Next High Impact</span>
                <div className="text-xs font-bold text-yellow-650 dark:text-yellow-500 truncate" title={nextHighImpact.title}>
                  {nextHighImpact.title}
                </div>
                <div className="text-sm font-black text-slate-800 dark:text-white font-mono leading-tight">
                  {nextHighImpact.countdown || "None Scheduled"}
                </div>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-650 dark:text-yellow-500 rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            {
      /* Card 4: Total Events Count */
    }
            <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-4 flex items-center justify-between shadow-md dark:shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider font-mono">Total Events Imported</span>
                <div className="text-2xl font-black text-slate-700 dark:text-gray-300 font-mono">
                  {dbEvents.length}
                </div>
                <p className="text-[10px] text-slate-450 dark:text-gray-505 font-sans leading-none">Events stored inside SQLite</p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-[#2d2d2d] text-slate-700 dark:text-gray-300 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

          </div>

          {
      /* FILTER CONTROL BAR */
    }
          <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-md dark:shadow-lg space-y-4">
            
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              
              {
      /* Left search box */
    }
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <input
      type="text"
      placeholder="Search events by name e.g. CPI, Jobs..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full bg-slate-50/20 dark:bg-black/25 border border-slate-200/40 dark:border-violet-500/15 focus:border-blue-500 focus:outline-none rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500"
    />
              </div>



            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-[#222]">
              
              {
      /* Currency Selector Chips Row */
    }
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Currency Filter:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
      onClick={() => toggleCurrency("ALL")}
      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${selectedCurrencies.length === currenciesList.length ? "bg-gradient-to-r from-[#c2185b] to-[#e11d75] text-white font-black shadow-sm shadow-pink-500/20" : "bg-slate-100 dark:bg-[#121212]/50 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-[#2d2d2d]"}`}
    >
                    ALL
                  </button>
                  {currenciesList.map((curr) => {
      const active = selectedCurrencies.includes(curr);
      return <button
        key={curr}
        onClick={() => toggleCurrency(curr)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${active ? "bg-[#e11d75]/10 text-[#e11d75] dark:text-[#f43f5e] border-[#e11d75]/40" : "bg-slate-100 dark:bg-[#121212]/50 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white border-slate-200 dark:border-[#2d2d2d]"}`}
      >
                        <span>{getCurrencyFlag(curr)}</span>
                        <span>{curr}</span>
                      </button>;
     })}
                </div>
              </div>

              {
      /* Impact Selector Chips Row */
    }
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Impact Filter:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
      onClick={() => toggleImpact("ALL")}
      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${selectedImpacts.length === impactsList.length ? "bg-gradient-to-r from-[#c2185b] to-[#e11d75] text-white font-black shadow-sm shadow-pink-500/20" : "bg-slate-100 dark:bg-[#121212]/50 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-[#2d2d2d]"}`}
    >
                    ALL
                  </button>
                  {impactsList.map((imp) => {
      const active = selectedImpacts.includes(imp);
      const pillIcon = imp === "High" ? "\u{1F534}" : imp === "Medium" ? "\u{1F7E1}" : "\u{1F7E2}";
      return <button
        key={imp}
        onClick={() => toggleImpact(imp)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${active ? imp === "High" ? "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/40" : imp === "Medium" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/40" : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/40" : "bg-slate-100 dark:bg-[#121212]/50 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-[#2d2d2d]"}`}
      >
                        <span className="text-[10px]">{pillIcon}</span>
                        <span>{imp}</span>
                      </button>;
    })}
                </div>
              </div>

            </div>

          </div>

          {
      /* DYNAMIC CALENDAR STICKY GROUP TABLE */
    }
          {sortedDateKeys.length === 0 ? <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 p-12 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-400 dark:text-gray-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Matching Events Found</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Adjust your search queries or filter attributes (Currencies/Impacts) to populate events.
              </p>
            </div> : <div className="space-y-6">
              {sortedDateKeys.map((dateKey) => {
      const dayEvents = groupedEvents[dateKey];
      const isTodayStr = dateKey === todayStr;
      return <div key={dateKey} className="space-y-2">
                    
                    {
        /* Sticky Date Group Row */
      }
                    <div className={`p-4 rounded-xl border flex justify-between items-center ${isTodayStr ? "bg-blue-50/20 dark:bg-blue-600/10 border-blue-200/40 dark:border-blue-500/25 text-blue-700 dark:text-blue-300" : "bg-slate-100/20 dark:bg-[#151225]/45 border-slate-200/40 dark:border-violet-500/15 text-slate-700 dark:text-gray-300"}`}>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                        {isTodayStr && <span className="bg-blue-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded mr-1 animate-pulse">TODAY</span>}
                        <span>{formatDateHeader(dateKey)}</span>
                      </h3>
                      <span className="text-[10px] font-mono opacity-60 font-semibold">{dayEvents.length} economic events</span>
                    </div>

                    {
        /* Table of Events grouped */
      }
                    <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl overflow-hidden shadow-md dark:shadow-xl">
                      <table className="w-full text-left border-collapse text-xs font-sans">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-violet-500/15 bg-slate-50 dark:bg-[#121212]/80 text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider">
                            <th className="py-3 px-4 font-bold">IST Time</th>
                            <th className="py-3 px-4 font-bold">EST Time (FF)</th>
                            <th className="py-3 px-4 font-bold">Currency</th>
                            <th className="py-3 px-4 font-bold">Impact</th>
                            <th className="py-3 px-4 font-bold">Event</th>
                            <th className="py-3 px-4 text-right font-bold">Forecast</th>
                            <th className="py-3 px-4 text-right font-bold">Previous</th>
                            <th className="py-3 px-4 text-right font-bold">Actual</th>
                            <th className="py-3 px-4 text-center font-bold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-[#222]">
                          {dayEvents.map((e) => {
        const times = convertESTtoIST(e.time, e.date);
        const isHigh = e.impact === "High";
        return <tr
          key={e.id}
          className={`hover:bg-slate-50/80 dark:hover:bg-[#1f1f1f]/50 transition-colors text-xs text-slate-800 dark:text-white ${isHigh ? "border-l-[3px] border-l-[#ef4444]" : ""}`}
        >
                                <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-yellow-500 whitespace-nowrap">{times.ist}</td>
                                <td className="py-3 px-4 font-mono text-slate-500 dark:text-gray-400 whitespace-nowrap">{times.est}</td>
                                <td className="py-3 px-4 font-bold whitespace-nowrap">{getCurrencyFlag(e.category)} {e.category}</td>
                                <td className="py-3 px-4">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 w-max ${e.impact === "High" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/15" : e.impact === "Medium" ? "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-250 dark:border-yellow-500/15" : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-250 dark:border-green-500/15"}`}>
                                    <span>{e.impact === "High" ? "\u{1F534}" : e.impact === "Medium" ? "\u{1F7E1}" : "\u{1F7E2}"}</span>
                                    <span>{e.impact}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-semibold leading-snug">{e.title}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-gray-400">{e.forecast || "\u2014"}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-gray-400">{e.previous || "\u2014"}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold">
                                  <span className={getActualVsForecastColor(e.actual, e.forecast, e.title)}>
                                    {e.actual || "Pending"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
          onClick={() => e.id && setEventToDelete(e.id)}
          className="p-1 hover:bg-red-500/15 text-red-500 dark:text-red-400 rounded transition-colors cursor-pointer"
          title="Delete event"
        >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>;
      })}
                        </tbody>
                      </table>
                    </div>

                  </div>;
    })}
            </div>}

        </div>
  )}

      {
    /* CLEAR ALL CONFIRMATION MODAL */
  }
      {isConfirmClearOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" id="clear_all_modal">
          <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-650 dark:text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Clear All Events?</h3>
                <p className="text-xs text-slate-400 dark:text-gray-400 font-mono text-[10px] tracking-wider uppercase">Forex Factory Wipe</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed font-sans">
              ⚠️ Are you absolutely sure you want to completely delete ALL imported calendar events? This operation cannot be undone and will restore the landing state instructions.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
    type="button"
    onClick={() => setIsConfirmClearOpen(false)}
    className="px-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
  >
                Cancel, Keep
              </button>
              <button
    type="button"
    onClick={handleClearAllEvents}
    className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-red-500/10"
  >
                Yes, Wipe Database
              </button>
            </div>
          </div>
        </div>}

      {
    /* DELETE SINGLE EVENT CONFIRMATION MODAL */
  }
      {eventToDelete !== null && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" id="delete_single_modal">
          <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-3 text-yellow-500">
              <div className="p-3 bg-yellow-105 dark:bg-yellow-500/10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Delete Event Entry?</h3>
                <p className="text-xs text-slate-400 dark:text-gray-400 font-mono text-[10px] tracking-wider uppercase">Remove from schedules</p>
              </div>
            </div>

            <p className="text-xs text-slate-605 dark:text-gray-300 leading-relaxed font-sans">
              Are you sure you want to remove this specific economic event?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
    type="button"
    onClick={() => setEventToDelete(null)}
    className="px-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
  >
                Cancel
              </button>
              <button
    type="button"
    onClick={() => handleDeleteIndividualEvent(eventToDelete)}
    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
  >
                Delete Event
              </button>
            </div>
          </div>
        </div>}

    </div>;
}
