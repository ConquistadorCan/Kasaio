import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0e0e18] border border-white/5 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle size={18} className="text-red-400" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-white/70">{message}</p>
        <p className="text-xs text-white/30">
          Something went wrong. Try again or restart the app.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/5 transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
      <AlertCircle size={15} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0e0e18] border border-white/5 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
        <p className="text-xs text-white/20">Loading...</p>
      </div>
    </div>
  );
}
