export type BankSign = "positive" | "negative";

export type TimeTrackerEntry = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  punches: string[]; // ["08:00", "12:00", "13:00", "17:00"]
  workload: string; // "6h" | "8h" | "8h48"
  bankTime: string; // "HH:mm"
  bankSign: BankSign;
  updatedAt: string;
};

// Alias for backward compat
export type TimeTrackerData = TimeTrackerEntry;
