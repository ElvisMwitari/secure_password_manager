const { Keychain } = require('./password-manager');

async function simpleAsyncTest() {
  console.log("Running: simpleAsyncTest");
  try {
    // Initialize the keychain
    const pm = await Keychain.init("master-password");

    // Set a password
    await pm.set("testsite.com", "password123");
    console.log("Password set successfully.");

    // Retrieve the password
    const retrieved = await pm.get("testsite.com");
    console.assert(retrieved === "password123", "Password retrieval failed");
    console.log("Password retrieved successfully:", retrieved);

    // Remove the password
    const removed = await pm.remove("testsite.com");
    console.assert(removed === true, "Password removal failed");
    console.log("Password removed successfully.");

    // Try to retrieve the removed password
    const shouldBeNull = await pm.get("testsite.com");
    console.assert(shouldBeNull === null, "Password was not removed properly");
    console.log("Verified password removal.");

    return "Async test with Keychain operations successful!";
  } catch (error) {
    console.error("Error during async test:", error);
    return "Async test failed!";
  }
}

simpleAsyncTest().then(console.log);
