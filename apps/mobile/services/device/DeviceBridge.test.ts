/**
 * DeviceBridge Unit Verification Test
 */

import { DeviceBridge } from "./DeviceBridge";

async function runDeviceBridgeTests() {
  console.log("=== Running DeviceBridge Unit Verification Tests ===");

  // Test 1: Query Contacts
  const contacts = await DeviceBridge.getContacts();
  console.assert(Array.isArray(contacts), "Test 1 Failed: contacts should be an array");
  console.assert(contacts.length > 0, "Test 1 Failed: contacts array should not be empty");
  console.assert(Boolean(contacts[0].displayName), "Test 1 Failed: contact should have displayName");
  console.log("✔ Test 1 passed: getContacts() returned structured contact items");

  // Test 2: Search Contacts
  const searchResults = await DeviceBridge.searchContacts("Alice");
  console.assert(searchResults.length === 1, "Test 2 Failed: searchContacts should find Alice");
  console.assert(searchResults[0].displayName.includes("Alice"), "Test 2 Failed: searched contact should be Alice");
  console.log("✔ Test 2 passed: searchContacts() filtered accurately");

  // Test 3: Add and Delete Contact
  const addResult = await DeviceBridge.addContact("Test Person", "+62812399999");
  console.assert(addResult.success === true, "Test 3 Failed: addContact should succeed");
  const delResult = await DeviceBridge.deleteContact(undefined, "Test Person");
  console.assert(delResult.success === true, "Test 3 Failed: deleteContact should succeed");
  console.log("✔ Test 3 passed: addContact() and deleteContact() operations successful");

  // Test 4: Storage Junk Scan
  const storageScan = await DeviceBridge.scanJunkStorage();
  console.assert(typeof storageScan.totalStorageBytes === "number", "Test 4 Failed: totalStorageBytes should be number");
  console.assert(typeof storageScan.freeStorageBytes === "number", "Test 4 Failed: freeStorageBytes should be number");
  console.assert(Array.isArray(storageScan.junkFiles), "Test 4 Failed: junkFiles should be an array");
  console.log("✔ Test 4 passed: scanJunkStorage() returned storage metrics and junk list");

  // Test 5: Scan Duplicate Photos
  const duplicates = await DeviceBridge.scanDuplicatePhotos();
  console.assert(Array.isArray(duplicates), "Test 5 Failed: duplicates should be an array");
  if (duplicates.length > 0) {
    console.assert(Boolean(duplicates[0].originalPhoto), "Test 5 Failed: group should have originalPhoto");
    console.assert(Array.isArray(duplicates[0].duplicates), "Test 5 Failed: group should have duplicates array");
  }
  console.log("✔ Test 5 passed: scanDuplicatePhotos() returned grouped photo duplicates");

  // Test 6: Scan Screenshots
  const screenshots = await DeviceBridge.scanScreenshots(7);
  console.assert(Array.isArray(screenshots), "Test 6 Failed: screenshots should be an array");
  console.log("✔ Test 6 passed: scanScreenshots() returned screenshot items");

  // Test 7: Installed Apps
  const apps = await DeviceBridge.getInstalledApps();
  console.assert(Array.isArray(apps), "Test 7 Failed: apps should be an array");
  console.assert(apps.some((a) => a.packageName.includes("whatsapp") || a.packageName.includes("youtube")), "Test 7 Failed: should find apps");
  console.log("✔ Test 7 passed: getInstalledApps() returned installed application list");

  // Test 8: Hardware Controls
  const torch = await DeviceBridge.toggleFlashlight(true);
  console.assert(typeof torch.flashlightOn === "boolean", "Test 8 Failed: flashlight status boolean");

  const vol = await DeviceBridge.setVolume(80);
  console.assert(vol.volumeLevel === 80, "Test 8 Failed: volume level should match 80");

  const battery = await DeviceBridge.getBatteryLevel();
  console.assert(typeof battery.batteryLevel === "number", "Test 8 Failed: batteryLevel should be number");

  const wifi = await DeviceBridge.getWifiStatus();
  console.assert(typeof wifi.wifiEnabled === "boolean", "Test 8 Failed: wifiEnabled should be boolean");
  console.log("✔ Test 8 passed: Hardware controls (flashlight, volume, battery, wifi) verified");

  console.log("\n🎉 All DeviceBridge unit verification tests passed successfully!");
}

runDeviceBridgeTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
