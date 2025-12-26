module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  extends: ["eslint:recommended", "plugin:import/recommended"],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js"],
      },
    },
  },
  rules: {
    "no-unused-vars": "off",
    "no-prototype-builtins": "off",
    "no-useless-escape": "off",
    "import/default": "off",
    "import/no-named-as-default-member": "off",
  },
};