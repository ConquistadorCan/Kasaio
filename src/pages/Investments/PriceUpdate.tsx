import { useEffect, useCallback, useState } from "react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { assetPricesApi } from "../../api/assetPrices";
import { exchangeRatesApi } from "../../api/exchangeRatesApi";
import { logError } from "../../lib/logger";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import type { Asset, ExchangeRate } from "../../types/investments";

const ASSET_TYPE_LABELS: Record<string, string> = {
  COMMODITY: "Commodities",
  CRYPTOCURRENCY: "Cryptocurrencies",
  TEFAS_FUND: "TEFAS Funds",
  ETF: "ETFs",
  EUROBOND: "Eurobonds",
};

function currencySymbol(currency: string | undefined) {
  return currency === "USD" ? "$" : "₺";
}

// ─── Asset Price Row ──────────────────────────────────────────────────────────

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
  const [justSaved, setJustSaved] = useState(false);

  const sym = currencySymbol(asset.currency);

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
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-2 p-4 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{asset.name}</p>
          <p className="text-xs text-white/30">{asset.symbol} · {asset.currency}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-white">
            {latestPrice ? `${sym}${formatCurrency(latestPrice.price)}` : "—"}
          </p>
          {latestPrice && (
            <p className="text-xs text-white/30">{formatDate(latestPrice.recorded_at)}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0">
          <input
            type="number"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setPriceError(""); setSubmitError(""); }}
            placeholder={`New price (${sym})`}
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
            "shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40",
            justSaved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
              : "bg-violet-600 text-white hover:bg-violet-500"
          )}
        >
          {saving ? "Saving..." : justSaved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Exchange Rate Section ────────────────────────────────────────────────────

function ExchangeRateSection() {
  const [latestRate, setLatestRate] = useState<ExchangeRate | null>(null);
  const [rate, setRate] = useState("");
  const [rateError, setRateError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    exchangeRatesApi.latest("USD").then(setLatestRate).catch(() => {});
  }, []);

  async function handleSave() {
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
      setRateError("Enter a valid rate");
      return;
    }
    setRateError("");
    setSubmitError("");
    setSaving(true);
    try {
      const result = await exchangeRatesApi.create({
        currency: "USD",
        rate: Number(rate),
        recorded_at: new Date().toISOString(),
      });
      setLatestRate(result);
      setRate("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      await logError("Failed to save exchange rate", err);
      setSubmitError("Failed to save rate. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#0e0e18] border border-white/5 rounded-xl">
      <div className="px-5 py-3.5 border-b border-white/5">
        <p className="text-sm font-semibold text-white">Exchange Rates</p>
        <p className="text-xs text-white/30 mt-0.5">Used for TRY conversion in portfolio</p>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">USD / TRY</p>
            <p className="text-xs text-white/30">1 USD = ? ₺</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-white">
              {latestRate ? `₺${formatCurrency(latestRate.rate)}` : "—"}
            </p>
            {latestRate && (
              <p className="text-xs text-white/30">{formatDate(latestRate.recorded_at)}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <input
              type="number"
              value={rate}
              onChange={(e) => { setRate(e.target.value); setRateError(""); setSubmitError(""); }}
              placeholder="New rate (₺)"
              min="0"
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors font-mono",
                rateError ? "border-red-500/40" : "border-white/[0.08] focus:border-violet-500/50"
              )}
            />
            {rateError && <p className="text-xs text-red-400 mt-1">{rateError}</p>}
            {submitError && <p className="text-xs text-red-400 mt-1">{submitError}</p>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !rate}
            className={cn(
              "shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40",
              justSaved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                : "bg-violet-600 text-white hover:bg-violet-500"
            )}
          >
            {saving ? "Saving..." : justSaved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      const result = await assetPricesApi.create({
        asset_id: assetId,
        price,
        recorded_at: new Date().toISOString(),
      });
      setLatestPrice(assetId, result);
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
        <p className="text-sm text-white/40 mt-0.5">Manually update asset prices and exchange rates</p>
      </div>

      <ExchangeRateSection />

      {Object.entries(groupedAssets).map(([type, typeAssets]) => (
        <div key={type} className="bg-[#0e0e18] border border-white/5 rounded-xl">
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
