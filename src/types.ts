export type EntryType = 'sale' | 'restock' | 'other';

export interface MoneyEntry {
  type: EntryType;
  amount: number;
  qty: number;
  note: string;
  customer: string;
}

export interface MoneyPocketData {
  stock: number;
  entries: MoneyEntry[];
}
