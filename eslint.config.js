// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  // the one below might be broken
  ...tseslint.configs.strict,
  eslintConfigPrettier,
  // @ts-ignore
  eslintPluginPrettier
);
