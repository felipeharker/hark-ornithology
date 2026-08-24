import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Next's own two configs, plus one house rule. Build output (.next/, out/) and
 * next-env.d.ts are already ignored by eslint-config-next — this file used to
 * restate that list, which changed nothing.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This codebase's convention for an intentionally-unused catch binding.
      "@typescript-eslint/no-unused-vars": ["warn", { caughtErrorsIgnorePattern: "^_" }],
    },
  },
]);
