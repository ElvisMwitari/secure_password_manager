

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
