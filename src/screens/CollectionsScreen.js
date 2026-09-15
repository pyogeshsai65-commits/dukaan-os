import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, SectionHeader } from '../components/Controls';
import { styles } from '../components/styles';
import { money } from '../utils/money';
import { openReminderComposer } from '../services/reminders';

export default function CollectionsScreen({ customers, actions }) {
  const outstanding = customers.filter((c) => Number(c.balance || 0) > 0).sort((a, b) => b.balance - a.balance);
  async function remind(customer, channel) {
    const result = await openReminderComposer({ customer, language: 'hi', channel });
    if (!result.opened) Alert.alert('Reminder ready', `${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} is not available. You can copy this message manually:\n\n${result.text}`);
  }
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.sectionCard}><SectionHeader title="Udhaar & Collections" subtitle={`${outstanding.length} customers with outstanding balance`} actionTitle="＋ Add" onAction={() => actions.modal('customer', true)} />{outstanding.length === 0 ? <View style={styles.emptyBox}><Text style={styles.emptyText}>No outstanding customers.</Text><Text style={styles.emptySubtext}>Your collection book is clear.</Text></View> : outstanding.map((c) => <View key={c.id} style={styles.collectionCard}><View style={styles.customerAvatar}><Text style={styles.customerAvatarText}>{c.name.charAt(0).toUpperCase()}</Text></View><View style={styles.customerInfo}><Text style={styles.productName}>{c.name}</Text><Text style={styles.productMeta}>{c.phone || 'No phone number'}</Text><Text style={styles.collectionDue}>{money(c.balance)} outstanding</Text></View><View><Button title="WhatsApp" style={styles.smallButton} onPress={() => remind(c, 'whatsapp')} /><Button title="SMS" variant="secondary" style={styles.smallButton} onPress={() => remind(c, 'sms')} /></View></View>)}</View><View style={styles.sectionCard}><Text style={styles.sectionTitle}>Ledger actions</Text><Button title="＋ Add Udhaar" onPress={() => actions.modal('udhaar', true)} disabled={!customers.length} /><Button title="＋ Receive Payment" variant="secondary" onPress={() => actions.modal('payment', true)} disabled={!customers.length} /></View></ScrollView>;
}
