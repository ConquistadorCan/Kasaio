import { useEffect, useCallback, useState } from "react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { assetPricesApi } from "../../api/assetPrices";
import { logError } from "../../lib/logger";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import type { Asset } from "../../types/investments";

const ASSET_TYPE_LABELS: Record<string, string> = {
  COMMODITY: "Commodities",
  CRYPTOCURRENCY: "Cryptocurrencies",
  TEFAS_FUND: "TEFAS Funds",
};

interface AssetRowProps {
  asset: Asset;
  latestPrice: { price: number; recorded_at: string } | undefined;
  onSave: (assetId: number, price: number) => Promise<string | undefined>;
}

function AssetPriceRow({ asset, latestPrice, onSave }: AssetRowProps) {
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setPriceError("Enter a valid price");
      return;
    }
    setPriceError("");
    setSubmitError("");
    setSaving(true);
    const err = await onSave(asset.id, Number(price));
    if (err) {
      setSubmitError(err);
    } else {
      setPrice("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-2 p-4 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{asset.name}</p>
          <p className="text-xs text-white/30">{asset.symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-white">
            {latestPrice ? `₺${formatCurrency(latestPrice.price)}` : "—"}
          </p>
          {latestPrice && (
            <p className="text-xs text-white/30">{formatDate(latestPrice.recorded_at)}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            type="number"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setPriceError(""); setSubmitError(""); }}
            placeholder="New price (₺)"
            min="0"
            className={cn(
              "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors font-mono",
              priceError ? "border-red-500/40" : "border-white/[0.08] focus:border-violet-500/50"
            )}
          />
          {priceError && <p className="text-xs text-red-400 mt-1">{priceError}</p>}
          {submitError && <p className="text-xs text-red-400 mt-1">{submitError}</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !price}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 shrink-0",
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
              : "bg-violet-600 text-white hover:bg-violet-500"
          )}
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function PriceUpdate() {
  const { assets, latestPrices, setLatestPrice } = useInvestmentStore();

  const fetchLatestPrices = useCallback(async () => {
    try {
      await Promise.all(
        assets.map(async (a) => {
          try {
            const latest = await assetPricesApi.latest(a.id);
            setLatestPrice(a.id, latest);
          } catch {
            // no price yet for this asset
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

  async function handleSave(assetId: number, price: number): Promise<string | undefined> {
    try {
      const saved = await assetPricesApi.create({
        asset_id: assetId,
        price,
        recorded_at: new Date().toISOString(),
      });
      setLatestPrice(assetId, saved);
    } catch (err) {
      await logError("Failed to save price", err);
      return "Failed to save price. Please try again.";
    }
  }

  const groupedAssets = assets.reduce<Record<string, Asset[]>>((acc, a) => {
    if (!acc[a.asset_type]) acc[a.asset_type] = [];
    acc[a.asset_type].push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Price Update</h1>
        <p className="text-sm text-white/40 mt-0.5">Manually update asset prices</p>
      </div>

      {Object.entries(groupedAssets).map(([type, typeAssets]) => (
        <div key={type} className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5">
            <p className="text-sm font-semibold text-white">
              {ASSET_TYPE_LABELS[type] ?? type}
            </p>
          </div>
          {typeAssets.map((a) => (
            <AssetPriceRow
              key={a.id}
              asset={a}
              latestPrice={latestPrices[a.id]}
              onSave={handleSave}
            />
          ))}
        </div>
      ))}
    </div>
  );
}