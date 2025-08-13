// Utility to generate and manage session codes

/**
 * Generate a 6-digit session code
 * Ensures the code is unique and easy to type
 */
export function generateSessionCode(): string {
  // Generate random 6-digit number between 100000 and 999999
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * Validate a session code format
 */
export function isValidSessionCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Generate a presenter token for secure session control
 */
export function generatePresenterToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < array.length; i++) {
    token += chars[array[i] % chars.length];
  }
  
  return token;
}

/**
 * Hash a presenter token for storage
 */
export async function hashPresenterToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a presenter token against a hash
 */
export async function verifyPresenterToken(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashPresenterToken(token);
  return tokenHash === hash;
}