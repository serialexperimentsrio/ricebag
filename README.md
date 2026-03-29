<p align="center"><img src="ricebag.png" alt="ricebag" /></p>

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
  --color-main: #141414;       /* component backgrounds */
  --color-accent: #444444;     /* borders, hover states */
  --color-bright: #f0f0f0;     /* primary text, glow effects */
  --color-dim: #888888;        /* muted/disabled text */
  --color-danger: rgba(255, 133, 133, 0.16);  /* danger state border */
  --color-backdrop: rgba(0, 0, 0, 0.3);       /* modal overlay */

  --z-box-content: 100;
  --z-popover: 1000;
  --z-modal: 9999;
  --z-tooltip: 99999;
  --z-toast: 999999;

  --transition-fast: 0.1s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

To override any variable, redefine it in your own global CSS after importing `ricebag/styles.css`:

```css
:root {
  --color-main: #1a1a2e;
  --color-accent: #2a2a4a;
  --color-bright: #ffffff;
}
```

You can also scope overrides to a specific part of your app:

```css
.sidebar {
  --color-main: #0d0d0d;
}
```

## Browser Requirements

ricebag uses the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) and the [HTML Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). No polyfills are included.

Minimum supported browsers: Chrome 114+, Safari 17+, Firefox 125+.

## License

Copyright 2026 Rio

Licensed under the GNU Lesser General Public License v3.0 or later. See [LICENSE](LICENSE) for details.
