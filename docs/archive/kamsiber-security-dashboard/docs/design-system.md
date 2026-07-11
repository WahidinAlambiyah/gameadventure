# Security Dashboard - Global Design System

This document establishes the visual language, design tokens, and standard components for the application. All AI agents and developers **must** adhere to this system to maintain UI consistency during the Next.js rewrite.

## 1. Design Tokens (Tailwind v4)

Our application uses TailwindCSS v4 with CSS variables mapped to the Oklch color space to ensure vibrant, perceptually uniform, and accessible colors.

### Core Color Palette
| Semantic Name | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- |
| **Background** | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| **Foreground** | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| **Primary** | `oklch(0.079 0.025 264.5)` | `oklch(0.985 0 0)` |
| **Secondary** | `oklch(0.95 0.0058 264.53)` | `oklch(0.269 0 0)` |
| **Muted** | `oklch(0.953 0.005 264.5)` | `oklch(0.269 0 0)` |
| **Destructive** | `oklch(0.494 0.194 16.5)` | `oklch(0.396 0.141 25.723)` |
| **Border / Ring** | `rgba(0, 0, 0, 0.1)` | `oklch(0.269 0 0)` |

### Status & Severity Colors
| Severity/Status | Background | Text/Border | Icon |
| :--- | :--- | :--- | :--- |
| **Critical / Open** | `#fef2f2` (red-50) | `#dc2626` (red-600) | `ShieldAlert`, `AlertTriangle` |
| **High** | `#fff7ed` (orange-50) | `#ea580c` (orange-600) | `AlertTriangle` |
| **Medium / Warning** | `#fffbeb` (amber-50) | `#d97706` (amber-600) | `AlertTriangle` |
| **Low / Info** | `#eff6ff` (blue-50) | `#2563eb` (blue-600) | `Info` |
| **Resolved / Normal** | `#f0fdf4` (green-50) | `#16a34a` (green-600) | `CheckCircle`, `ShieldCheck` |
| **N/A / Inactive** | `#f8fafc` (slate-50) | `#64748b` (slate-500) | `Clock` |

### Typography & Spacing
*   **Font Family:** **System UI** (Tailwind Default: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
*   **Base Font Size:** 16px (Headers typically 18px-24px, subtext 11px-13px).
*   **Base Radius:** 0.625rem (10px) to 0.75rem (12px) for cards.

## 2. Standard Components (`@/components/_ui`)

We use pre-built components styled according to our design tokens. **Do not build these from scratch with raw HTML/Tailwind.**

### Application-Specific Patterns

**1. Page Headers:**
*   Title: `text-slate-900` (`#0f172a`), font-weight bold.
*   Subtitle: `text-slate-500` (`#64748b`), text-sm.
*   Action Bar: Right-aligned buttons (e.g., Export, Create New) with `<Button>` component.

**2. KPI Cards (Dashboards):**
*   Container: `<Card>` with `border-slate-200`, `bg-white`, `rounded-xl`, `p-4`.
*   Icon wrapper: `rounded-lg p-2` with background mapped to severity/status color.
*   Value: `text-2xl font-bold` or larger.
*   Label: `text-xs font-semibold text-slate-700`.

**3. Tables (Lists):**
*   Header: `bg-slate-50`, `border-b border-slate-200`, `text-xs text-slate-500 font-semibold uppercase tracking-wider`.
*   Rows: Hover effects (`hover:bg-slate-50`), `border-b border-slate-100`.
*   Pagination: Footer section with count and Next/Prev controls.

**4. Forms & Drawers:**
*   Use `<SlideOver>` or `<Drawer>` for side-panel forms (e.g., adding endpoints, linking apps).
*   Use standard `<Form>` components, with `<FormField>` wrapping inputs.
*   Input style: `border-slate-300`, `rounded-md`, `h-9` or `h-10`, `text-sm`.
*   Tabs (`<Tabs>`): Used heavily in detail views and forms to separate logic (e.g., Informasi, Sumber, IOC, Dampak).

**5. Badges:**
*   Use `<Badge>` for status, criticality, environments, etc.
*   Usually `rounded-full px-2 py-0.5 text-xs font-semibold`.

**6. Charts (Recharts):**
*   Use `<ResponsiveContainer>` with `<BarChart>`, `<LineChart>`, `<AreaChart>`, `<PieChart>`.
*   CartesianGrid: `strokeDasharray="3 3"` and `stroke="#f1f5f9"`.
*   Axes: `tick={{ fontSize: 11, fill: "#94a3b8" }}`.
*   Colors match the Status & Severity Colors above.

## 3. Strict UI Rules for Agents & Developers
1. **Never hardcode colors.** Use semantic variables (e.g., `text-destructive`, `bg-primary`, `border-border`) where possible, or stick strictly to the established Tailwind slate/blue/green/red/amber/orange utility scales.
2. **Never build custom core elements.** If you need a button, import `<Button>`.
3. **Icons:** Always use **Lucide React** (`lucide-react`).
4. **Dark Mode:** Do not use Tailwind's `dark:` classes manually everywhere. CSS variables automatically invert when the `.dark` class is present.
