import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // Project overrides: relax a few strict rules to avoid blocking compilation
  {
    rules: {
      // Keep guidance, but do not fail the build
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars as warnings; devs can prefix with _ to silence
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Allow natural apostrophes in JSX text without escaping
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
