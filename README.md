> [!WARNING]
> Despite the repository description (About), this library is still in active development. Components may exhibit bugs or unintended behavior and are not yet recommended for production use.

<p align="center"><img src="https://raw.githubusercontent.com/serialexperimentsrio/ricebag/main/ricebag.png" alt="ricebag" /></p>

# ricebag

**ricebag** is a React component library with custom property theming.

## Installation

```bash
npm install ricebag
```

## Usage

Import the components and the stylesheet:

```ts
import { Button, Modal, Tooltip, toast } from 'ricebag'
import 'ricebag/styles.css'
```

The stylesheet includes both component styles and default theme values. Import it once at the root of your app.

## Components

| Component | Description |
|---|---|
| `Box` | Container with optional background image and icon |
| `Button` | Button with built-in async loading state |
| `Dropdown` | Popover-based dropdown menu |
| `Icon` | Lightweight image-based icon |
| `IconButton` | Button variant with an icon |
| `Loading` | Animated loading indicator |
| `Panel` | Styled panel container |
| `Popover` | Smart-positioned popover with open/close animations |
| `Select` | Dropdown-based select input |
| `Tooltip` | Hover tooltip with directional positioning |
| `Modal` / `ModalBox` | Global modal system |
| `Toast` / `ToastBox` | Global toast notification system |

## Theming

All visual properties are driven by CSS custom properties. The defaults shipped in `ricebag/styles.css` are:

```css
:root {
  --rb-color-main: #141414;     /* component backgrounds */
  --rb-color-accent: #444444;   /* borders, hover states */
  --rb-color-bright: #f0f0f0;   /* primary text */
  --rb-color-dim: #888888;      /* muted/disabled text */
  --rb-color-danger: rgba(255, 133, 133, 0.16);  /* danger tint */
  --rb-color-warning: rgba(255, 200, 0, 0.16);   /* warning tint */
  --rb-color-success: rgba(0, 200, 100, 0.16);   /* success tint */
  --rb-color-backdrop: rgba(0, 0, 0, 0.3);       /* modal overlay */

  --rb-border-width: 2px;

  --rb-z-popover: 1000;
  --rb-z-modal: 2000;
  --rb-z-tooltip: 3000;
  --rb-z-toast: 4000;

  --rb-transition-fast: 0.12s ease;
  --rb-transition-base: 0.24s ease;
}
```

Components use the page's font. To override any variable, redefine it on `:root` (or any element) in your own CSS. The defaults have zero specificity, so your values win regardless of load order:

```css
:root {
  --rb-color-main: #1a1a2e;
  --rb-color-accent: #2a2a4a;
  --rb-color-bright: #ffffff;
}
```

You can also scope overrides to a specific part of your app:

```css
.sidebar {
  --rb-color-main: #0d0d0d;
}
```

### Upgrading from 0.1.x

0.2.0 prefixes every variable with `rb-` so ricebag's names can't collide with your app's own. Rename `--color-*`, `--z-*` and `--transition-*` to `--rb-color-*`, `--rb-z-*` and `--rb-transition-*`. `--z-box-content` and `--transition-slow` were removed.

## Browser Requirements

ricebag uses the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) and the [HTML Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). No polyfills are included.

Minimum supported browsers: Chrome 114+, Safari 17+, Firefox 125+.

## License

Copyright 2026 Rio

Licensed under the GNU Lesser General Public License v3.0 or later. See [LICENSE](LICENSE) for details.
