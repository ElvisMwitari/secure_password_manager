const { Keychain } = require('./password-manager');

(async () => {
  const pm = await Keychain.init("your-master-password");

  // Set a password
  await pm.set("example.com", "securePassword123");

  // Dump the data
  const [dumpedData, checksum, salt] = await pm.dump();
  console.log("Dumped Data:", dumpedData);
  console.log("Checksum:", checksum);
  console.log("Salt:", salt);

  // Load the data into a new Keychain instance with the same salt
  const pmLoaded = await Keychain.load("your-master-password", dumpedData, checksum, salt);
  const retrievedPassword = await pmLoaded.get("example.com");
  console.log("Retrieved after load:", retrievedPassword); // Should output: "securePassword123"
})();
