import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

const KEY_NAME = 'dukaan-snapshot-key-v1';

function encodeUtf8(value) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
  const encoded = unescape(encodeURIComponent(value));
  return Uint8Array.from(encoded, (character) => character.charCodeAt(0));
}

function decodeUtf8(bytes) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
  return decodeURIComponent(escape(String.fromCharCode(...bytes)));
}

const AAD = encodeUtf8('dukaan-snapshot-v1');

async function getKey() {
  let encoded = await SecureStore.getItemAsync(KEY_NAME);
  if (!encoded) {
    encoded = bytesToHex(await Crypto.getRandomBytesAsync(32));
    await SecureStore.setItemAsync(KEY_NAME, encoded, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  }
  const key = hexToBytes(encoded);
  if (key.length !== 32) throw new Error('Invalid DukaanOS snapshot key');
  return key;
}

export async function encryptSnapshot(value) {
  const key = await getKey();
  const nonce = await Crypto.getRandomBytesAsync(12);
  const plaintext = encodeUtf8(JSON.stringify(value));
  const ciphertext = gcm(key, nonce, AAD).encrypt(plaintext);
  return JSON.stringify({ version: 1, algorithm: 'AES-256-GCM', nonce: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext) });
}

export async function decryptSnapshot(value) {
  const envelope = JSON.parse(value);
  if (envelope?.algorithm !== 'AES-256-GCM' || envelope.version !== 1) throw new Error('Unsupported DukaanOS snapshot format');
  const key = await getKey();
  const plaintext = gcm(key, hexToBytes(envelope.nonce), AAD).decrypt(hexToBytes(envelope.ciphertext));
  return JSON.parse(decodeUtf8(plaintext));
}

export function isEncryptedSnapshot(value) {
  try {
    const envelope = JSON.parse(value);
    return envelope?.algorithm === 'AES-256-GCM' && envelope.version === 1;
  } catch {
    return false;
  }
}
