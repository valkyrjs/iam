import * as Jose from "jose";

import {
  createKeyPair,
  type ExportedKeyPair,
  importPrivateKey,
  importPublicKey,
  type KeyPair,
  loadKeyPair,
} from "./key-pair.ts";

/*
 |--------------------------------------------------------------------------------
 | Security Settings
 |--------------------------------------------------------------------------------
 */

const VAULT_ALGORITHM = "ECDH-ES+A256KW";
const VAULT_ENCRYPTION = "A256GCM";

/*
 |--------------------------------------------------------------------------------
 | Vault
 |--------------------------------------------------------------------------------
 */

export class Vault {
  #keyPair: KeyPair;

  constructor(keyPair: KeyPair) {
    this.#keyPair = keyPair;
  }

  get keys() {
    return this.#keyPair;
  }

  /**
   * Enecrypt the given value with the vaults key pair.
   *
   * @param value - Value to encrypt.
   */
  async encrypt<T extends Record<string, unknown> | unknown[] | string>(value: T): Promise<string> {
    const text = new TextEncoder().encode(JSON.stringify(value));
    return new Jose.CompactEncrypt(text)
      .setProtectedHeader({
        alg: VAULT_ALGORITHM,
        enc: VAULT_ENCRYPTION,
      })
      .encrypt(this.#keyPair.public.key);
  }

  /**
   * Decrypts the given cypher text with the vaults key pair.
   *
   * @param cypherText - String to decrypt.
   */
  async decrypt<T>(cypherText: string): Promise<T> {
    const { plaintext } = await Jose.compactDecrypt(cypherText, this.#keyPair.private.key);
    return JSON.parse(new TextDecoder().decode(plaintext));
  }
}

/*
 |--------------------------------------------------------------------------------
 | Factories
 |--------------------------------------------------------------------------------
 */

export async function createVault(): Promise<Vault> {
  return new Vault(await createKeyPair(VAULT_ALGORITHM));
}

export async function importVault(keyPair: ExportedKeyPair): Promise<Vault> {
  return new Vault(await loadKeyPair(keyPair, VAULT_ALGORITHM));
}

export async function encrypt<T extends Record<string, unknown> | unknown[] | string>(value: T, publicKey: string) {
  const text = new TextEncoder().encode(JSON.stringify(value));
  return new Jose.CompactEncrypt(text)
    .setProtectedHeader({
      alg: VAULT_ALGORITHM,
      enc: VAULT_ENCRYPTION,
    })
    .encrypt(await importPublicKey(publicKey, VAULT_ALGORITHM));
}

export async function decrypt<T>(cypherText: string, privateKey: string): Promise<T> {
  const { plaintext } = await Jose.compactDecrypt(cypherText, await importPrivateKey(privateKey, VAULT_ALGORITHM));
  return JSON.parse(new TextDecoder().decode(plaintext));
}
