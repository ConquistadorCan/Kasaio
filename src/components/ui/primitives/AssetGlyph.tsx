export type AssetType = "COMMODITY" | "CRYPTOCURRENCY" | "TEFAS_FUND" | "ETF" | "EUROBOND" | "BES";

const ASSET_TYPES: Record<AssetType, { color: string; label: string }> = {
  COMMODITY:      { color: "var(--asset-cmd)",    label: "Commodity" },
  CRYPTOCURRENCY: { color: "var(--asset-crypto)",  label: "Crypto" },
  TEFAS_FUND:     { color: "var(--asset-tefas)",   label: "TEFAS" },
  ETF:            { color: "var(--asset-etf)",     label: "ETF" },
  EUROBOND:       { color: "var(--asset-eurob)",   label: "Eurobond" },
  BES:            { color: "var(--asset-bes)",     label: "BES" },
};

export function getAssetColor(type: AssetType | string): string {
  return ASSET_TYPES[type as AssetType]?.color ?? "var(--fg-3)";
}

export function getAssetLabel(type: AssetType | string): string {
  return ASSET_TYPES[type as AssetType]?.label ?? type;
}

interface AssetGlyphProps {
  type: AssetType | string;
  symbol: string;
  size?: number;
}

export function AssetGlyph({ type, symbol, size = 28 }: AssetGlyphProps) {
  const color = getAssetColor(type);
  const code = symbol.slice(0, 3).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, flexShrink: 0,
      background: `color-mix(in oklch, ${color} 18%, var(--bg-2))`,
      border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
      color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "JetBrains Mono, ui-monospace, monospace",
      fontSize: size > 24 ? 10.5 : 8.5,
      fontWeight: 600,
      letterSpacing: "0.02em",
    }}>
      {code}
    </div>
  );
}
