import js from "@eslint/js";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "build/"] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unknown-property": ["error", { ignore: ["jsx", "cmdk-input-wrapper"] }],
    },
    settings: { react: { version: "detect" } },
  },
];