export const MARKETS = ["Crypto", "Forex", "Stocks", "Options"];
export const DIRECTIONS = ["Long", "Short"];
export const SESSIONS = ["London", "New York", "Asia", "London-NY Overlap"];
export const SETUP_TYPES = [
  "Order Block",
  "Fair Value Gap",
  "Breaker Block",
  "MSS",
  "Liquidity Sweep",
  "Optimal Trade Entry",
  "SIBI / BISI",
  "NWOG / NDOG"
];
export const CONFLUENCES = [
  "HTF OB",
  "FVG",
  "Premium / Discount",
  "Liquidity Above",
  "Liquidity Below",
  "Market Structure Shift",
  "VWAP",
  "PDH / PDL",
  "Weekly High / Low",
  "Daily Bias Aligned",
  "HTF RB",
  "HTF BB"
];
export const MISTAKES = [
  "Early Entry",
  "Late Entry",
  "Moved SL",
  "Overlevered",
  "No Confirmation",
  "Chased Price",
  "Ignored HTF",
  "Overtraded",
  "Choppy Market",
  "SL Too Tight",
  "No Mistake",
  "TP Hit",
  "Full TP Hit",
  "Booked A Little Earlier"
];
export const OUTCOMES = ["Win", "Loss", "Breakeven", "Running"];
