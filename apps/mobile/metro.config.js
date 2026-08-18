const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Resolve Clerk and subpackage exports as CommonJS for Metro bundler
const clerkReactPkg = path.dirname(require.resolve("@clerk/react/package.json"));
const clerkSharedPkg = path.dirname(require.resolve("@clerk/shared/package.json"));
const clerkExpoPkg = path.dirname(require.resolve("@clerk/expo/package.json"));

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @clerk/react subpaths - prioritize CJS (.cjs / .js) to avoid ESM scope mismatch
  if (moduleName.startsWith("@clerk/react/")) {
    const subpath = moduleName.replace("@clerk/react/", "");
    const candidates = [
      path.join(clerkReactPkg, `dist/${subpath}.cjs`),
      path.join(clerkReactPkg, `dist/${subpath}.js`),
      path.join(clerkReactPkg, `dist/${subpath}/index.cjs`),
      path.join(clerkReactPkg, `dist/${subpath}/index.js`),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return {
          filePath: candidate,
          type: "sourceFile",
        };
      }
    }
  }

  // Handle @clerk/shared subpaths - prioritize CJS (.js / .cjs)
  if (moduleName.startsWith("@clerk/shared/")) {
    const subpath = moduleName.replace("@clerk/shared/", "");
    const candidates = [
      path.join(clerkSharedPkg, `dist/${subpath}.js`),
      path.join(clerkSharedPkg, `dist/${subpath}.cjs`),
      path.join(clerkSharedPkg, `dist/${subpath}/index.js`),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return {
          filePath: candidate,
          type: "sourceFile",
        };
      }
    }
  }

  // Handle @clerk/expo subpaths
  if (moduleName.startsWith("@clerk/expo/")) {
    const subpath = moduleName.replace("@clerk/expo/", "");
    const candidates = [
      path.join(clerkExpoPkg, `dist/${subpath}.js`),
      path.join(clerkExpoPkg, `dist/${subpath}/index.js`),
      path.join(clerkExpoPkg, `dist/${subpath}.cjs`),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return {
          filePath: candidate,
          type: "sourceFile",
        };
      }
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
