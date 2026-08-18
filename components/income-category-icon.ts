import {
  BanknoteIcon,
  HandCoinsIcon,
  HeartHandshakeIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { incomeCategoryIconKind } from "@/lib/income-categories";

export function getIncomeCategoryIcon(
  code: string,
  name?: string | null
): LucideIcon {
  switch (incomeCategoryIconKind(code, name)) {
    case "donation":
      return HandCoinsIcon;
    case "collection":
      return BanknoteIcon;
    case "church_service":
      return HeartHandshakeIcon;
    default:
      return WalletIcon;
  }
}
