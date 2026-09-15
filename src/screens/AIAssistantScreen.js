import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { sendAIMessage } from '../services/aiService';

export default function AIAssistantScreen({ businessData }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your DukaanOS business assistant. Ask me anything about your shop.',
    },
  ]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const context = useMemo(() => {
    const data = businessData || {};

    return {
      shop: {
        name: data.shopName || 'DukaanOS Shop',
      },

      summary: {
        totalSales: data.sales || 0,
        totalPurchases: data.purchases || 0,
        totalProfit: data.totalProfit || 0,
        totalUdhaar: data.totalUdhaar || 0,
        totalStockValue: data.totalStockValue || 0,
      },

      products: (data.products || []).map((product) => ({
        id: product.id,
        name: product.name,
        stock: Number(product.stock || 0),
        purchasePrice: Number(
          product.purchasePrice || 0,
        ),
        sellingPrice: Number(
          product.sellingPrice || 0,
        ),
        barcode: product.barcode || '',
        expiryDate: product.expiryDate || '',
      })),

      customers: (data.customers || []).map(
        (customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone || '',
          balance: Number(
            customer.balance || 0,
          ),
        }),
      ),

      recentTransactions: (
        data.transactions || []
      )
        .slice(0, 50)
        .map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          productName:
            transaction.productName || '',
          quantity:
            Number(transaction.quantity || 0),
          amount:
            Number(transaction.amount || 0),
          profit:
            Number(transaction.profit || 0),
          customerName:
            transaction.customerName || '',
          customerId:
            transaction.customerId || '',
          occurredAt:
            transaction.occurredAt ||
            transaction.createdAt ||
            '',
          note: transaction.note || '',
        })),
    };
  }, [businessData]);

  async function handleSend() {
    const message = input.trim();

    if (!message || sending) {
      return;
    }

    setInput('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setSending(true);

    try {
      const result = await sendAIMessage(
        message,
        context,
      );

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: result.text,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text:
            error?.message ||
            'Unable to connect to the AI assistant. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }) {
    const isUser = item.role === 'user';

    return (
      <View
        style={{
          alignSelf: isUser
            ? 'flex-end'
            : 'flex-start',
          maxWidth: '86%',
          marginBottom: 10,
          paddingHorizontal: 14,
          paddingVertical: 11,
          borderRadius: 16,
          backgroundColor: isUser
            ? '#6E1428'
            : '#FFFDF8',
          borderWidth: isUser ? 0 : 1,
          borderColor: '#E0D3C4',
        }}
      >
        <Text
          style={{
            color: isUser
              ? '#FFFDF8'
              : '#2B2522',
            fontSize: 15,
            lineHeight: 21,
          }}
        >
          {item.text}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={{ flex: 1 }}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 12,
          }}
          showsVerticalScrollIndicator={false}
        />

        {sending ? (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator />

            <Text
              style={{
                marginLeft: 8,
                color: '#6B5D54',
                fontSize: 13,
              }}
            >
              Thinking...
            </Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: '#E0D3C4',
            backgroundColor: '#FFFDF8',
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your business..."
            placeholderTextColor="#A49487"
            multiline
            editable={!sending}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 110,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: '#D6C8B8',
              borderRadius: 14,
              color: '#2B2522',
              backgroundColor: '#F7F1E3',
              fontSize: 15,
            }}
          />

          <Pressable
            onPress={handleSend}
            disabled={
              sending || !input.trim()
            }
            style={{
              marginLeft: 8,
              minWidth: 54,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                sending || !input.trim()
                  ? '#C8BFB5'
                  : '#6E1428',
            }}
          >
            <Text
              style={{
                color: '#FFFDF8',
                fontWeight: '700',
                fontSize: 14,
              }}
            >
              Send
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}