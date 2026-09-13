# Garden Pet Sitting

The website for Garden Pet Sitting, Georgia Garden's pet care business in South Salinas, CA (serving the Monterey Bay Area). Georgia has 30 years of experience caring for dogs, cats, birds, hamsters, guinea pigs, and fish, and fosters dogs for South County Animal Rescue (SCAR) and Hitchcock Road Animal Services.

## What's on the site

- **Home** — who Georgia is, what she offers, and how to get in touch
- **Services** — in-home visits and dog daycare, plus the neighborhoods she serves
- **About Georgia** — her story and her home team (Luna the Great Pyrenees and Berlioz the Maine Coon mix)
- **Foster dogs** — why she fosters, the current foster (when there is one), and a gallery of past fosters with their happy endings

## How it's built

Plain HTML, CSS, and JavaScript. No frameworks, no build step. Open `index.html` in a browser and it works.

- `index.html`, `services.html`, `about.html`, `fosters.html` — the pages
- `fosters/` — one page per past foster dog
- `css/styles.css` — all styling, driven by design tokens (colors, type, spacing) that match the Figma design system
- `js/main.js` — the small amount of behavior: mobile menu, carousels, the inquiry form, share and copy-link buttons
- `images/` — photos, logo, and icons

## Design

The site was designed first as a design system in Figma (colors, typography, components), then as desktop and mobile page mockups. The CSS variables in `styles.css` mirror the Figma design tokens one-to-one, so the design file and the code stay in sync.

## Running it locally

There's nothing to install. Double-click `index.html`, or for a local server:

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Hosting

The site is published with GitHub Pages from the `main` branch.
