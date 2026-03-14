"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "USD" | "EUR" | "MAD" | "GBP" | "JPY";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convert: (amount: number, from?: Currency) => number;
  format: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  MAD: 10.1,
  GBP: 0.79,
  JPY: 150.5,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem("currency") as Currency;
    if (stored && EXCHANGE_RATES[stored]) {
      setCurrency(stored);
    }
  }, []);

  const handleSetCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem("currency", c);
  };

  const convert = (amount: number, from: Currency = "USD") => {
    // Convert to USD first
    const inUSD = amount / EXCHANGE_RATES[from];
    // Convert to target currency
    return inUSD * EXCHANGE_RATES[currency];
  };

  const format = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
