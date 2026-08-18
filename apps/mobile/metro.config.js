const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Enable package exports resolution so Metro can resolve "@clerk/react/internal", etc.
config.resolver.unstable_enablePackageExports = true;

// 3. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "@clerk/react": path.resolve(projectRoot, "node_modules/@clerk/react"),
  "@clerk/shared": path.resolve(projectRoot, "node_modules/@clerk/shared"),
  "@clerk/clerk-js": path.resolve(projectRoot, "node_modules/@clerk/clerk-js"),
  "@clerk/expo": path.resolve(projectRoot, "node_modules/@clerk/expo"),
};

config.resolver.disableHierarchicalLookup = false;

module.exports = config;
