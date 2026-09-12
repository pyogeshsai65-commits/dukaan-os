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
  return t.productName;
}
export function TransactionRow({ transaction }) {
  const iconStyle = transaction.type === 'purchase' ? styles.purchaseIcon : transaction.type === 'payment' ? styles.paymentIcon : styles.saleIcon;
  return <View style={styles.transactionRow}><View style={[styles.transactionIcon, iconStyle]}><Text style={styles.transactionIconText}>{transaction.type === 'purchase' ? '↓' : transaction.type === 'payment' ? '✓' : transaction.type === 'credit' || transaction.type === 'credit-sale' ? '🤝' : '↑'}</Text></View><View style={styles.transactionInfo}><Text style={styles.transactionTitle}>{transactionTitle(transaction)}</Text><Text style={styles.transactionMeta}>{formatTime(transaction.timestamp)}{transaction.note ? `  ·  ${transaction.note}` : ''}</Text>{transaction.profit > 0 ? <Text style={styles.profitText}>Profit {money(transaction.profit)}</Text> : null}</View><Text style={[styles.transactionAmount, transaction.type === 'purchase' ? styles.negativeAmount : styles.positiveAmount]}>{transaction.type === 'purchase' ? '-' : '+'}{money(transaction.amount)}</Text></View>;
}
