# @alot-web-develop/ui

React 19 **shadcn primitives**, styled with `@alot-web-develop/design`.
No app layouts, data orchestration, form helpers or business components.

## Setup

Install the package with React 19 and Tailwind CSS 4. The design package is a
runtime dependency; UI imports its token stylesheet directly.

```css
@import "tailwindcss";
@import "@alot-web-develop/ui/styles.css";
```

`styles.css` imports `@alot-web-develop/design/tailwind.css` and registers the
compiled UI directory as a Tailwind source. It also includes shadcn animations
and the standard base layer for semantic borders, focus outlines and body colors. This ensures utilities used by the
package are generated even when installed under node_modules. Override brand
variables in your application's stylesheet after these imports.

```tsx
import { Button } from "@alot-web-develop/ui/button";
import { Card, CardContent } from "@alot-web-develop/ui/card";

<Card>
  <CardContent>
    <Button variant="outline">{t("save")}</Button>
  </CardContent>
</Card>;
```

The API follows shadcn: named components and compound parts, native props,
React 19 refs, Radix accessibility and `asChild` where supported. Consumer classes
merge last with `cn` (`clsx` + `tailwind-merge`). Use component subpaths or root
named exports. Supply accessible labels and translated content in the app.
Buttons retain shadcn/native submit behavior; set `type="button"` for actions
inside forms that must not submit.

## Included primitives

Accordion, Alert, AspectRatio, Avatar, Badge, Button, Card, Checkbox, Collapsible,
Dialog, DropdownMenu, HoverCard, Input, Label, Pagination, Popover, Progress, RadioGroup,
ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs,
Textarea, Toggle, ToggleGroup, Tooltip.

`Table` is the shadcn table markup primitive. Data orchestration, controlled pagination logic,
query boundaries, page shells, application sidebars, and custom form helpers
belong outside this package.

## Upstream and design integration

Sources come from the official shadcn `new-york-v4` registry. Exact source URLs
are recorded in `shadcn-sources.json`; attribution is in `LICENSE.shadcn.md`.
Adaptations: local module imports, the shared `cn` helper, destructive foreground
and overlay colors expressed with design tokens instead of fixed white/black.
Component behavior and variants follow upstream.

Dialogs and sheets retain shadcn's default close label; use `showCloseButton={false}`
for Dialog/Sheet and compose a translated close action when needed. Pagination
retains upstream English defaults; compose `PaginationLink` with translated text
and ARIA labels for localized navigation. Provide
labels and descriptions for dialogs, input controls and icon-only buttons.

Run `pnpm check` to build, typecheck, lint and test. Tests cover keyboard
interaction, focus management, refs, consumer overrides and real Tailwind source
scanning with the design package.
