"use strict";

/********* External Imports ********/
const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");
const { subtle } = require('crypto').webcrypto;

/********* Constants ********/
const PBKDF2_ITERATIONS = 100000; // Number of iterations for PBKDF2 algorithm

/********* Helper Function ********/
// Centralized HMAC generation to ensure consistency across set, get, and remove
async function generateHmacKey(name, hmacKey) {
  const nameBuffer = stringToBuffer(name);
  const hmac = await subtle.sign("HMAC", hmacKey, nameBuffer);
  return encodeBuffer(hmac);
}

/********* Keychain Class ********/
class Keychain {
  constructor() {
    this.data = {}; // Public data storage
    this.secrets = {}; // Private storage for keys and secrets
  }

  // Static method to initialize a new keychain with a password
  static async init(password, salt = null) {
    const passwordBuffer = stringToBuffer(password);

    // Generate a new salt if none is provided
    const saltBuffer = salt ? decodeBuffer(salt) : getRandomBytes(16);

    // Import the password as a raw key for PBKDF2
    const keyMaterial = await subtle.importKey(
      "raw",
      passwordBuffer,
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const hmacKey = await subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "HMAC", hash: "SHA-256", length: 256 },
      true,
      ["sign", "verify"]
    );

    const aesKey = await subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const keychain = new Keychain();
    keychain.secrets.hmacKey = hmacKey;
    keychain.secrets.aesKey = aesKey;
    keychain.secrets.salt = encodeBuffer(saltBuffer); // Save the salt in encoded form

    console.log("Initialization complete");
    return keychain;
  }

  // Method to set a password for a specific domain
  async set(name, value) {
    const nameBuffer = stringToBuffer(name);
    const valueBuffer = stringToBuffer(value);

    // Combine domain name and password before encryption
    const combinedData = new Uint8Array([...nameBuffer, ...valueBuffer]);

    // Generate HMAC for the name
    const encodedHmac = await generateHmacKey(name, this.secrets.hmacKey);
    const iv = getRandomBytes(12);

    // Encrypt combined data using AES-GCM
    const encryptedValue = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      this.secrets.aesKey,
      combinedData
    );

    this.data[encodedHmac] = {
      iv: encodeBuffer(iv),
      value: encodeBuffer(encryptedValue),
    };

    console.log(`Password for ${name} set successfully`);
  }

  // Method to retrieve a password for a specific domain
  async get(name) {
    const encodedHmac = await generateHmacKey(name, this.secrets.hmacKey);
    const record = this.data[encodedHmac];
    if (!record) {
      console.log(`Password for ${name} not found`);
      return null;
    }

    const iv = decodeBuffer(record.iv);
    const encryptedValue = decodeBuffer(record.value);

    try {
      const decryptedValueBuffer = await subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        this.secrets.aesKey,
        encryptedValue
      );

      // Separate decrypted data into name and value parts
      const decryptedData = new Uint8Array(decryptedValueBuffer);
      const retrievedName = bufferToString(decryptedData.slice(0, name.length));
      const retrievedValue = bufferToString(decryptedData.slice(name.length));

      // Verify that the domain matches
      if (retrievedName !== name) {
        console.error("Swap attack detected: domain name mismatch.");
        return null;
      }

      console.log(`Password for ${name} retrieved successfully`);
      return retrievedValue;
    } catch (error) {
      console.error(`Failed to decrypt the password for ${name}:`, error);
      return null;
    }
  }

  // Method to remove a password entry for a specific domain
  async remove(name) {
    const encodedHmac = await generateHmacKey(name, this.secrets.hmacKey);

    if (this.data[encodedHmac]) {
      delete this.data[encodedHmac];
      console.log(`Password for ${name} removed successfully`);
      return true;
    } else {
      console.log(`No password found for ${name}`);
      return false;
    }
  }

// Method to dump the keychain data for backup
async dump() {
  const kvsObject = { kvs: this.data }; // Wrap data in a `kvs` object
  const kvsString = JSON.stringify(kvsObject);
  const kvsBuffer = stringToBuffer(kvsString);

  const checksumBuffer = await subtle.digest("SHA-256", kvsBuffer);
  const checksum = encodeBuffer(checksumBuffer);

  console.log("Data dumped successfully");
  return [kvsString, checksum, this.secrets.salt];
}

 // Static method to load keychain data and verify integrity
 static async load(password, repr, trustedDataCheck = null, salt) {
  const kvsBuffer = stringToBuffer(repr);

  // Verify checksum if provided
  if (trustedDataCheck) {
    const computedChecksumBuffer = await subtle.digest("SHA-256", kvsBuffer);
    const computedChecksum = encodeBuffer(computedChecksumBuffer);

    if (computedChecksum !== trustedDataCheck) {
      throw new Error("Data integrity check failed: checksum mismatch.");
    }
  }

  // Verify checksum if provided
  if (trustedDataCheck) {
    const computedChecksumBuffer = await subtle.digest("SHA-256", kvsBuffer);
    const computedChecksum = encodeBuffer(computedChecksumBuffer);

    if (computedChecksum !== trustedDataCheck) {
      throw new Error("Data integrity check failed: checksum mismatch.");
    }
  }

  const parsedData = JSON.parse(repr);

  // Ensure the parsed data includes the `kvs` key
  if (!parsedData.kvs) {
    throw new Error("Invalid data format: 'kvs' key is missing");
  }

  const keychain = await Keychain.init(password, salt);
  keychain.data = parsedData.kvs;

  console.log("Data loaded successfully");
  return keychain;
}

}

module.exports = { Keychain };
