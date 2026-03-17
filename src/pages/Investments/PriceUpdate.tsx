import { useEffect, useCallback, useState } from "react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { assetPricesApi } from "../../api/assetPrices";
import { logError } from "../../lib/logger";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { ErrorBanner } from "../../components/ui/ErrorComponents";
import { cn } from "../../lib/utils";

export function PriceUpdate() {
  const { assets, latestPrices, setLatestPrice } = useInvestmentStore();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLatestPrices = useCallback(async () => {
    try {
      await Promise.all(
        assets.map(async (a) => {
          try {
            const latest = await assetPricesApi.latest(a.id);
            setLatestPrice(a.id, latest);
          } catch {
            // no price yet for this asset — not an error
          }
        })
      );
    } catch (err) {
      await logError("Failed to load latest prices", err);
    }
  }, [assets, setLatestPrice]);

  useEffect(() => {
    fetchLatestPrices();
  }, [fetchLatestPrices]);

  async function handleSave() {
    if (!selectedAssetId) return;
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setPriceError("Enter a valid price");
      return;
    }
    setPriceError("");
    setSubmitError("");
    setSaving(true);
    try {
      const saved = await assetPricesApi.create({
        asset_id: selectedAssetId,
        price: Number(price),
        recorded_at: new Date().toISOString(),
      });
      setLatestPrice(selectedAssetId, saved);
      setPrice("");
    } catch (err) {
      await logError("Failed to save price", err);
      setSubmitError("Failed to save price. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const commodities = assets.filter((a) => a.asset_type === "COMMODITY");

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Price Update</h1>
        <p className="text-sm text-white/40 mt-0.5">Manually update asset prices</p>
      </div>

      {/* Price entry */}
      <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-white/60">Enter new price</h2>

        {/* Asset selection */}
        <div className="flex gap-2">
          {commodities.map((a) => (
            <button
              key={a.id}
              onClick={() => { setSelectedAssetId(a.id); setPrice(""); setPriceError(""); setSubmitError(""); }}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                selectedAssetId === a.id
                  ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                  : "bg-white/5 text-white/40 border-white/5 hover:bg-white/[0.08] hover:text-white/70"
              )}
            >
              {a.name}
            </button>
          ))}
        </div>

        {selectedAssetId && (
          <>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Price per gram (₺)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setPriceError(""); }}
                placeholder="0.00"
                min="0"
                className={cn(
                  "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors font-mono",
                  priceError ? "border-red-500/40" : "border-white/[0.08] focus:border-violet-500/50"
                )}
              />
              {priceError && <p className="text-xs text-red-400 mt-1">{priceError}</p>}
            </div>

            {submitError && <ErrorBanner message={submitError} />}

            <button
              onClick={handleSave}
              disabled={saving}
              className="py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Price"}
            </button>
          </>
        )}
      </div>

      {/* Latest prices table */}
      <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_140px] px-5 py-3 border-b border-white/5">
          {["Asset", "Latest Price", "Updated"].map((col) => (
            <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
              {col}
            </span>
          ))}
        </div>

        {commodities.map((a) => {
          const latest = latestPrices[a.id];
          return (
            <div
              key={a.id}
              className="grid grid-cols-[1fr_140px_140px] px-5 py-4 border-b border-white/5 last:border-0 items-center"
            >
              <div>
                <p className="text-sm font-medium text-white">{a.name}</p>
                <p className="text-xs text-white/30">{a.symbol}</p>
              </div>
              <span className="text-sm font-mono text-white">
                {latest ? `₺${formatCurrency(latest.price)}` : "—"}
              </span>
              <span className="text-sm text-white/40">
                {latest ? formatDate(latest.recorded_at) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}