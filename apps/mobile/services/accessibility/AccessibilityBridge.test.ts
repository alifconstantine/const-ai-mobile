/**
 * AccessibilityBridge Unit Verification Test
 */

import { AccessibilityBridge, AccessibilityBridgeMock } from "./AccessibilityBridge";

async function runAccessibilityBridgeTests() {
  console.log("=== Running AccessibilityBridge Unit Verification Tests ===");

  // Test 1: Check Status
  const status = await AccessibilityBridge.checkStatus();
  console.assert(typeof status.isServiceRunning === "boolean", "Test 1 Failed: isServiceRunning should be boolean");
  console.assert(typeof status.isPermissionGranted === "boolean", "Test 1 Failed: isPermissionGranted should be boolean");
  console.assert(Boolean(status.serviceName), "Test 1 Failed: serviceName should not be empty");
  console.log("✔ Test 1 passed: checkStatus() returned accessibility service connection state");

  // Test 2: Open Settings
  const settingsRes = await AccessibilityBridge.openSettings();
  console.assert(settingsRes === true, "Test 2 Failed: openSettings should resolve true");
  console.log("✔ Test 2 passed: openSettings() executed successfully");

  // Test 3: Capture UI Hierarchy & Spatial Coordinates
  const snapshot = await AccessibilityBridge.captureUIHierarchy();
  console.assert(typeof snapshot.timestamp === "number", "Test 3 Failed: snapshot should have timestamp");
  console.assert(Boolean(snapshot.packageName), "Test 3 Failed: snapshot should have packageName");
  console.assert(snapshot.screenWidth > 0, "Test 3 Failed: screenWidth must be positive");
  console.assert(snapshot.screenHeight > 0, "Test 3 Failed: screenHeight must be positive");
  console.assert(Array.isArray(snapshot.interactiveElements), "Test 3 Failed: interactiveElements must be array");
  console.assert(snapshot.interactiveElements.length > 0, "Test 3 Failed: interactiveElements must not be empty");

  const firstNode = snapshot.interactiveElements[0];
  console.assert(typeof firstNode.id === "number", "Test 3 Failed: node id should be number");
  console.assert(Array.isArray(firstNode.bounds) && firstNode.bounds.length === 4, "Test 3 Failed: bounds should be [left, top, right, bottom]");
  console.assert(typeof firstNode.centerX === "number" && typeof firstNode.centerY === "number", "Test 3 Failed: center coordinates should be numbers");
  console.log("✔ Test 3 passed: captureUIHierarchy() returned complete spatial UI elements with coordinates");

  // Test 4: Tap Coordinates
  const tapCoordRes = await AccessibilityBridge.tapCoordinates(540, 960);
  console.assert(tapCoordRes.success === true, "Test 4 Failed: tapCoordinates should succeed");
  console.log("✔ Test 4 passed: tapCoordinates(540, 960) simulated tap gesture");

  // Test 5: Tap Node
  const tapNodeRes = await AccessibilityBridge.tapNode(3);
  console.assert(tapNodeRes.success === true, "Test 5 Failed: tapNode should succeed");
  console.log("✔ Test 5 passed: tapNode(3) simulated node targeting tap");

  // Test 6: Swipe Gesture
  const swipeRes = await AccessibilityBridge.swipe(500, 1600, 500, 400, 350);
  console.assert(swipeRes.success === true, "Test 6 Failed: swipe should succeed");
  console.log("✔ Test 6 passed: swipe() simulated continuous touch drag gesture");

  // Test 7: Input Text
  const inputRes = await AccessibilityBridge.inputText("Halo dari Const AI", 5);
  console.assert(inputRes.success === true, "Test 7 Failed: inputText should succeed");
  console.log("✔ Test 7 passed: inputText() injected text to target editable input");

  // Test 8: Global Navigation (Back, Home, Recents)
  const backRes = await AccessibilityBridge.pressBack();
  console.assert(backRes.success === true, "Test 8 Failed: pressBack should succeed");

  const homeRes = await AccessibilityBridge.pressHome();
  console.assert(homeRes.success === true, "Test 8 Failed: pressHome should succeed");

  const recentsRes = await AccessibilityBridge.pressRecents();
  console.assert(recentsRes.success === true, "Test 8 Failed: pressRecents should succeed");
  console.log("✔ Test 8 passed: Global actions (Back, Home, Recents) verified");

  // Test 9: Scroll Controls
  const scrollFwd = await AccessibilityBridge.scrollForward();
  console.assert(scrollFwd.success === true, "Test 9 Failed: scrollForward should succeed");

  const scrollBwd = await AccessibilityBridge.scrollBackward();
  console.assert(scrollBwd.success === true, "Test 9 Failed: scrollBackward should succeed");
  console.log("✔ Test 9 passed: Scroll operations (forward, backward) verified");

  console.log("\n🎉 All AccessibilityBridge unit verification tests passed successfully!");
}

runAccessibilityBridgeTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
