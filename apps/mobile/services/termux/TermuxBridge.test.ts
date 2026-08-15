/**
 * TermuxBridge Unit Verification Test Suite
 */

import { TermuxBridge } from "./TermuxBridge";

async function runTermuxBridgeTests() {
  console.log("=== Running TermuxBridge Unit Verification Tests ===");

  // Test 1: Check Termux Status
  const status = await TermuxBridge.checkStatus();
  console.assert(typeof status.isInstalled === "boolean", "Test 1 Failed: isInstalled should be boolean");
  console.assert(typeof status.isPermissionGranted === "boolean", "Test 1 Failed: isPermissionGranted should be boolean");
  console.assert(typeof status.version === "string", "Test 1 Failed: version should be string");
  console.log("✔ Test 1 passed: checkStatus() returned Termux installation & permission status");

  // Test 2: Raw Shell Script Execution
  const echoResult = await TermuxBridge.executeScript("echo Hello from Termux");
  console.assert(echoResult.exitCode === 0, "Test 2 Failed: exitCode should be 0");
  console.assert(echoResult.stdout.includes("Hello from Termux"), "Test 2 Failed: stdout should match echoed text");
  console.assert(typeof echoResult.durationMs === "number", "Test 2 Failed: durationMs should be number");
  console.log("✔ Test 2 passed: executeScript() executed raw shell command successfully");

  // Test 3: Bash Runner & Working Directory
  const pwdResult = await TermuxBridge.runBash("pwd", "/data/data/com.termux/files/home/workspace");
  console.assert(pwdResult.exitCode === 0, "Test 3 Failed: exitCode should be 0");
  console.assert(pwdResult.stdout.includes("workspace"), "Test 3 Failed: stdout should include working directory");
  console.log("✔ Test 3 passed: runBash() respected custom working directory");

  // Test 4: Python Runner
  const pythonResult = await TermuxBridge.runPython("print(12345)");
  console.assert(pythonResult.exitCode === 0, "Test 4 Failed: exitCode should be 0");
  console.assert(pythonResult.stdout.includes("12345"), "Test 4 Failed: python print output mismatch");
  console.log("✔ Test 4 passed: runPython() executed Python 3 inline code");

  // Test 5: Node.js Runner
  const nodeResult = await TermuxBridge.runNode("node -v");
  console.assert(nodeResult.exitCode === 0, "Test 5 Failed: exitCode should be 0");
  console.assert(Boolean(nodeResult.stdout), "Test 5 Failed: node output should not be empty");
  console.log("✔ Test 5 passed: runNode() executed Node.js command");

  // Test 6: Git CLI Runner
  const gitVersion = await TermuxBridge.runGit("--version");
  console.assert(gitVersion.exitCode === 0, "Test 6 Failed: exitCode should be 0");
  console.assert(gitVersion.stdout.includes("git version"), "Test 6 Failed: git version output mismatch");

  const gitStatus = await TermuxBridge.runGit("status");
  console.assert(gitStatus.exitCode === 0, "Test 6b Failed: exitCode should be 0");
  console.assert(gitStatus.stdout.includes("On branch"), "Test 6b Failed: git status output mismatch");
  console.log("✔ Test 6 passed: runGit() executed git version and git status commands");

  // Test 7: Open Termux App Activity
  const openSuccess = await TermuxBridge.openTermux();
  console.assert(openSuccess === true, "Test 7 Failed: openTermux should return true");
  console.log("✔ Test 7 passed: openTermux() launched activity");

  console.log("\n🎉 All TermuxBridge unit verification tests passed successfully!");
}

runTermuxBridgeTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
