/**
 * Token encryption utilities for secure storage
 * Provides basic encryption for sensitive tokens stored in localStorage
 */

// Simple encryption using built-in Web Crypto API
const ENCRYPTION_KEY_NAME = 'token_encryption_key';

// Generate or retrieve encryption key
const getEncryptionKey = async (): Promise<CryptoKey> => {
  // Check if key exists in sessionStorage (temporary key per session)
  const storedKey = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
  
  if (storedKey) {
    // Import existing key
    const keyData = new Uint8Array(JSON.parse(storedKey));
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  } else {
    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Store key for session
    const keyData = await crypto.subtle.exportKey('raw', key);
    sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(Array.from(new Uint8Array(keyData))));
    
    return key;
  }
};

// Encrypt data
export const encryptToken = async (data: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Return as base64 string
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.warn('Encryption failed, storing as plain text:', error);
    return data; // Fallback to plain text if encryption fails
  }
};

// Decrypt data
export const decryptToken = async (encryptedData: string): Promise<string> => {
  try {
    // Check if data is encrypted (base64 format)
    if (!encryptedData.includes('==') && !encryptedData.includes('=')) {
      // Likely plain text, return as-is
      return encryptedData;
    }
    
    const key = await getEncryptionKey();
    
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.warn('Decryption failed, treating as plain text:', error);
    return encryptedData; // Fallback to treating as plain text
  }
};

// Clear encryption key (for logout)
export const clearEncryptionKey = (): void => {
  sessionStorage.removeItem(ENCRYPTION_KEY_NAME);
};