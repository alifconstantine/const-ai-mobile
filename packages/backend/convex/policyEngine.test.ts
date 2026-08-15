import { evaluateToolPolicy, classifyToolRisk } from "./policyEngine";

console.log("=== Running Policy Engine Verification Tests ===");

// Test 1: Plan mode read vs write
const test1 = evaluateToolPolicy("plan_mode", "device_manageContacts", { action: "get_all" });
console.assert(test1.decision === "allow", "Test 1 failed: Read contacts should be allowed in plan mode");

const test2 = evaluateToolPolicy("plan_mode", "device_manageContacts", { action: "delete", targetContactName: "Test" });
console.assert(test2.decision === "ask" && test2.riskLevel === "critical", "Test 2 failed: Delete contacts should be asked in plan mode");

// Test 3: Ask-before-change mode
const test3 = evaluateToolPolicy("ask_before_change", "device_manageStorage", { action: "scan_junk" });
console.assert(test3.decision === "allow", "Test 3 failed: Scan junk should be allowed in ask mode");

const test4 = evaluateToolPolicy("ask_before_change", "device_manageStorage", { action: "clean_junk" });
console.assert(test4.decision === "ask" && test4.riskLevel === "medium", "Test 4 failed: Clean junk should ask in ask mode");

// Test 5: Edit automatically mode
const test5 = evaluateToolPolicy("edit_automatically", "device_manageStorage", { action: "clean_junk" });
console.assert(test5.decision === "allow", "Test 5 failed: Clean junk should auto-execute in edit mode");

const test6 = evaluateToolPolicy("edit_automatically", "device_manageApps", { action: "uninstall", packageName: "com.test" });
console.assert(test6.decision === "ask" && test6.riskLevel === "critical", "Test 6 failed: Uninstall app should ask even in edit mode");

// Test 7: Full YOLO mode
const test7 = evaluateToolPolicy("full_access_yolo", "shizuku_executeCommand", { command: "pm trim-caches 1000M" });
console.assert(test7.decision === "allow", "Test 7 failed: Shizuku command should allow in YOLO mode");

console.log("✅ All 7 Policy Engine verification tests passed successfully!");
