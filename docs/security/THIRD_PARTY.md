# Third-party scripts & assets

| Library | Loaded from | Purpose | Loading | SRI |
|---|---|---|---|---|
| Phosphor Icons | unpkg.com | icon font | `<script>` in `<head>` | see `web/index.html` |
| VanillaTilt 1.8.1 | cdnjs | 3D card tilt | deferred | see `web/index.html` |
| three.js r134 | cdnjs | hero (currently disabled) | deferred | see `web/index.html` |
| jsPDF 2.5.1 | cdnjs | PDF export | deferred | see `web/index.html` |
| GSAP 3.12.5 + ScrollTrigger | cdnjs | scroll animation | deferred | see `web/index.html` |
| Anime.js | jsDelivr | micro-animation | deferred | see `web/index.html` |
| Tesseract.js 5.1.1 | unpkg (lazy, on first OCR open) | web OCR | dynamic `<script>` | **none** (tracked as issue #14 in `docs/development/KNOWN_ISSUES.md`) |
| Poppins (SIL OFL) | bundled `web/assets/fonts/` | CR80 card typography | local woff2 | n/a |

New CDN dependencies need justification, `defer`, SRI and `crossorigin="anonymous"` (see `AGENTS.md` §2.4).
