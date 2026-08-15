/**
 * Const AI Mobile — Termux CLI Intent Bridge Service
 * TypeScript wrapper for running Linux terminal scripts (Bash, Python, Node, Git)
 * inside the Termux Android environment via RunCommandService intent.
 */

import type {
  TermuxCommandArgs,
  TermuxCommandResult,
  TermuxStatus,
} from "@const-ai/types";

// Safe dynamic accessor for React Native native modules (supporting Web, Node, and Test environments)
let NativeTermuxBridge: any = null;
let currentPlatform: string = "web";

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require("react-native");
  if (RN && RN.NativeModules) {
    NativeTermuxBridge = RN.NativeModules.TermuxBridge || null;
  }
  if (RN && RN.Platform) {
    currentPlatform = RN.Platform.OS;
  }
} catch {
  currentPlatform = typeof process !== "undefined" ? "node" : "web";
}

const isAndroidNative = currentPlatform === "android" && Boolean(NativeTermuxBridge);

/**
 * Mock Provider for non-Android environments (Web, Node, Tests, Desktop Companion).
 */
export class TermuxBridgeMock {
  static getMockStatus(): TermuxStatus {
    return {
      isInstalled: true,
      isPermissionGranted: true,
      version: "0.118.0",
    };
  }

  static getMockCommandResult(script: string, workingDir: string = "~"): TermuxCommandResult {
    const trimmed = script.trim();

    // Node.js checks
    if (trimmed === "node -v" || trimmed === "node --version") {
      return {
        exitCode: 0,
        stdout: "v20.11.0",
        stderr: "",
        output: "v20.11.0",
        durationMs: 45,
      };
    }

    // Python checks
    if (trimmed === "python -V" || trimmed === "python3 --version" || trimmed === "python --version") {
      return {
        exitCode: 0,
        stdout: "Python 3.11.7",
        stderr: "",
        output: "Python 3.11.7",
        durationMs: 50,
      };
    }

    // Python inline execution
    if (trimmed.startsWith("python -c ") || trimmed.startsWith("python3 -c ")) {
      const codeMatch = trimmed.match(/-c\s+["'](.*)["']/);
      const code = codeMatch ? codeMatch[1] : "";
      if (code.includes("print(")) {
        const printContent = code.replace(/.*print\((.*)\).*/, "$1").replace(/['"]/g, "");
        return {
          exitCode: 0,
          stdout: printContent,
          stderr: "",
          output: printContent,
          durationMs: 70,
        };
      }
      return {
        exitCode: 0,
        stdout: "Python execution finished successfully",
        stderr: "",
        output: "Python execution finished successfully",
        durationMs: 80,
      };
    }

    // Git checks
    if (trimmed === "git --version") {
      return {
        exitCode: 0,
        stdout: "git version 2.43.0",
        stderr: "",
        output: "git version 2.43.0",
        durationMs: 30,
      };
    }

    if (trimmed.startsWith("git status")) {
      return {
        exitCode: 0,
        stdout: "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean",
        stderr: "",
        output: "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean",
        durationMs: 65,
      };
    }

    // Echo commands
    if (trimmed.startsWith("echo ")) {
      const echoText = trimmed.substring(5).replace(/^["']|["']$/g, "");
      return {
        exitCode: 0,
        stdout: echoText,
        stderr: "",
        output: echoText,
        durationMs: 15,
      };
    }

    // Pwd
    if (trimmed === "pwd") {
      const currentDir = workingDir === "~" ? "/data/data/com.termux/files/home" : workingDir;
      return {
        exitCode: 0,
        stdout: currentDir,
        stderr: "",
        output: currentDir,
        durationMs: 10,
      };
    }

    // List files
    if (trimmed.startsWith("ls")) {
      return {
        exitCode: 0,
        stdout: "projects\nscripts\npackage.json\nREADME.md",
        stderr: "",
        output: "projects\nscripts\npackage.json\nREADME.md",
        durationMs: 25,
      };
    }

    // Default mock response
    return {
      exitCode: 0,
      stdout: `[Termux Mock] Executed: ${script}`,
      stderr: "",
      output: `[Termux Mock] Executed: ${script}`,
      durationMs: 40,
    };
  }
}

/**
 * Main TermuxBridge TypeScript API
 */
export const TermuxBridge = {
  /**
   * Returns whether native Termux module is loaded on Android
   */
  isNativeAvailable(): boolean {
    return isAndroidNative;
  },

  /**
   * Checks if Termux is installed and com.termux.permission.RUN_COMMAND is granted
   */
  async checkStatus(): Promise<TermuxStatus> {
    if (!isAndroidNative) {
      return TermuxBridgeMock.getMockStatus();
    }
    try {
      return await NativeTermuxBridge.checkStatus();
    } catch (e: any) {
      return {
        isInstalled: false,
        isPermissionGranted: false,
        version: "Unknown",
        error: e.message || "Failed to check Termux status",
      };
    }
  },

  /**
   * Executes a shell script via Termux RunCommandService
   */
  async executeScript(args: TermuxCommandArgs | string): Promise<TermuxCommandResult> {
    const parsedArgs: TermuxCommandArgs =
      typeof args === "string" ? { script: args } : args;

    const {
      script,
      workingDir = "/data/data/com.termux/files/home",
      background = true,
      sessionAction = "0",
      timeoutMs = 30000,
    } = parsedArgs;

    if (!isAndroidNative) {
      return TermuxBridgeMock.getMockCommandResult(script, workingDir);
    }

    return await NativeTermuxBridge.executeScript(
      script,
      workingDir,
      background,
      sessionAction,
      timeoutMs
    );
  },

  /**
   * Shortcut to run a standard Bash script
   */
  async runBash(script: string, workingDir?: string): Promise<TermuxCommandResult> {
    return await this.executeScript({
      script,
      workingDir,
      background: true,
    });
  },

  /**
   * Shortcut to execute a Python 3 one-liner or script
   */
  async runPython(code: string, workingDir?: string): Promise<TermuxCommandResult> {
    const escapedCode = code.replace(/'/g, "'\\''");
    return await this.executeScript({
      script: `python3 -c '${escapedCode}'`,
      workingDir,
      background: true,
    });
  },

  /**
   * Shortcut to execute Node.js code
   */
  async runNode(code: string, workingDir?: string): Promise<TermuxCommandResult> {
    const escapedCode = code.replace(/'/g, "'\\''");
    return await this.executeScript({
      script: `node -e '${escapedCode}'`,
      workingDir,
      background: true,
    });
  },

  /**
   * Shortcut to execute Git CLI commands
   */
  async runGit(gitCommand: string, workingDir?: string): Promise<TermuxCommandResult> {
    const fullCmd = gitCommand.startsWith("git ") ? gitCommand : `git ${gitCommand}`;
    return await this.executeScript({
      script: fullCmd,
      workingDir,
      background: true,
    });
  },

  /**
   * Launches the Termux main activity so the user can see terminal interactively
   */
  async openTermux(): Promise<boolean> {
    if (!isAndroidNative) {
      return true;
    }
    return await NativeTermuxBridge.openTermux();
  },
};
