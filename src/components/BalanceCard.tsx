import React from 'react';

interface BalanceCardProps {
  moneyIn: number;
  moneyOut: number;
  profit: number;
  onOpenSell: () => void;
  onOpenRestock: () => void;
}

const formatMoney = (n: number) => `QAR ${n.toFixed(2)}`;

export const BalanceCard: React.FC<BalanceCardProps> = ({
  moneyIn,
  moneyOut,
  profit,
  onOpenSell,
  onOpenRestock,
}) => {
  return (
    <section className="card" id="business-balance-card">
      <h2>Business balance</h2>
      <div className="stats">
        <div className="stat" id="stat-money-in">
          <span>Money in</span>
          <strong id="in">{formatMoney(moneyIn)}</strong>
        </div>
        <div className="stat" id="stat-money-out">
          <span>Money out</span>
          <strong id="out">{formatMoney(moneyOut)}</strong>
        </div>
        <div className="stat" id="stat-profit">
          <span>Profit</span>
          <strong className={profit < 0 ? 'bad' : 'good'} id="profit">
            {formatMoney(profit)}
          </strong>
        </div>
      </div>
      <div className="actions">
        <button className="action" id="sell" type="button" onClick={onOpenSell}>
          💸<b>Sold items</b>
          <small>Customer + quantity</small>
        </button>
        <button className="action" id="restock" type="button" onClick={onOpenRestock}>
          📦<b>Restocked</b>
          <small>Add items and cost</small>
        </button>
      </div>
    </section>
  );
};
