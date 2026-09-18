export type EntryType = 'sale' | 'restock' | 'other';

export interface MoneyEntry {
  id?: string;
  type: EntryType;
  amount: number;
  qty: number;
  note: string;
  customer: string;
  createdAt?: number;
}

export interface MoneyPocketData {
  stock: number;
  entries: MoneyEntry[];
}
