import { cn } from "../../lib/utils";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/40">{description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              danger
                ? "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
                : "bg-violet-600 text-white hover:bg-violet-500",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
