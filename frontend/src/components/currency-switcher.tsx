"use client";

import { useCurrency, Currency } from "@/contexts/currency-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

const currencies: Currency[] = ["USD", "EUR", "MAD", "GBP", "JPY"];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer outline-none">
        <div className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground gap-2">
          <DollarSign className="h-4 w-4" />
          {currency}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c}
            onClick={() => setCurrency(c)}
            className={currency === c ? "bg-accent text-accent-foreground" : ""}
          >
            {c}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
