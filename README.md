# Agentic Design System

A React and TypeScript component workspace with Storybook 10, Vite, Tailwind CSS, accessibility checks, and story tests.

## Get started

```bash
npm install
npm run storybook
```

Storybook opens at [http://localhost:6006](http://localhost:6006). The example Button and its stories live in `src/components/Button/`. Add each new component and its `*.stories.tsx` file under `src/components/`.

## Color foundations

Figma is the design authority. See the [Color Palette frame](https://www.figma.com/design/rNDsY8yLQ2w1aKlmi3frij/Design.md?node-id=107-1964) and [Token System frame](https://www.figma.com/design/rNDsY8yLQ2w1aKlmi3frij/Design.md?node-id=107-2523). Storybook documents both under **Foundations → Colors** and includes the source discrepancies and contrast results on the Semantic page.

Use semantic custom properties in components, such as `color: var(--ads-color-text-strong-950)` and `background-color: var(--ads-color-bg-white-0)`. The app and Storybook load `src/tokens/colors.css` through `src/index.css`. JavaScript consumers can import `colorTokens` and `resolveColor` from `src/tokens/colors.ts`.

All values default to Light, Blue, and Gray. To switch modes globally, set the attributes on `<html>`. For an isolated preview, put the attributes and `data-color-scope` on the same container. Storybook's Semantic page uses this mechanism for its preview controls.

| Attribute | Values |
| --- | --- |
| `data-color-mode` | `light`, `dark` |
| `data-color-brand` | `blue`, `purple`, `orange`, `sky` |
| `data-color-neutral` | `gray`, `slate` |

The canonical source is `tokens/colors.tokens.json`, using [DTCG 2025.10 sRGB colors](https://www.designtokens.org/tr/2025.10/color/) and token references. Each token keeps its exact Figma name and variable ID. The Figma extension records collection modes, nondefault values, and swatch node IDs where available. The generator lowercases names, replaces separators with hyphens, and adds `--ads-color-` for CSS. The intermediate Neutral aliases use `--ads-color-reference-neutral-`.

For a Figma update, read the variable collections and every mode, match tokens by Figma variable ID, and update the source values or references. Preserve the sRGB channels and alpha from the variables and compare swatch labels and fills separately. Record any discrepancies in the source extension. Run `npm run tokens:build` to update `src/tokens/colors.css`, `src/tokens/colors.generated.ts`, and `src/tokens/colors.tailwind.css`. Review the generated diff and run `npm run tokens:check` before rebuilding Storybook.

## Tailwind in components

The Vite app and Storybook use Tailwind CSS 4 without its global Preflight reset. Use generated semantic utilities like `bg-ads-bg-white-0`, `text-ads-text-strong-950`, and `border-ads-stroke-sub-300`. They follow the existing Figma mode attributes. The generated Tailwind theme uses the existing CSS variables as its source.

Use Tailwind's custom property syntax for values scoped to a component. For example, use `bg-(--ads-button-bg)`, `gap-(--ads-button-gap)`, and `rounded-(--ads-button-radius)` on a component that declares those variables. Keep class names complete in source so Tailwind can detect them at build time.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run storybook` | Develop and preview components |
| `npm run build-storybook` | Build a static Storybook |
| `npm test` | Run Storybook interaction and accessibility tests |
| `npm run dev` | Run the small Vite landing page |
| `npm run build` | Typecheck and build the Vite page |
| `npm run lint` | Run Oxlint |
| `npm run tokens:build` | Regenerate CSS, TypeScript, and Tailwind color tokens |
| `npm run tokens:check` | Validate all modes and verify generated files are current |
