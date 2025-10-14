import * as Jose from "jose";

export class KeyPair {
  readonly #public: PublicKey;
  readonly #private: PrivateKey;
  readonly #algorithm: string;

  constructor({ publicKey, privateKey }: Jose.GenerateKeyPairResult, algorithm: string) {
    this.#public = new PublicKey(publicKey);
    this.#private = new PrivateKey(privateKey);
    this.#algorithm = algorithm;
  }

  get public() {
    return this.#public;
  }

  get private() {
    return this.#private;
  }

  get algorithm() {
    return this.#algorithm;
  }

  async toJSON() {
    return {
      publicKey: await this.public.toString(),
      privateKey: await this.private.toString(),
    };
  }
}

export class PublicKey {
  readonly #key: Jose.CryptoKey;

  constructor(key: Jose.CryptoKey) {
    this.#key = key;
  }

  get key(): Jose.CryptoKey {
    return this.#key;
  }

  async toString() {
    return Jose.exportSPKI(this.#key);
  }
}

export class PrivateKey {
  readonly #key: Jose.CryptoKey;

  constructor(key: Jose.CryptoKey) {
    this.#key = key;
  }

  get key(): Jose.CryptoKey {
    return this.#key;
  }

  async toString() {
    return Jose.exportPKCS8(this.#key);
  }
}

/*
 |--------------------------------------------------------------------------------
 | Factories
 |--------------------------------------------------------------------------------
 */

/**
 * Create a new key pair using the provided algorithm.
 *
 * @param algorithm - Algorithm to use for key generation.
 *
 * @returns new key pair instance
 */
export async function createKeyPair(algorithm: string): Promise<KeyPair> {
  return new KeyPair(await Jose.generateKeyPair(algorithm, { extractable: true }), algorithm);
}

/**
 * Loads a keypair from a previously exported keypair into a new KeyPair instance.
 *
 * @param keyPair   - KeyPair to load into a new keyPair instance.
 * @param algorithm - Algorithm to use for key generation.
 *
 * @returns new key pair instance
 */
export async function loadKeyPair({ publicKey, privateKey }: ExportedKeyPair, algorithm: string): Promise<KeyPair> {
  return new KeyPair(
    {
      publicKey: await importPublicKey(publicKey, algorithm),
      privateKey: await importPrivateKey(privateKey, algorithm),
    },
    algorithm,
  );
}

/**
 * Get a new Jose.KeyLike instance from a public key string.
 *
 * @param publicKey - Public key string.
 * @param algorithm - Algorithm to used for key generation.
 *
 * @returns new Jose.KeyLike instance
 */
export async function importPublicKey(publicKey: string, algorithm: string): Promise<Jose.CryptoKey> {
  return Jose.importSPKI(publicKey, algorithm, { extractable: true });
}

/**
 * get a new Jose.KeyLike instance from a private key string.
 *
 * @param privateKey - Private key string.
 * @param algorithm  - Algorithm to used for key generation.
 *
 * @returns new Jose.KeyLike instance
 */
export async function importPrivateKey(privateKey: string, algorithm: string): Promise<Jose.CryptoKey> {
  return Jose.importPKCS8(privateKey, algorithm, { extractable: true });
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type ExportedKeyPair = {
  publicKey: string;
  privateKey: string;
};
