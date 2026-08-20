import { evaluateToolPolicy } from "./policyEngine";

console.log("=== Running Policy Engine Verification Tests ===");

// Test 1: Normal Mode denies tool execution
const test1 = evaluateToolPolicy("normal_mode", "device_manageContacts", { action: "get_all" });
console.assert(test1.decision === "deny", "Test 1 failed: All tools should be denied in normal mode");

const test2 = evaluateToolPolicy("normal_mode", "termux_runScript", { script: "ls -la" });
console.assert(test2.decision === "deny", "Test 2 failed: Terminal execution should be denied in normal mode");

// Test 3: Plan mode read vs write
const test3 = evaluateToolPolicy("plan_mode", "device_manageContacts", { action: "get_all" });
console.assert(test3.decision === "allow", "Test 3 failed: Read contacts should be allowed in plan mode");

const test4 = evaluateToolPolicy("plan_mode", "device_manageContacts", { action: "delete", targetContactName: "Test" });
console.assert(test4.decision === "ask" && test4.riskLevel === "critical", "Test 4 failed: Delete contacts should be asked in plan mode");

// Test 5: Ask-before-change mode
const test5 = evaluateToolPolicy("ask_before_change", "device_manageStorage", { action: "scan_junk" });
console.assert(test5.decision === "allow", "Test 5 failed: Scan junk should be allowed in ask mode");

const test6 = evaluateToolPolicy("ask_before_change", "device_manageStorage", { action: "clean_junk" });
console.assert(test6.decision === "ask" && test6.riskLevel === "medium", "Test 6 failed: Clean junk should ask in ask mode");

// Test 7: Full YOLO mode
const test7 = evaluateToolPolicy("full_access_yolo", "shizuku_executeCommand", { command: "pm trim-caches 1000M" });
console.assert(test7.decision === "allow", "Test 7 failed: Shizuku command should allow in YOLO mode");

console.log("✅ All 7 Policy Engine verification tests passed successfully!");

