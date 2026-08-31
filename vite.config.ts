import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    printWidth: 100,
    tabWidth: 2,
    sortPackageJson: false,
    ignorePatterns: [
      ".agents/**",
      ".claude/**",
      ".muse/**",
      ".scratch/**",
      ".turbo/**",
      "docs/**",
      "codefetch/**",
      "golden/**",
      "dist/**",
      "out/**",
      "pnpm-lock.yaml",
      "docs/audit/MANIFEST.json",
      "docs/contracts/**",
      "docs/requirements/**",
      "SOURCE-DESIGN-v1.0.md",
      "README.md",
      "skills-lock.json",
    ],
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc"],
    categories: {
      correctness: "error",
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    env: {
      builtin: true,
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
});
