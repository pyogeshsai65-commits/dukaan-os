import { Linking } from 'react-native';

export const reminderTemplates = {
  en: (name, amount) => `Hi ${name}, a friendly reminder from our shop: your outstanding balance is ₹${Number(amount || 0).toFixed(2)}. Please pay when convenient. Thank you!`,
  hi: (name, amount) => `नमस्ते ${name}, हमारी दुकान की याद दिलाने के लिए: आपका बकाया ₹${Number(amount || 0).toFixed(2)} है। सुविधा अनुसार भुगतान करें। धन्यवाद!`,
};

export function createReminder({ customer, language = 'hi' }) {
  const text = (reminderTemplates[language] || reminderTemplates.hi)(customer.name, customer.balance);
  return { customerId: customer.id, channel: 'manual', language, text, createdAt: new Date().toISOString() };
}

export async function openReminderComposer({ customer, language = 'hi', channel = 'whatsapp' }) {
  const reminder = createReminder({ customer, language });
  const phone = String(customer.phone || '').replace(/[^\d+]/g, '');
  const encoded = encodeURIComponent(reminder.text);
  const url = channel === 'whatsapp' && phone
    ? `whatsapp://send?phone=${phone}&text=${encoded}`
    : `sms:${phone || ''}${phone ? '?' : ''}body=${encoded}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    return { ...reminder, url, opened: supported };
  } catch (error) {
    return { ...reminder, url, opened: false, error: error.message };
  }
}
