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
      // Frozen save artifacts: `campaign.json` is hashed byte-for-byte by its
      // signature, so reformatting it would break the fixture (ADR-0113 §5).
      "packages/persistence/test/fixtures/**",
      "dist/**",
      "out/**",
      // Vendored upstream code (byte-identical published artifacts) and the
      // read-only Effect source subtree are reference material — never ours to
      // lint or reformat (see AGENTS.md "Vendored repositories").
      "vendor/**",
      "repos/**",
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
    // `.scratch/**` is the local agent issue tracker (see docs/agents/issue-tracker.md):
    // not repository code, and already excluded from `fmt`. Linting it makes a local
    // scratch probe break `pnpm check` while CI, which also has the tree, disagrees.
    ignorePatterns: ["vendor/**", "repos/**", ".scratch/**"],
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
