import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { OUTCOMES, SESSIONS, DIRECTIONS } from "./utils/constants";
import { OutcomeBadge, DirectionBadge, SessionBadge } from "./Badge";
import { Search, Filter, Trash2, Edit, Upload, Eye, FileSpreadsheet, ChevronLeft, ChevronRight, X } from "lucide-react";
export default function AllTradesTable({ trades, onEdit, onDelete, onRefresh, showToast, onNavigate }) {
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [setupFilter, setSetupFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  useEffect(() => {
    setCurrentPage(1);
  }, [outcomeFilter, sessionFilter, setupFilter, directionFilter, dateFrom, dateTo, searchTerm]);
  const filteredTrades = trades.filter((t) => {
    if (outcomeFilter && t.outcome !== outcomeFilter) return false;
    if (sessionFilter && t.session !== sessionFilter) return false;
    if (setupFilter && t.setup_type !== setupFilter) return false;
    if (directionFilter && t.direction !== directionFilter) return false;
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo && t.date > dateTo) return false;
    if (searchTerm) {
      const match = t.pair_instrument.toLowerCase().includes(searchTerm.toLowerCase()) || (t.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };
  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err) {
      showToast(err.message || "Failed to delete trade.", "error");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleCsvImport = () => {
    if (!csvFile) {
      showToast("Please select a valid CSV file.", "error");
      return;
    }
    setIsParsing(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          const validRows = rows.filter((row) => {
            const hasStatus = row["Status"] === "closed";
            const hasRealisedPnl = row["Realised P&L"] !== void 0 && row["Realised P&L"] !== null && row["Realised P&L"] !== "";
            const pnlNotZero = hasRealisedPnl && parseFloat(row["Realised P&L"]) !== 0;
            return hasStatus && hasRealisedPnl && pnlNotZero;
          });
          if (validRows.length === 0) {
            showToast('No valid trades found in CSV of status "closed" with non-zero Realised P&L.', "error");
            setIsParsing(false);
            return;
          }
          let importCount = 0;
          let duplicateCount = 0;
          for (const row of validRows) {
            const pair = (row["Contract"] || "").trim().toUpperCase();
            const dateStr = (row["Time"] || "").substring(0, 10);
            const marketVal = "Crypto";
            const dirVal = row["Side"] === "buy" ? "Long" : "Short";
            const pnlVal = parseFloat(row["Realised P&L"]);
            const feeVal = parseFloat(row["Trading Fees"] || "0") * -1;
            const netPnlVal = pnlVal + feeVal;
            let outcomeVal = "Breakeven";
            if (netPnlVal > 0) outcomeVal = "Win";
            else if (netPnlVal < 0) outcomeVal = "Loss";
            const isDuplicate = trades.some(
              (t) => t.pair_instrument === pair && t.date === dateStr && t.pnl_usd === pnlVal
            );
            if (isDuplicate) {
              duplicateCount++;
              continue;
            }
            const response = await authFetch("/api/trades", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pair_instrument: pair,
                date: dateStr,
                market: marketVal,
                direction: dirVal,
                session: "",
                setup_type: "",
                confluences: "[]",
                mistakes: "[]",
                pnl_usd: pnlVal,
                fee_usd: feeVal,
                net_pnl_usd: netPnlVal,
                net_daily_amount_usd: 0,
                outcome: outcomeVal,
                screenshot_url: "",
                notes: ""
              })
            });
            if (response.ok) {
              importCount++;
            } else {
              console.error("Failed to import row: ", row);
            }
          }
          showToast(`\u2705 Imported ${importCount} new trades! ${duplicateCount} duplicates skipped.`, "success");
          setIsCsvModalOpen(false);
          setCsvFile(null);
          await onRefresh();
        } catch (err) {
          showToast(`CSV Processing error: ${err.message}`, "error");
        } finally {
          setIsParsing(false);
        }
      },
      error: (error) => {
        showToast(`Failed to parse CSV file: ${error.message}`, "error");
        setIsParsing(false);
      }
    });
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        setCsvFile(file);
      } else {
        showToast("Only CSV files are supported.", "error");
      }
    }
  };
  const clearFilters = () => {
    setOutcomeFilter("");
    setSessionFilter("");
    setSetupFilter("");
    setDirectionFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };
  return <div className="w-full space-y-6">
      {
    /* Top action header bar */
  }
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-gray-400 font-medium">Total Filtered:</span>
          <span className="bg-blue-500/10 border border-blue-500/20 font-mono text-blue-600 dark:text-blue-400 text-xs px-2.5 py-1 rounded-lg font-bold">
            {filteredTrades.length} Trades Listed
          </span>
        </div>

        <button
    id="openImportModalBtn"
    onClick={() => setIsCsvModalOpen(true)}
    className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 dark:bg-[#0e0b18]/65 dark:hover:bg-[#222] text-slate-700 hover:text-black dark:text-gray-300 dark:hover:text-white border border-[#e2e8f0] dark:border-violet-500/15 rounded-lg text-xs font-semibold cursor-pointer outline-none transition-all shadow-sm"
  >
          <span>📂 Import CSV</span>
        </button>
      </div>

      {
    /* Advanced Filter Panel */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-[#e2e8f0] dark:border-violet-500/15 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-violet-500/15 pb-3">
          <div className="flex items-center space-x-2 text-[#0f172a] dark:text-white font-semibold text-sm">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Search & Filter Parameters</span>
          </div>
          <button
    onClick={clearFilters}
    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium cursor-pointer"
  >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {
    /* Pair Search */
  }
          <div className="lg:col-span-2 relative">
            <label htmlFor="searchFilter" className="block text-[10px] uppercase font-semibold text-[#475569] dark:text-gray-500 mb-1.5 font-bold">Search Instrument / Note</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500 dark:text-gray-650" />
              <input
    id="searchFilter"
    type="text"
    placeholder="BTCUSD, notes..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-[#0f172a] dark:text-white text-xs placeholder-slate-400 dark:placeholder-gray-600 outline-none focus:border-blue-500 font-mono"
  />
            </div>
          </div>

          {
    /* Outcome Filter */
  }
          <div>
            <label htmlFor="outcomeFilter" className="block text-[10px] uppercase font-semibold text-[#475569] dark:text-gray-500 mb-1.5 font-bold">Outcome</label>
            <select
    id="outcomeFilter"
    value={outcomeFilter}
    onChange={(e) => setOutcomeFilter(e.target.value)}
    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-[#0f172a] dark:text-white text-xs outline-none focus:border-blue-500 cursor-pointer"
  >
              <option value="">All Outcomes</option>
              {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {
    /* Direction Filter */
  }
          <div>
            <label htmlFor="directionFilter" className="block text-[10px] uppercase font-semibold text-[#475569] dark:text-gray-500 mb-1.5 font-bold">Direction</label>
            <select
    id="directionFilter"
    value={directionFilter}
    onChange={(e) => setDirectionFilter(e.target.value)}
    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-[#0f172a] dark:text-white text-xs outline-none focus:border-blue-500 cursor-pointer"
  >
              <option value="">All Directions</option>
              {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {
    /* Session Filter */
  }
          <div>
            <label htmlFor="sessionFilter" className="block text-[10px] uppercase font-semibold text-[#475569] dark:text-gray-500 mb-1.5 font-bold">Session</label>
            <select
    id="sessionFilter"
    value={sessionFilter}
    onChange={(e) => setSessionFilter(e.target.value)}
    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-[#0f172a] dark:text-white text-xs outline-none focus:border-blue-500 cursor-pointer"
  >
              <option value="">All Sessions</option>
              {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {
    /* Date From */
  }
          <div>
            <label htmlFor="dateFromFilter" className="block text-[10px] uppercase font-semibold text-[#475569] dark:text-gray-500 mb-1.5 font-bold">Date From</label>
            <input
    id="dateFromFilter"
    type="date"
    value={dateFrom}
    onChange={(e) => setDateFrom(e.target.value)}
    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-[#0f172a] dark:text-white text-xs outline-none focus:border-blue-500 cursor-pointer"
  />
          </div>

          {
    /* Date To */
  }
          <div>
            <label htmlFor="dateToFilter" className="block text-[10px] uppercase font-semibold text-[#475569] dark:text-gray-500 mb-1.5 font-bold">Date To</label>
            <input
    id="dateToFilter"
    type="date"
    value={dateTo}
    onChange={(e) => setDateTo(e.target.value)}
    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-lg text-[#0f172a] dark:text-white text-xs outline-none focus:border-blue-500 cursor-pointer"
  />
          </div>
        </div>
      </div>

      {
    /* Main Datagrid */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-[#e2e8f0] dark:border-violet-500/15 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#121212] border-b border-[#e2e8f0] dark:border-violet-500/15 text-[#475569] dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-4">Pair</th>
                <th className="py-4 px-4 text-center">Direction</th>
                <th className="py-4 px-4 text-center">Session</th>
                <th className="py-4 px-4">Setup Type</th>
                <th className="py-4 px-4 text-center">Outcome</th>
                <th className="py-4 px-4 text-right">PnL (USD)</th>
                <th className="py-4 px-4 text-right">Fee (USD)</th>
                <th className="py-4 px-4 text-right">Net PnL</th>
                <th className="py-4 px-4 text-right">Net Daily</th>
                <th className="py-4 px-4">Confluences</th>
                <th className="py-4 px-4">Mistakes</th>
                <th className="py-4 px-4 text-center">Screenshot</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#242424] text-sm text-slate-700 dark:text-gray-300">
              {paginatedTrades.length === 0 ? <tr>
                  <td colSpan={14} className="text-center py-16 text-slate-400 dark:text-gray-500">
                    <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="font-bold text-[#0f172a] dark:text-white">No trading logs matched</p>
                    <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">Try clearing filters or log a new transaction to populate the table</p>
                  </td>
                </tr> : paginatedTrades.map((t) => {
    const netVal = t.net_pnl_usd;
    const absFee = Math.abs(t.fee_usd);
    return <tr
      key={t.id}
      onClick={() => onEdit(t)}
      className="hover:bg-slate-50/55 dark:hover:bg-[#202020]/60 cursor-pointer active:bg-slate-100 dark:active:bg-[#252525]/80 transition-colors group"
    >
                      {
      /* Date */
    }
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500 dark:text-gray-400">{t.date}</td>
                      
                      {
      /* Pair */
    }
                      <td className="py-3.5 px-4 font-bold text-[#0f172a] dark:text-white tracking-tight">{t.pair_instrument}</td>
                      
                      {
      /* Direction */
    }
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <DirectionBadge direction={t.direction} />
                      </td>
                      
                      {
      /* Session */
    }
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <SessionBadge session={t.session} />
                      </td>
                      
                      {
      /* Setup */
    }
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-gray-400">{t.setup_type || "\u2014"}</td>
                      
                      {
      /* Outcome */
    }
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <OutcomeBadge outcome={t.outcome} />
                      </td>
                      
                      {
      /* Gross PnL */
    }
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${t.pnl_usd >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        {t.pnl_usd >= 0 ? `+$${t.pnl_usd.toFixed(2)}` : `-$${Math.abs(t.pnl_usd).toFixed(2)}`}
                      </td>
                      
                      {
      /* Fee */
    }
                      <td className="py-3.5 px-4 text-right font-mono text-red-600/80 dark:text-red-550/80 text-xs">
                        {t.fee_usd > 0 ? `+$${t.fee_usd.toFixed(2)}` : t.fee_usd < 0 ? `-$${Math.abs(t.fee_usd).toFixed(2)}` : "$0.00"}
                      </td>
                      
                      {
      /* Net PnL */
    }
                      <td className={`py-3.5 px-4 text-right font-mono font-black ${netVal >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        {netVal >= 0 ? `+$${netVal.toFixed(2)}` : `-$${Math.abs(netVal).toFixed(2)}`}
                      </td>
                      
                      {
      /* Net Daily */
    }
                      <td className={`py-3.5 px-4 text-right font-mono text-xs font-semibold ${t.net_daily_amount_usd >= 0 ? "text-green-600/85 dark:text-green-500/80" : "text-red-600/85 dark:text-red-500/80"}`}>
                        {t.net_daily_amount_usd >= 0 ? `+$${t.net_daily_amount_usd.toFixed(2)}` : `-$${Math.abs(t.net_daily_amount_usd).toFixed(2)}`}
                      </td>
                      
                      {
      /* Confluences */
    }
                      <td className="py-3.5 px-4 text-xs max-w-xs truncate" title={t.confluences.join(", ")}>
                        {t.confluences.length > 0 ? <div className="flex gap-1 overflow-hidden select-none">
                            {t.confluences.slice(0, 2).map((c) => <span key={c} className="bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/10 dark:border-green-500/20 px-1 py-0.2 rounded text-[10px]">
                                {c}
                              </span>)}
                            {t.confluences.length > 2 && <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold">+{t.confluences.length - 2}</span>}
                          </div> : <span className="text-gray-400 dark:text-gray-650">—</span>}
                      </td>
                      
                      {
      /* Mistakes */
    }
                      <td className="py-3.5 px-4 text-xs max-w-xs truncate" title={t.mistakes.join(", ")}>
                        {t.mistakes.length > 0 ? <div className="flex gap-1 overflow-hidden select-none">
                            {t.mistakes.slice(0, 2).map((m) => <span key={m} className={`bg-red-500/5 text-red-600 dark:text-red-400 border border-red-500/10 dark:border-red-500/20 px-1 py-0.2 rounded text-[10px] ${m === "No Mistake" ? "text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-violet-500/15" : ""}`}>
                                {m}
                              </span>)}
                            {t.mistakes.length > 2 && <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold">+{t.mistakes.length - 2}</span>}
                          </div> : <span className="text-gray-450 dark:text-gray-650">—</span>}
                      </td>

                      {
      /* Screenshot Link */
    }
                      <td className="py-3.5 px-4 text-center text-xs" onClick={(e) => e.stopPropagation()}>
                        {t.screenshot_url ? <a
      href={t.screenshot_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors p-1 bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/20 hover:border-blue-500/40 rounded"
    >
                            <Eye className="w-4 h-4 mr-1" />
                            <span>View</span>
                          </a> : <span className="text-gray-450 dark:text-gray-650">—</span>}
                      </td>

                      {
      /* Action buttons */
    }
                      <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-2">
                          <button
      onClick={() => onEdit(t)}
      className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#2a2a2a] dark:hover:bg-[#353535] rounded-md text-slate-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-all border border-slate-200 dark:border-violet-500/15 cursor-pointer"
      title="Edit trade record"
    >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
      id={`delete-btn-${t.id}`}
      onClick={(e) => handleDeleteClick(e, t.id)}
      className="p-1 px-1.5 bg-red-50 hover:bg-red-500 dark:bg-red-950/20 dark:hover:bg-red-900 text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white rounded-md transition-all border border-red-200 dark:border-red-900/10 hover:border-red-500/20 cursor-pointer"
      title="Delete trade record"
    >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>;
  })}
            </tbody>
          </table>
        </div>

        {
    /* Custom Pagination Footer */
  }
        {totalPages > 1 && <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#121212] border-t border-[#e2e8f0] dark:border-violet-500/15 text-sm text-[#475569] dark:text-gray-400">
            <div>
              Showing <span className="font-bold text-[#0f172a] dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold text-[#0f172a] dark:text-white">{Math.min(currentPage * itemsPerPage, filteredTrades.length)}</span> of{" "}
              <span className="font-bold text-[#0f172a] dark:text-white">{filteredTrades.length}</span> entries
            </div>

            <div className="flex items-center space-x-2">
              <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-[#111] dark:hover:bg-[#222] border border-slate-200 dark:border-violet-500/15 disabled:opacity-40 text-[#0f172a] dark:text-white disabled:hover:bg-white dark:disabled:hover:bg-[#111] transition-all cursor-pointer"
  >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium">Page {currentPage} of {totalPages}</span>
              <button
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage(currentPage + 1)}
    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-[#111] dark:hover:bg-[#222] border border-slate-200 dark:border-violet-500/15 disabled:opacity-40 text-[#0f172a] dark:text-white disabled:hover:bg-white dark:disabled:hover:bg-[#111] transition-all cursor-pointer"
  >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>}
      </div>

      {
    /* DETAILED CSV IMPORT MODAL */
  }
      {isCsvModalOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0e0b18]/65 border border-[#e2e8f0] dark:border-violet-500/15 max-w-lg w-full rounded-2xl shadow-2xl p-6 relative">
            <button
    id="closeImportModalBtn"
    onClick={() => {
      setIsCsvModalOpen(false);
      setCsvFile(null);
    }}
    className="absolute right-4 top-4 p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 hover:text-[#0f172a] dark:hover:text-white text-slate-500 dark:text-gray-400 rounded-lg cursor-pointer"
  >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-[#0f172a] dark:text-white flex items-center space-x-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <span>Import Delta Exchange CSV</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              Drag or selector-upload your Delta Exchange export CSV. Rules: status columns must equal "closed" and have non-zero gains.
            </p>

            {
    /* Drag & Drop Area */
  }
            <div
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    onClick={() => document.getElementById("csvFileInput")?.click()}
    className="border-2 border-dashed border-slate-200 dark:border-violet-500/15 hover:border-blue-500 bg-slate-50 dark:bg-[#151225]/45/30 hover:bg-slate-100 dark:hover:bg-[#222]/80 p-8 rounded-xl text-center cursor-pointer mb-6 transition-all group"
  >
              <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
              <p className="text-xs font-bold text-slate-600 dark:text-gray-300">
                {csvFile ? csvFile.name : "Drag & drop trade CSV file here"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Accepts .csv files only, max 5MB</p>
              
              <input
    id="csvFileInput"
    type="file"
    accept=".csv"
    className="hidden"
    onChange={(e) => {
      if (e.target.files && e.target.files.length > 0) {
        setCsvFile(e.target.files[0]);
      }
    }}
  />
            </div>

            <div className="flex justify-end gap-3 font-semibold text-sm">
              <button
    onClick={() => {
      setIsCsvModalOpen(false);
      setCsvFile(null);
    }}
    disabled={isParsing}
    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 rounded-xl text-slate-700 hover:text-black dark:text-gray-300 dark:hover:text-white cursor-pointer dark:hover:bg-violet-500/10"
  >
                Cancel
              </button>
              <button
    id="importTradesBtn"
    onClick={handleCsvImport}
    disabled={!csvFile || isParsing}
    className="btn-neon btn-neon-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
  >
                {isParsing ? <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Importing...</span>
                  </> : <span>Import Trades</span>}
              </button>
            </div>
          </div>
        </div>}

      {
    /* CONFIRM DELETE DIALOG */
  }
      {deleteConfirmId !== null && <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-150">
          <div className="bg-white dark:bg-[#0e0b18]/65 border border-[#e2e8f0] dark:border-violet-500/15 max-w-sm w-full rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-[#0f172a] dark:text-white mb-2">Delete Trade Record?</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure? This operation is permanent. This cannot be undone and deletes all associated statistics and fee records.
            </p>

            <div className="flex justify-end gap-3 font-semibold text-sm">
              <button
    onClick={() => setDeleteConfirmId(null)}
    disabled={isDeleting}
    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#151225]/45 dark:hover:bg-violet-500/10 text-slate-700 hover:text-black dark:text-gray-300 rounded-xl border border-slate-200 dark:border-violet-500/15 cursor-pointer outline-none"
  >
                Cancel
              </button>
              <button
    id="confirmDeleteBtn"
    onClick={confirmDelete}
    disabled={isDeleting}
    className="px-5 py-2 bg-red-600 hover:bg-red-550 text-white rounded-xl shadow-lg shadow-red-500/20 cursor-pointer outline-none flex items-center space-x-1"
  >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
