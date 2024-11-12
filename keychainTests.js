const { Keychain } = require('./password-manager');

async function testInitialization() {
  console.log("Running: testInitialization");
  const pm = await Keychain.init("master-password");
  console.assert(pm instanceof Keychain, "Initialization failed - pm is not an instance of Keychain");
  console.log("testInitialization passed.");
}

async function testSetAndRetrievePassword() {
  console.log("Running: testSetAndRetrievePassword");
  const pm = await Keychain.init("master-password");
  await pm.set("example.com", "securePassword123");

  const retrieved = await pm.get("example.com");
  console.assert(retrieved === "securePassword123", "Password retrieval failed");
  console.log("testSetAndRetrievePassword passed.");
}

async function testRemovePassword() {
  console.log("Running: testRemovePassword");
  const pm = await Keychain.init("master-password");
  await pm.set("example.com", "securePassword123");

  const removed = await pm.remove("example.com");
  console.assert(removed === true, "Password removal failed");

  const retrieved = await pm.get("example.com");
  console.assert(retrieved === null, "Password was not removed successfully");

  console.log("testRemovePassword passed.");
}

async function testDumpAndLoadConsistency() {
  console.log("Running: testDumpAndLoadConsistency");
  const pm = await Keychain.init("master-password");
  await pm.set("example.com", "securePassword123");

  const [dumpedData, checksum, salt] = await pm.dump();
  
  // Verify that the dumped data includes the `kvs` key
  const parsedData = JSON.parse(dumpedData);
  console.assert(parsedData.kvs, "Dumped data is missing the 'kvs' key");

  const pmLoaded = await Keychain.load("master-password", dumpedData, checksum, salt);

  const retrieved = await pmLoaded.get("example.com");
  console.assert(retrieved === "securePassword123", "Data consistency failed after load");
  console.log("testDumpAndLoadConsistency passed.");
}


async function testChecksumVerification() {
  console.log("Running: testChecksumVerification");
  const pm = await Keychain.init("master-password");
  await pm.set("example.com", "securePassword123");

  const [dumpedData, checksum, salt] = await pm.dump();

  // Tamper with checksum to simulate data corruption
  const tamperedChecksum = checksum.replace(/.$/, checksum.slice(-1) === 'A' ? 'B' : 'A');

  try {
    await Keychain.load("master-password", dumpedData, tamperedChecksum, salt);
    console.assert(false, "Checksum verification failed - tampered data was loaded");
  } catch (error) {
    console.log("Checksum verification passed - tampered data was not loaded.");
  }
}

// async function testSwapAttackProtection() {
//   console.log("Running: testSwapAttackProtection");
//   const pm = await Keychain.init("master-password");
//   await pm.set("example.com", "securePassword123");
//   await pm.set("test.com", "anotherPassword456");

//   const [dumpedData, checksum, salt] = await pm.dump();

//   const dataObj = JSON.parse(dumpedData);
//   const keys = Object.keys(dataObj);
//   if (keys.length >= 2) {
//     // Swap entries manually to simulate a swap attack
//     const temp = dataObj[keys[0]];
//     dataObj[keys[0]] = dataObj[keys[1]];
//     dataObj[keys[1]] = temp;
//   }
//   const swappedData = JSON.stringify(dataObj);

//   const pmLoaded = await Keychain.load("master-password", swappedData, checksum, salt);

//   const retrievedExample = await pmLoaded.get("example.com");
//   const retrievedTest = await pmLoaded.get("test.com");

//   console.assert(retrievedExample === null, "Swap attack protection failed for example.com");
//   console.assert(retrievedTest === null, "Swap attack protection failed for test.com");

//   console.log("testSwapAttackProtection passed.");
// }

// Incorrect Password 

async function testLoadWithIncorrectPassword() {
  console.log("Running: testLoadWithIncorrectPassword");
  const correctPassword = "master-password";
  const wrongPassword = "wrong-password";

  const pm = await Keychain.init(correctPassword);
  const [dumpedData, checksum, salt] = await pm.dump();

  try {
    // Attempt to load with the wrong password
    await Keychain.load(wrongPassword, dumpedData, checksum, salt);
    console.assert(false, "Expected an error when loading with the incorrect password, but it succeeded");
  } catch (error) {
    console.log("Error as expected:", error.message);
    // Check that the error message is related to the incorrect password
    console.assert(error.message.includes("Invalid password") || error.message.includes("Data integrity check failed"), "Unexpected error message");
  }

  console.log("testLoadWithIncorrectPassword passed.");
}

async function testSwapAttackProtection() {
  console.log("Running: testSwapAttackProtection");
  const pm = await Keychain.init("master-password");
  await pm.set("example.com", "securePassword123");
  await pm.set("test.com", "anotherPassword456");

  const [dumpedData, checksum, salt] = await pm.dump();

  const dataObj = JSON.parse(dumpedData);
  console.assert(dataObj.kvs, "Dumped data is missing the 'kvs' key");

  const keys = Object.keys(dataObj.kvs);
  if (keys.length >= 2) {
    // Swap entries manually to simulate a swap attack
    const temp = dataObj.kvs[keys[0]];
    dataObj.kvs[keys[0]] = dataObj.kvs[keys[1]];
    dataObj.kvs[keys[1]] = temp;
  }

  const swappedData = JSON.stringify(dataObj);

  // Load swapped data with checksum verification temporarily disabled
  const pmLoaded = await Keychain.load("master-password", swappedData, null, salt); // Use null for checksum

  const retrievedExample = await pmLoaded.get("example.com");
  const retrievedTest = await pmLoaded.get("test.com");

  console.assert(retrievedExample === null, "Swap attack protection failed for example.com");
  console.assert(retrievedTest === null, "Swap attack protection failed for test.com");

  console.log("testSwapAttackProtection passed.");
}

  
// Run all tests
(async () => {
  await testInitialization();
  await testSetAndRetrievePassword();
  await testRemovePassword();
  await testDumpAndLoadConsistency();
  await testChecksumVerification();
  await testLoadWithIncorrectPassword();
  await testSwapAttackProtection();
  console.log("All tests completed.");
})();
