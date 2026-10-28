import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [".next/**", ".next-preview/**", "node_modules/**", "drizzle/**", "coverage/**"],
  },
];

export default config;
