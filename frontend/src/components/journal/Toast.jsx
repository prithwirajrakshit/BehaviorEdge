import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
export function ToastNotification({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4e3);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return <div
    onClick={onClose}
    className={`fixed bottom-16 md:bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3.5 rounded-xl shadow-2xl border cursor-pointer select-none transition-all duration-300 animate-slide-in max-w-sm ${type === "success" ? "bg-green-950/95 text-green-300 border-green-800/80 shadow-green-950/25" : "bg-red-950/95 text-red-300 border-red-800/80 shadow-red-950/25"}`}
  >
      {type === "success" ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
      <p className="text-xs font-sans font-medium pr-2">{message}</p>
      <button
    onClick={(e) => {
      e.stopPropagation();
      onClose();
    }}
    className="text-gray-400 hover:text-white rounded transition-colors shrink-0"
  >
        <X className="w-4 h-4" />
      </button>
    </div>;
}
