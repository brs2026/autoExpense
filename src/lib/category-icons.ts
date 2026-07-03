import {
  SprayCan,
  Wallet,
  HandCoins,
  Fuel,
  MoreHorizontal,
  Droplet,
  SquareParking,
  Wrench,
  Landmark,
  CircleDot,
  Building2,
  Car,
  Receipt,
  type LucideIcon,
} from "lucide-react";

type CategoryVisual = {
  icon: LucideIcon;
  color: string;
};

// Normalizes category names so lookups survive casing/whitespace/apostrophe
// drift coming from the DB (e.g. "Driver's Salary" -> "driver-s-salary")
function normalizeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

const EXPENSE_ICON_MAP: Record<string, CategoryVisual> = {
  "car-wash": { icon: SprayCan, color: "#0ea5e9" },
  "driver-s-salary": { icon: Wallet, color: "#8b5cf6" },
  "driver-s-tip": { icon: HandCoins, color: "#a855f7" },
  fuel: { icon: Fuel, color: "#ef4444" },
  misc: { icon: MoreHorizontal, color: "#6b7280" },
  "oil-change": { icon: Droplet, color: "#f59e0b" },
  parking: { icon: SquareParking, color: "#3b82f6" },
  repair: { icon: Wrench, color: "#f97316" },
  tax: { icon: Landmark, color: "#64748b" },
  tire: { icon: CircleDot, color: "#334155" },
};

const INCOME_ICON_MAP: Record<string, CategoryVisual> = {
  "rental-payment": { icon: Building2, color: "#22c55e" },
  "trip-fare": { icon: Car, color: "#10b981" },
};

const DEFAULT_EXPENSE_VISUAL: CategoryVisual = {
  icon: Receipt,
  color: "#ef4444",
};
const DEFAULT_INCOME_VISUAL: CategoryVisual = {
  icon: Wallet,
  color: "#22c55e",
};

export function getExpenseCategoryVisual(categoryName: string): CategoryVisual {
  const key = normalizeKey(categoryName);
  const match = EXPENSE_ICON_MAP[key];
  if (!match && process.env.NODE_ENV !== "production") {
    console.warn(
      `[category-icons] No icon mapped for expense category "${categoryName}". Add it to EXPENSE_ICON_MAP.`
    );
  }
  return match ?? DEFAULT_EXPENSE_VISUAL;
}

export function getIncomeCategoryVisual(sourceName: string): CategoryVisual {
  const key = normalizeKey(sourceName);
  const match = INCOME_ICON_MAP[key];
  if (!match && process.env.NODE_ENV !== "production") {
    console.warn(
      `[category-icons] No icon mapped for income source "${sourceName}". Add it to INCOME_ICON_MAP.`
    );
  }
  return match ?? DEFAULT_INCOME_VISUAL;
}
