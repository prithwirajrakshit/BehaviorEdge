import { useState } from "react";
import { Image as ImageIcon, Maximize2, X, ExternalLink, Calendar, Star, Compass, ArrowRight, ArrowLeft } from "lucide-react";
export default function GalleryView({ trades, onNavigate, onEditTrade }) {
  const [filterSetup, setFilterSetup] = useState("All");
  const [filterOutcome, setFilterOutcome] = useState("All");
  const [filterDirection, setFilterDirection] = useState("All");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [brokenImages, setBrokenImages] = useState({});
  const tradesWithScreens = trades.filter((t) => t.screenshot_url && t.screenshot_url.trim() !== "");
  const filteredGrid = tradesWithScreens.filter((t) => {
    if (filterSetup !== "All" && t.setup_type !== filterSetup) return false;
    if (filterOutcome !== "All" && t.outcome !== filterOutcome) return false;
    if (filterDirection !== "All" && t.direction !== filterDirection) return false;
    return true;
  });
  const setups = Array.from(new Set(tradesWithScreens.map((t) => t.setup_type).filter(Boolean)));
  const handleImageError = (tradeId) => {
    console.warn(`Failed to render trade screenshot for ID ${tradeId}. Using fallback vector asset.`);
    setBrokenImages((prev) => ({ ...prev, [tradeId]: true }));
  };
  const openSlideshow = (tradeId) => {
    const idx = filteredGrid.findIndex((t) => t.id === tradeId);
    if (idx !== -1) {
      setSelectedIdx(idx);
    }
  };
  const closeSlideshow = () => {
    setSelectedIdx(null);
  };
  const nextSlide = () => {
    if (selectedIdx !== null && selectedIdx < filteredGrid.length - 1) {
      setSelectedIdx(selectedIdx + 1);
    }
  };
  const prevSlide = () => {
    if (selectedIdx !== null && selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1);
    }
  };
  const renderStars = (quality) => {
    const score = parseInt(quality || "0") || 0;
    return <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < score ? "fill-current" : "text-slate-300 dark:text-gray-600 stroke-1"}`} />)}
      </div>;
  };
  const currentSlideTrade = selectedIdx !== null ? filteredGrid[selectedIdx] : null;
  return <div className="space-y-6 pb-10">
      
      {
    /* FILTER HEADER */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-md dark:shadow-lg flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Visual Screenshot Grid</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Total {tradesWithScreens.length} trades with active screenshot attachments linked.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 font-mono text-[10px] w-full sm:w-auto">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 dark:text-gray-400 uppercase font-bold text-[8px]">Setup Type</span>
            <select
    value={filterSetup}
    onChange={(e) => setFilterSetup(e.target.value)}
    className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-violet-500/15 rounded-lg p-2 text-slate-800 dark:text-white text-xs text-center cursor-pointer font-sans outline-none"
  >
              <option value="All">All Setups</option>
              {setups.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-slate-500 dark:text-gray-400 uppercase font-bold text-[8px]">Outcome</span>
            <select
    value={filterOutcome}
    onChange={(e) => setFilterOutcome(e.target.value)}
    className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-violet-500/15 rounded-lg p-2 text-slate-800 dark:text-white text-xs text-center cursor-pointer font-sans outline-none"
  >
              <option value="All">All Out</option>
              <option value="Win">Win 🟢</option>
              <option value="Loss">Loss 🔴</option>
              <option value="Breakeven">BE ⚪</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-slate-500 dark:text-gray-400 uppercase font-bold text-[8px]">Direction</span>
            <select
    value={filterDirection}
    onChange={(e) => setFilterDirection(e.target.value)}
    className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-violet-500/15 rounded-lg p-2 text-slate-800 dark:text-white text-xs text-center cursor-pointer font-sans outline-none"
  >
              <option value="All">All Dir</option>
              <option value="Long">Long 🟢</option>
              <option value="Short">Short 🔴</option>
            </select>
          </div>
        </div>
      </div>

      {
    /* GALLERY GRID */
  }
      {filteredGrid.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGrid.map((trade) => {
    const isBroken = brokenImages[trade.id];
    return <div
      key={trade.id}
      className="group relative bg-white dark:bg-[#0e0b18]/65 border border-slate-100 dark:border-[#1e1e1e] hover:border-slate-300 dark:hover:border-[#333] transition-all rounded-xl overflow-hidden shadow-md hover:shadow-xl flex flex-col justify-between"
    >
                
                {
      /* Visual Image container with nice overlay on hover */
    }
                <div className="relative aspect-video w-full bg-slate-50 dark:bg-[#121212] flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-violet-500/15">
                  {isBroken ? <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-gray-600">
                      <Compass className="w-8 h-8 opacity-40 mb-1.5" />
                      <span className="text-[10px] font-mono select-none uppercase truncate max-w-[120px]">
                        {trade.pair_instrument} Blocked view
                      </span>
                    </div> : <img
      src={trade.screenshot_url}
      alt={`${trade.pair_instrument} setup visual`}
      referrerPolicy="no-referrer"
      onError={() => handleImageError(trade.id)}
      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
    />}

                  {
      /* Dark transparent mask overlay with hover expand buttons */
    }
                  <div className="absolute inset-0 bg-[#000]/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                    <button
      onClick={() => openSlideshow(trade.id)}
      className="p-2 btn-neon rounded-full cursor-pointer"
      title="Inspect full visual"
    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    {!isBroken && <a
      href={trade.screenshot_url}
      target="_blank"
      rel="noreferrer"
      className="p-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-full text-gray-200"
      title="View direct url in tab"
    >
                        <ExternalLink className="w-4 h-4" />
                      </a>}
                  </div>
                </div>

                {
      /* Info summary */
    }
                <div className="p-3.5 space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1">
                        <span>{trade.pair_instrument}</span>
                        <span className={trade.direction === "Long" ? "text-green-600 dark:text-green-500 text-[10px]" : "text-red-650 dark:text-red-500 text-[10px]"}>
                          ({trade.direction})
                        </span>
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 dark:text-gray-500 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{trade.date}</span>
                      </p>
                    </div>

                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${trade.outcome === "Win" ? "bg-green-50 dark:bg-green-500/10 text-green-650 dark:text-green-400" : trade.outcome === "Loss" ? "bg-red-50 dark:bg-red-500/10 text-red-655 dark:text-red-400" : "bg-slate-100 dark:bg-gray-500/10 text-slate-500 dark:text-gray-400"}`}>
                      {trade.outcome}
                    </span>
                  </div>

                  {
      /* Setup info */
    }
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-gray-400 pt-1.5 border-t border-slate-100 dark:border-violet-500/15">
                    <span>{trade.setup_type || "No Setup"}</span>
                    <span className={trade.net_pnl_usd >= 0 ? "text-green-650 dark:text-green-500 font-bold" : "text-red-655 dark:text-red-500 font-bold"}>
                      {trade.net_pnl_usd >= 0 ? "+" : ""}${trade.net_pnl_usd.toFixed(2)}
                    </span>
                  </div>

                  {
      /* star quality */
    }
                  {trade.trade_quality && <div className="flex justify-between items-center pt-1 font-mono text-[9px]">
                      <span className="text-slate-400 dark:text-gray-500 uppercase font-bold text-[8px]">Quality</span>
                      {renderStars(trade.trade_quality)}
                    </div>}
                </div>

              </div>;
  })}
        </div> : <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-gray-550 font-mono">
          No trade screenshots found. Add a Screenshot URL (like clean Imgur or Lightshot link) inside Add/Edit trades to active this dashboard.
        </div>}

      {
    /* IMMERSIVE MODAL VIEW (SLIDESHOW CORNER) */
  }
      {currentSlideTrade && <div className="fixed inset-0 bg-[#0a0a0afb] backdrop-blur z-50 flex flex-col md:flex-row animate-fade-in select-none">
          
          {
    /* Main Visual Carousel canvas */
  }
          <div className="flex-1 relative flex items-center justify-center p-4">
            
            {
    /* Nav Arrows */
  }
            {selectedIdx !== null && selectedIdx > 0 && <button
    onClick={prevSlide}
    className="absolute left-4 p-3 bg-[#111]/70 hover:bg-[#222] border border-[#222] hover:border-blue-500 rounded-full text-white cursor-pointer z-20"
  >
                <ArrowLeft className="w-5 h-5" />
              </button>}

            {selectedIdx !== null && selectedIdx < filteredGrid.length - 1 && <button
    onClick={nextSlide}
    className="absolute right-4 p-3 bg-[#111]/70 hover:bg-[#222] border border-[#222] hover:border-blue-500 rounded-full text-white cursor-pointer z-20"
  >
                <ArrowRight className="w-5 h-5" />
              </button>}

            {
    /* Inspect screenshot element */
  }
            <div className="max-w-full max-h-[80vh] overflow-hidden rounded-xl border border-[#222] bg-[#000] shadow-2xl flex items-center justify-center">
              {brokenImages[currentSlideTrade.id] ? <div className="text-center p-12 text-gray-500 font-mono">
                  <Compass className="w-16 h-16 mx-auto opacity-30 mb-3" />
                  <p>Local sandbox policy or target server blocked image load from URL</p>
                  <a
    href={currentSlideTrade.screenshot_url}
    target="_blank"
    rel="noreferrer"
    className="text-blue-500 underline text-xs inline-block mt-3"
  >
                    Examine Original Direct Link
                  </a>
                </div> : <img
    src={currentSlideTrade.screenshot_url}
    alt="Full-size trade proof"
    referrerPolicy="no-referrer"
    className="max-w-full max-h-[75vh] object-contain"
  />}
            </div>

            {
    /* Quick counters */
  }
            <div className="absolute top-4 left-4 font-mono text-xs font-semibold text-gray-500 bg-[#161616] p-2 rounded-lg border border-[#222]">
              Image {selectedIdx + 1} of {filteredGrid.length}
            </div>
          </div>

          {
    /* Collapsible/Rigid Trade sidebar panels */
  }
          <div className="w-full md:w-80 bg-white dark:bg-[#141414] border-t md:border-t-0 md:border-l border-slate-200 dark:border-violet-500/15 p-6 text-xs text-slate-800 dark:text-white overflow-y-auto flex flex-col justify-between shrink-0">
            
            <div className="space-y-6">
              
              {
    /* Close, inspect header */
  }
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-violet-500/15">
                <h4 className="font-serif text-slate-900 dark:text-white font-bold text-lg tracking-wide">{currentSlideTrade.pair_instrument} Profile</h4>
                <button
    onClick={closeSlideshow}
    className="p-1.5 bg-slate-100 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 hover:bg-red-500/20 hover:text-red-550 rounded-lg cursor-pointer text-slate-700 dark:text-gray-300"
  >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {
    /* Badges card */
  }
              <div className="bg-slate-50 dark:bg-[#0e0b18]/65 rounded-xl border border-slate-200 dark:border-violet-500/15 p-4 space-y-3 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-gray-500 font-bold uppercase text-[8px]">Direction</span>
                  <span className={currentSlideTrade.direction === "Long" ? "text-green-600 dark:text-green-400 font-bold" : "text-red-650 dark:text-red-400 font-bold"}>
                    {currentSlideTrade.direction}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-gray-500 font-bold uppercase text-[8px]">Outcome</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${currentSlideTrade.outcome === "Win" ? "bg-green-50 dark:bg-green-500/10 text-green-650 dark:text-green-400" : currentSlideTrade.outcome === "Loss" ? "bg-red-50 dark:bg-red-500/10 text-red-655 dark:text-red-400" : "bg-slate-150 dark:bg-gray-500/10 text-slate-500 dark:text-gray-400"}`}>
                    {currentSlideTrade.outcome}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 dark:text-gray-500 font-bold uppercase text-[8px]">Net Profits</span>
                  <span className={`text-base font-black ${currentSlideTrade.net_pnl_usd >= 0 ? "text-green-650 dark:text-green-500" : "text-red-655 dark:text-red-500"}`}>
                    {currentSlideTrade.net_pnl_usd >= 0 ? "+" : ""}${currentSlideTrade.net_pnl_usd.toFixed(2)}
                  </span>
                </div>
              </div>

              {
    /* R:R cards, setup card */
  }
              <div className="space-y-3 font-mono">
                <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="bg-slate-50 dark:bg-[#0e0b18]/65 p-2 border border-slate-200 dark:border-violet-500/15 rounded-xl">
                    <p className="text-[7px] text-slate-400 dark:text-gray-500 uppercase font-bold">Planned R:R</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{currentSlideTrade.planned_rr || "0"}R</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0e0b18]/65 p-2 border border-slate-200 dark:border-violet-500/15 rounded-xl">
                    <p className="text-[7px] text-slate-400 dark:text-gray-500 uppercase font-bold">Actual R:R</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{currentSlideTrade.actual_rr || "0"}R</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0e0b18]/65 p-3 border border-slate-200 dark:border-violet-500/15 rounded-xl">
                  <p className="text-[8px] text-slate-400 dark:text-gray-500 uppercase font-bold">Primary Setup</p>
                  <p className="text-slate-800 dark:text-white text-xs font-bold mt-1">{currentSlideTrade.setup_type || "Custom setup model"}</p>
                </div>

                {currentSlideTrade.trade_quality && <div className="bg-slate-50 dark:bg-[#0e0b18]/65 p-3 border border-slate-200 dark:border-violet-500/15 rounded-xl flex justify-between items-center">
                    <span className="text-[8px] text-slate-400 dark:text-gray-500 uppercase font-bold">Trade Quality</span>
                    {renderStars(currentSlideTrade.trade_quality)}
                  </div>}
              </div>

              {
    /* Notes */
  }
              {currentSlideTrade.notes && <div className="space-y-1 bg-slate-50 dark:bg-[#0e0b18]/65 p-3 border border-slate-200 dark:border-violet-500/15 rounded-xl max-h-[140px] overflow-y-auto">
                  <p className="text-[8px] font-mono text-slate-400 dark:text-gray-500 uppercase font-bold">Logged Diary Notes</p>
                  <p className="text-slate-600 dark:text-gray-300 italic whitespace-pre-wrap leading-relaxed">{currentSlideTrade.notes}</p>
                </div>}

            </div>

            {
    /* Direct Edit Redirect link */
  }
            <div className="pt-6 border-t border-slate-200 dark:border-violet-500/15 mt-6">
              <button
    onClick={() => {
      closeSlideshow();
      onEditTrade(currentSlideTrade);
    }}
    className="w-full btn-neon p-2.5 text-center select-none block cursor-pointer"
  >
                Go to original parameters &rarr;
              </button>
            </div>

          </div>

        </div>}

    </div>;
}
