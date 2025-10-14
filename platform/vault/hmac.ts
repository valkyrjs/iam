/**
 * Hash a value with given secret.
 *
 * @param value  - Value to hash.
 * @param secret - Secret to hash the value against.
 */
export async function hash(value: string, secret: string): Promise<string> {
  const key = await getImportKey(secret, ["sign"]);
  const encoder = new TextEncoder();
  const valueData = encoder.encode(value);
  const signature = await crypto.subtle.sign("HMAC", key, valueData);
  return bufferToHex(signature);
}

/**
 * Verify that the given value results in the expected hash using the provided secret.
 *
 * @param value        - Value to verify.
 * @param expectedHash - Expected hash value.
 * @param secret       - Secret used to hash the value.
 */
export async function verify(value: string, expectedHash: string, secret: string): Promise<boolean> {
  const key = await getImportKey(secret, ["verify"]);
  const encoder = new TextEncoder();
  const valueData = encoder.encode(value);
  const signature = hexToBuffer(expectedHash);
  return crypto.subtle.verify("HMAC", key, signature, valueData);
}

/*
 |--------------------------------------------------------------------------------
 | Utilities
 |--------------------------------------------------------------------------------
 */

async function getImportKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: { name: "SHA-256" } }, false, usages);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const match = hex.match(/.{1,2}/g);
  if (match === null) {
    return new Uint8Array().buffer;
  }
  return new Uint8Array(match.map((byte) => parseInt(byte, 16))).buffer;
}
