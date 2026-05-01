import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Insights } from "./pages/Insights";
import { Transactions } from "./pages/Transactions";
import { Categories } from "./pages/Categories";
import { InvestmentsPortfolio } from "./pages/Investments/index";
import { Commodities } from "./pages/Investments/Commodities";
import { CryptoCurrencies } from "./pages/Investments/CryptoCurrencies";
import { TefasFunds } from "./pages/Investments/TefasFunds";
import { InvestmentTransactions } from "./pages/Investments/Transactions";
import { PriceUpdate } from "./pages/Investments/PriceUpdate";
import { ETF } from "./pages/Investments/ETF";
import { Eurobond } from "./pages/Investments/Eurobond";
import { BES } from "./pages/Investments/BES";

export function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.225 0.007 60)",
            border: "1px solid oklch(1 0 0 / 0.10)",
            color: "oklch(0.97 0.005 80)",
            fontSize: "13px",
            fontFamily: "'Inter', system-ui, sans-serif",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="insights" element={<Insights />} />
          <Route path="cash-flow/transactions" element={<Transactions />} />
          <Route path="cash-flow/categories" element={<Categories />} />
          <Route path="investments/portfolio" element={<InvestmentsPortfolio />} />
          <Route path="investments/commodities" element={<Commodities />} />
          <Route path="investments/crypto" element={<CryptoCurrencies />} />
          <Route path="investments/tefas-funds" element={<TefasFunds />} />
          <Route path="investments/etf" element={<ETF />} />
          <Route path="investments/eurobond" element={<Eurobond />} />
          <Route path="investments/transactions" element={<InvestmentTransactions />} />
          <Route path="investments/price-update" element={<PriceUpdate />} />
          <Route path="investments/bes" element={<BES />} />
        </Route>
      </Routes>
    </>
  );
}