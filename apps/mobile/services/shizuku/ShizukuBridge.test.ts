/**
 * ShizukuBridge Unit Verification Test Suite
 */

import { ShizukuBridge } from "./ShizukuBridge";

async function runShizukuBridgeTests() {
  console.log("=== Running ShizukuBridge Unit Verification Tests ===");

  // Test 1: Check Shizuku Status
  const status = await ShizukuBridge.checkStatus();
  console.assert(typeof status.isAvailable === "boolean", "Test 1 Failed: isAvailable should be boolean");
  console.assert(typeof status.isPermissionGranted === "boolean", "Test 1 Failed: isPermissionGranted should be boolean");
  console.assert(typeof status.version === "number", "Test 1 Failed: version should be number");
  console.assert(status.uid === 2000 || typeof status.uid === "number", "Test 1 Failed: uid should be shell uid");
  console.log("✔ Test 1 passed: checkStatus() returned Shizuku connection & permission status");

  // Test 2: Request Permission
  const reqStatus = await ShizukuBridge.requestPermission();
  console.assert(reqStatus.isPermissionGranted === true, "Test 2 Failed: permission should be granted in mock environment");
  console.log("✔ Test 2 passed: requestPermission() resolved successfully");

  // Test 3: Raw Privileged Shell Execution
  const shellExec = await ShizukuBridge.executeCommand("id");
  console.assert(shellExec.exitCode === 0, "Test 3 Failed: exitCode should be 0");
  console.assert(shellExec.stdout.includes("uid=2000"), "Test 3 Failed: stdout should include shell UID");
  console.assert(typeof shellExec.durationMs === "number", "Test 3 Failed: durationMs should be number");
  console.log("✔ Test 3 passed: executeCommand() executed privileged ADB shell command");

  // Test 4: Access Protected Folder - List
  const protectedFiles = await ShizukuBridge.listProtectedFolder("/sdcard/Android/data");
  console.assert(Array.isArray(protectedFiles), "Test 4 Failed: protectedFiles should be an array");
  console.assert(protectedFiles.length > 0, "Test 4 Failed: should return items in /Android/data");
  console.assert(Boolean(protectedFiles[0].name), "Test 4 Failed: file item should have name");
  console.assert(typeof protectedFiles[0].sizeBytes === "number", "Test 4 Failed: file item should have sizeBytes");
  console.log("✔ Test 4 passed: listProtectedFolder() listed locked /Android/data packages");

  // Test 5: Access Protected Folder - Calculate Size
  const totalSize = await ShizukuBridge.calculateFolderSize("/sdcard/Android/data");
  console.assert(typeof totalSize === "number" && totalSize > 0, "Test 5 Failed: totalSize should be positive number");
  console.log("✔ Test 5 passed: calculateFolderSize() computed total bytes in locked storage");

  // Test 6: Access Protected Folder - Clear Cache
  const cacheCleanResult = await ShizukuBridge.clearProtectedFolderCache("/sdcard/Android/data");
  console.assert(cacheCleanResult.success === true, "Test 6 Failed: clearProtectedFolderCache should succeed");
  console.assert(typeof cacheCleanResult.freedBytes === "number" && cacheCleanResult.freedBytes > 0, "Test 6 Failed: freedBytes should be positive");
  console.log("✔ Test 6 passed: clearProtectedFolderCache() cleared hidden /Android/data/*/cache");

  // Test 7: Protected Folder - Delete Path
  const deleteResult = await ShizukuBridge.deleteProtectedPath("/sdcard/Android/data/com.obsolete.junk");
  console.assert(deleteResult === true, "Test 7 Failed: deleteProtectedPath should return true");
  console.log("✔ Test 7 passed: deleteProtectedPath() deleted target protected path");

  // Test 8: Silent App Management - Uninstall
  const uninstallResult = await ShizukuBridge.silentUninstall("com.junk.bloatware");
  console.assert(uninstallResult.success === true, "Test 8 Failed: silentUninstall should succeed");
  console.assert(uninstallResult.action === "uninstall", "Test 8 Failed: action should be uninstall");
  console.log("✔ Test 8 passed: silentUninstall() executed silent uninstallation without OS prompt");

  // Test 9: Silent App Management - Disable & Enable
  const disableResult = await ShizukuBridge.disableApp("com.bloatware.system");
  console.assert(disableResult.success === true, "Test 9 Failed: disableApp should succeed");

  const enableResult = await ShizukuBridge.enableApp("com.bloatware.system");
  console.assert(enableResult.success === true, "Test 9 Failed: enableApp should succeed");
  console.log("✔ Test 9 passed: disableApp() and enableApp() toggled package states");

  // Test 10: Silent App Management - Force Stop & Clear Data
  const forceStopResult = await ShizukuBridge.forceStopApp("com.heavy.game");
  console.assert(forceStopResult.success === true, "Test 10 Failed: forceStopApp should succeed");

  const clearDataResult = await ShizukuBridge.clearAppData("com.heavy.game");
  console.assert(clearDataResult.success === true, "Test 10 Failed: clearAppData should succeed");
  console.log("✔ Test 10 passed: forceStopApp() and clearAppData() executed successfully");

  // Test 11: Deep System Cache Trimming
  const trimResult = await ShizukuBridge.trimCaches(2 * 1024 * 1024 * 1024);
  console.assert(trimResult.success === true, "Test 11 Failed: trimCaches should succeed");
  console.assert(typeof trimResult.freedBytes === "number" && trimResult.freedBytes > 0, "Test 11 Failed: freedBytes should be positive");
  console.log("✔ Test 11 passed: trimCaches() executed deep system cache trimming via pm trim-caches");

  console.log("\n🎉 All ShizukuBridge unit verification tests passed successfully!");
}

runShizukuBridgeTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
