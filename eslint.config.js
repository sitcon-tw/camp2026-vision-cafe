import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

const rawTailwindPalettePattern =
  "\\b(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b"

const deprecatedZodStringFormatMethods = [
  "email",
  "url",
  "jwt",
  "emoji",
  "guid",
  "uuid",
  "nanoid",
  "cuid",
  "cuid2",
  "ulid",
  "base64",
  "base64url",
  "xid",
  "ksuid",
  "ipv4",
  "ipv6",
  "cidrv4",
  "cidrv6",
  "e164",
  "datetime",
  "date",
  "time",
  "duration",
].join("|")

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${rawTailwindPalettePattern}/]`,
          message:
            "Use semantic color tokens from src/app/globals.css instead of raw Tailwind palette classes.",
        },
        {
          selector: `TemplateElement[value.raw=/${rawTailwindPalettePattern}/]`,
          message:
            "Use semantic color tokens from src/app/globals.css instead of raw Tailwind palette classes.",
        },
        {
          selector: `CallExpression[callee.property.name=/^(${deprecatedZodStringFormatMethods})$/][callee.object.type="CallExpression"]`,
          message:
            "Use Zod 4 top-level format schemas instead of deprecated chained string format methods.",
        },
      ],
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/*", "@/routes/*", "@/pages/*"],
        },
      ],
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  prettier,
)
