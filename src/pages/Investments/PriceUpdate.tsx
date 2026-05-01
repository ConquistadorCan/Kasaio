import { useEffect, useCallback, useState } from "react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { assetPricesApi } from "../../api/assetPrices";
import { logError } from "../../lib/logger";
import { ApiError } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { PageHeader } from "../../components/ui/primitives";
import type { Asset } from "../../types/investments";

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
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{asset.name}</p>
          <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 2 }}>{asset.symbol} · {asset.currency}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="num" style={{ fontSize: 13, color: "var(--fg)" }}>
            {latestPrice ? `${sym}${formatCurrency(latestPrice.price)}` : "—"}
          </p>
          {latestPrice && (
            <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 2 }}>{formatDate(latestPrice.recorded_at)}</p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            type="number"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setPriceError(""); setSubmitError(""); }}
            placeholder={`New price (${sym})`}
            min="0"
            style={{ width: "100%", borderColor: priceError ? "var(--danger)" : undefined }}
          />
          {priceError && <p style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>{priceError}</p>}
          {submitError && <p style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>{submitError}</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !price}
          className={justSaved ? "btn btn-ghost" : "btn btn-primary"}
          style={justSaved ? { color: "var(--success)", borderColor: "oklch(0.78 0.15 155 / 0.3)" } : undefined}
        >
          {saving ? "Saving…" : justSaved ? "Saved ✓" : "Save"}
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
          } catch (err) {
            if (!(err instanceof ApiError && err.status === 404)) {
              logError(`Failed to load price for asset ${a.id}`, err);
            }
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
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingBottom: 24 }}>
      <PageHeader
        title="Price Update"
        meta="Manually update asset prices"
      />

      {Object.entries(groupedAssets).map(([type, typeAssets]) => (
        <div key={type} className="surface" style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-soft)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}>
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
