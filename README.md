

# Secure Password Manager - CS255 Project

This project is a secure password manager developed as part of the CS255 Computer Security and Cryptography course. The password manager enables secure storage, retrieval, and management of encrypted passwords and includes protection against data tampering and swap attacks.



## Features

- **Secure Key Derivation**: Uses PBKDF2 with a salt and master password for secure key generation.
- **HMAC-Based Integrity**: Ensures each password entry is bound to its associated domain name, mitigating swap attacks.
- **AES-GCM Encryption**: Encrypts each password entry to maintain confidentiality and integrity.
- **Checksum Verification**: Validates data integrity upon loading with SHA-256 checksum verification.
- **Swap Attack Protection**: Prevents unauthorized access to swapped password entries by verifying the domain name post-decryption.

## Installation

### Requirements

- **Node.js** v18.20.4 or higher
- **npm** (Node Package Manager)

### Steps

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/ElvisMwitari/secure_password_manager.git
    cd secure_password_manager
    ```

2. **Install Dependencies**:

    ```bash
    npm install
    ```

    This will install the following dependencies:
    - **expect.js**: Assertion library used for testing.
    - **Mocha**: JavaScript test framework to run unit tests.

## Usage

### Initialization

Create an instance of the password manager using a master password:

```javascript
const { Keychain } = require('./password-manager');
const keychain = await Keychain.init("your-master-password");
```

### Setting and Retrieving Passwords

- **Set a Password**:

    ```javascript
    await keychain.set("example.com", "securePassword123");
    ```

- **Retrieve a Password**:

    ```javascript
    const password = await keychain.get("example.com");
    console.log(password); // Outputs: "securePassword123"
    ```

### Removing a Password

Remove a password entry for a specific domain:

```javascript
await keychain.remove("example.com");
```

### Data Backup and Restore

- **Dump the Data** to create a backup:

    ```javascript
    const [data, checksum, salt] = await keychain.dump();
    ```

- **Load the Data** to restore a previous state:

    ```javascript
    const keychain = await Keychain.load("your-master-password", data, checksum, salt);
    ```

## Testing

The project includes a test suite written with Mocha and Expect.js to verify functionality and security.

### Run the Tests

Run the test suite using the command:

```bash
npm test
# minor tests
# For testPasswordManager.js
node testPasswordManager.js

# For keychainTests.js
node keychainTests.js

# For testAsync.js
node testAsync.js
```

This runs `keychainTests.js`, which includes tests for:

- **Initialization**: Checks successful password manager initialization.
- **Set and Retrieve Password**: Validates password storage and retrieval.
- **Remove Password**: Verifies password entries can be removed.
- **Dump and Load Consistency**: Ensures data consistency across sessions.
- **Checksum Verification**: Prevents loading of tampered data.
- **Swap Attack Protection**: Ensures swapped entries are not accessible.

## License

This project is licensed under the **ISC License**. The ISC License is a permissive license that allows for reuse, modification, and distribution with minimal restrictions. See `LICENSE` for the full text.

## Project Structure

- **`password-manager.js`**: Main implementation of the Keychain class, containing methods for password management, encryption, integrity checks, and tamper resistance.
- **`keychainTests.js`**: Test suite with Mocha and Expect.js to verify functionality and security protections.
- **`lib.js`**: Helper functions for data conversion, random byte generation, and cryptographic operations.

## Security Overview

This password manager employs several security mechanisms:

- **PBKDF2 with Salt**: Unique salt per instance for secure key derivation, mitigating brute-force attacks.
- **HMAC Binding**: Each password entry is bound to its domain, preventing unauthorized access due to entry swaps.
- **AES-GCM Encryption**: Provides confidentiality and integrity for stored passwords.
- **SHA-256 Checksum Verification**: Ensures data integrity during loading, preventing data tampering.

## Future Improvements

- **User Interface**: Extend the project to include a CLI or web interface.
- **Advanced Encryption Options**: Support additional encryption algorithms for flexibility.
- **Enhanced Testing**: Expand the test suite to cover more edge cases and potential vulnerabilities.

---
### Short Answer Section

**Preventing Information Leakage on Password Lengths.**
To prevent the adversary from learning password lengths, we used AES-GCM encryption. The encryption output includes a fixed-size tag and an IV, making it difficult for an adversary to deduce the length of the underlying plaintext.

**Preventing Swap Attacks.**
We prevented swap attacks by including the domain name in the data that is encrypted and verifying it after decryption. If entries were swapped, the decrypted domain would not match the expected domain, causing the retrieval to fail. This design ensures that each entry is uniquely bound to its respective domain, making it infeasible for an attacker to rearrange entries without detection.

**Necessity of a Trusted Location for Checksum Storage.**
Yes, a trusted location is necessary to securely store the SHA-256 checksum for rollback attack prevention. Without a trusted location, an adversary could replace the stored data and the checksum together, bypassing the rollback protection by reverting both to a previous state. The trusted location ensures the checksum cannot be tampered with, preserving data integrity.

**Using a Randomized MAC Instead of HMAC.**
If we used a randomized MAC instead of HMAC, we would no longer be able to reliably use the MAC to look up domain names, as the MAC value would differ each time for the same input. We would need to store additional mappings of each domain to its MAC or perform a sequential scan to find the correct domain, resulting in a performance penalty due to additional storage and lookup costs.

**Reducing Information Leakage on Record Count.**
To reduce leakage about the number of records, we could group records into "buckets" and only reveal the number of non-empty buckets, rather than the exact number of records. For instance, if there are 4 to 7 records, we might represent them within one bucket, leaking only that the number is within this range. This approach ensures that an adversary learns only log2(k) about the actual record count.

**Adding Multi-User Support without Compromising Security.**
Multi-user support can be added by creating separate keys for shared entries. For example, Alice and Bob could each have individual keys for personal entries, while a shared key (derived from a combined secret or managed through a secure key-sharing protocol) could be used for entries like "nytimes" that both users can access. This ensures that shared entries are accessible without compromising the security of other, individually owned entries.
