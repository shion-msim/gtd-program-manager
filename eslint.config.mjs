import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const TOKEN_FORBIDDEN_ARBITRARY =
  /\b(?:w|min-w|max-w|h|min-h|max-h|text|rounded|right|left|top|bottom|translate-x|translate-y|bg|opacity)-\[[^\]]+\]/;
const TOKEN_FORBIDDEN_COLOR_LITERAL = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\(/;
const TOKEN_FORBIDDEN_STYLE_PROPS = new Set([
  "background",
  "backgroundColor",
  "color",
  "borderColor",
  "outlineColor",
  "boxShadow",
  "zIndex",
]);

const tokenGuardPlugin = {
  rules: {
    "no-raw-design-values": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow raw design values outside tokens",
        },
      },
      create(context) {
        function checkText(node, value) {
          if (typeof value !== "string") {
            return;
          }
          if (TOKEN_FORBIDDEN_COLOR_LITERAL.test(value)) {
            context.report({
              node,
              message:
                "色の実値リテラルは禁止です。design token 名を使ってください。",
            });
          }
          if (TOKEN_FORBIDDEN_ARBITRARY.test(value)) {
            context.report({
              node,
              message:
                "Tailwind arbitrary 値は禁止です。design token クラスへ置き換えてください。",
            });
          }
        }

        return {
          JSXAttribute(node) {
            if (node.name.name === "style" && node.value?.type === "JSXExpressionContainer") {
              const expr = node.value.expression;
              if (expr?.type === "ObjectExpression") {
                for (const prop of expr.properties) {
                  if (prop.type !== "Property") {
                    continue;
                  }
                  const key =
                    prop.key.type === "Identifier"
                      ? prop.key.name
                      : prop.key.type === "Literal"
                        ? String(prop.key.value)
                        : null;
                  if (key && TOKEN_FORBIDDEN_STYLE_PROPS.has(key)) {
                    context.report({
                      node: prop,
                      message:
                        "この style プロパティは禁止です。token クラスへ置き換えてください。",
                    });
                  }
                }
              }
            }

            if (node.name.name !== "className" || !node.value) {
              return;
            }

            if (node.value.type === "Literal") {
              checkText(node.value, node.value.value);
              return;
            }

            if (node.value.type === "JSXExpressionContainer") {
              const expr = node.value.expression;
              if (expr.type === "Literal") {
                checkText(expr, expr.value);
              }
              if (expr.type === "TemplateLiteral") {
                for (const q of expr.quasis) {
                  checkText(q, q.value.raw);
                }
              }
            }
          },
          Literal(node) {
            checkText(node, node.value);
          },
          TemplateElement(node) {
            checkText(node, node.value.raw);
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    plugins: {
      tokenGuard: tokenGuardPlugin,
    },
    rules: {
      "tokenGuard/no-raw-design-values": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
