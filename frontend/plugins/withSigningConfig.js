/**
 * Expo Config Plugin: withSigningConfig
 *
 * Automatically restores Android signing keystores and configures
 * signingConfigs in build.gradle after `npx expo prebuild --clean`.
 *
 * How it works:
 * 1. Copies keystore files from `signing-backup/` into `android/app/`
 * 2. Injects the release signingConfig block into build.gradle
 * 3. Sets the release buildType to use the release signingConfig
 */
const {
  withDangerousMod,
  withAppBuildGradle,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SIGNING_BACKUP_DIR = path.resolve(__dirname, "..", "signing-backup");

// --- Step 1: Copy keystore files ---
function withKeystoreFiles(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const appDir = path.join(cfg.modRequest.platformProjectRoot, "app");

      const signingConfig = JSON.parse(
        fs.readFileSync(
          path.join(SIGNING_BACKUP_DIR, "signing-config.json"),
          "utf8"
        )
      );

      // Copy each keystore file
      for (const variant of Object.values(signingConfig)) {
        const src = path.join(SIGNING_BACKUP_DIR, variant.storeFile);
        const dest = path.join(appDir, variant.storeFile);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`✅ Restored ${variant.storeFile} → android/app/`);
        } else {
          console.warn(`⚠️  Keystore not found: ${src}`);
        }
      }

      return cfg;
    },
  ]);
}

// --- Step 2: Inject signingConfigs into build.gradle ---
function withSigningGradle(config) {
  return withAppBuildGradle(config, (cfg) => {
    const signingConfig = JSON.parse(
      fs.readFileSync(
        path.join(SIGNING_BACKUP_DIR, "signing-config.json"),
        "utf8"
      )
    );

    let buildGradle = cfg.modResults.contents;

    // Only inject if not already present
    if (!buildGradle.includes("signingConfigs")) {
      // Build the signingConfigs block
      const signingBlock = `
    signingConfigs {
        debug {
            storeFile file('${signingConfig.debug.storeFile}')
            storePassword '${signingConfig.debug.storePassword}'
            keyAlias '${signingConfig.debug.keyAlias}'
            keyPassword '${signingConfig.debug.keyPassword}'
        }
        release {
            storeFile file('${signingConfig.release.storeFile}')
            storePassword '${signingConfig.release.storePassword}'
            keyAlias '${signingConfig.release.keyAlias}'
            keyPassword '${signingConfig.release.keyPassword}'
        }
    }`;

      // Insert signingConfigs right before buildTypes
      buildGradle = buildGradle.replace(
        /(\s*buildTypes\s*\{)/,
        signingBlock + "\n$1"
      );

      // Wire up signingConfigs in buildTypes
      buildGradle = buildGradle.replace(
        /(buildTypes\s*\{[\s\S]*?debug\s*\{)/,
        "$1\n            signingConfig signingConfigs.debug"
      );
      buildGradle = buildGradle.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{)/,
        "$1\n            signingConfig signingConfigs.release"
      );
    }

    cfg.modResults.contents = buildGradle;
    return cfg;
  });
}

// --- Combined plugin ---
function withSigningConfig(config) {
  config = withKeystoreFiles(config);
  config = withSigningGradle(config);
  return config;
}

module.exports = withSigningConfig;
