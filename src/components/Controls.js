import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { styles } from './styles';

export function Button({ title, onPress, variant = 'primary', disabled = false, style }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, variant === 'primary' ? styles.primaryButton : styles.secondaryButton, variant === 'danger' && styles.dangerButton, disabled && styles.disabledButton, pressed && !disabled && styles.pressedButton, style]}>
    <Text style={[styles.buttonText, variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText, variant === 'danger' && styles.dangerButtonText, disabled && styles.disabledButtonText]}>{title}</Text>
  </Pressable>;
}
export function StatCard({ title, value, icon }) {
  return <View style={styles.statCard}><View style={styles.statTopRow}><Text style={styles.statLabel}>{title}</Text><Text style={styles.statIcon}>{icon}</Text></View><Text style={styles.statValue}>{value}</Text></View>;
}
export function SectionHeader({ title, subtitle, actionTitle, onAction }) {
  return <View style={styles.sectionHeader}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.sectionTitle}>{title}</Text>{subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}</View>{actionTitle ? <Button title={actionTitle} onPress={onAction} style={styles.smallButton} /> : null}</View>;
}
export function FormField({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  return <View style={styles.fieldWrap}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} style={styles.input} autoCapitalize={keyboardType === 'default' ? 'sentences' : 'none'} /></View>;
}
export function PickerRow({ label, value, options, onChange, disabled = false }) {
  return <View style={styles.fieldWrap}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.chipWrap}>{options.map((option) => <Pressable key={String(option.value)} disabled={disabled} onPress={() => onChange(option.value)} style={[styles.selectChip, value === option.value && styles.selectChipActive, disabled && styles.disabledChip]}><Text style={[styles.selectChipText, value === option.value && styles.selectChipTextActive]}>{option.label}</Text></Pressable>)}</View></View>;
}
export function ModalShell({ visible, title, children, onClose }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{title}</Text><Pressable onPress={onClose} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></Pressable></View><ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView></View></KeyboardAvoidingView></View></Modal>;
}
