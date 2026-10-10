# 905 Group of Companies – Websites

A static site with no build step. Upload the folder to any web host (GitHub Pages, Netlify, cPanel) and it works.

| Page | Business |
|------|----------|
| `index.html` | 905 Heavy Equipment: rentals, repair, demolition, excavation |
| `autocare.html` | 905 Auto Care & Collision Center |

## How booking works
The booking forms open **WhatsApp** with the customer's request already written out, addressed to
**647-983-7575**. To use a different number, change `data-wa="16479837575"` on the `<body>`
tag of each page and the `wa.me/16479837575` links (country code + number, no spaces).

Auto Care time slots follow the opening hours in the form's `data-hours` attribute
(0 = Sunday … 6 = Saturday).

## Google reviews
Paste real reviews from the Google Business Profile into `assets/reviews.js`. They show up
automatically as review cards. The "Read reviews on Google" and "Write a review" buttons always show.
For a direct "write a review" link, swap the button URL for
`https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`.

## Files
- `assets/site.css` – shared styles (yellow theme for Heavy Equipment, red for Auto Care)
- `assets/site.js` – WhatsApp forms, time slots, open-now badge, reviews
- `img/` – logos and photos
