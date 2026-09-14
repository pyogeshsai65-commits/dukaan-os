import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';
import { money } from '../utils/money';
import { formatTime } from '../utils/date';

export function transactionTitle(t) {
  if (t.type === 'sale') return `Sold ${t.quantity} × ${t.productName}`;
  if (t.type === 'credit-sale') return `Udhaar Sale · ${t.quantity} × ${t.productName}`;
  if (t.type === 'purchase') return `Purchased ${t.quantity} × ${t.productName}`;
  if (t.type === 'credit') return `Udhaar Added · ${t.productName}`;
  if (t.type === 'payment') return `Payment from ${t.productName}`;
  if (t.type === 'payment-reversal') return `Payment reversed · ${t.productName}`;
  if (t.type === 'inventory-adjustment') return `${t.direction === 'ADD' ? 'Stock added' : 'Stock removed'} · ${t.quantity} × ${t.productName}`;
  return t.productName;
}
export function TransactionRow({ transaction }) {
  const isAdjustment = transaction.type === 'inventory-adjustment';
  const iconStyle = isAdjustment ? styles.adjustmentIcon : transaction.type === 'purchase' ? styles.purchaseIcon : transaction.type === 'payment' ? styles.paymentIcon : styles.saleIcon;
  const isAddedAdjustment = isAdjustment && transaction.direction === 'ADD';
  const icon = isAdjustment ? (isAddedAdjustment ? '+' : '−') : transaction.type === 'purchase' ? '↓' : transaction.type === 'payment' ? '✓' : transaction.type === 'credit' || transaction.type === 'credit-sale' ? '🤝' : '↑';
  return <View style={styles.transactionRow}><View style={[styles.transactionIcon, iconStyle]}><Text style={styles.transactionIconText}>{icon}</Text></View><View style={styles.transactionInfo}><Text style={styles.transactionTitle}>{transactionTitle(transaction)}</Text><Text style={styles.transactionMeta}>{formatTime(transaction.timestamp)}{transaction.reason ? `  ·  ${transaction.reason}` : ''}{transaction.note ? `  ·  ${transaction.note}` : ''}</Text>{transaction.profit > 0 ? <Text style={styles.profitText}>Profit {money(transaction.profit)}</Text> : null}</View><Text style={[styles.transactionAmount, isAdjustment ? (isAddedAdjustment ? styles.positiveAmount : styles.negativeAmount) : transaction.type === 'purchase' ? styles.negativeAmount : styles.positiveAmount]}>{isAdjustment ? `${isAddedAdjustment ? '+' : '-'}${transaction.quantity} units` : `${transaction.type === 'purchase' ? '-' : '+'}${money(transaction.amount)}`}</Text></View>;
}
