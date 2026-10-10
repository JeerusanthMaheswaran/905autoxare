# 905 Group of Companies – Websites

A static site with no build step. Upload the folder to any web host (GitHub Pages, Netlify, cPanel) and it works.

| Page | Business |
|------|----------|
| `index.html` | 905 Heavy Equipment: rentals, repair, demolition, excavation |
| `autocare.html` | 905 Auto Care & Collision Center |

## Online booking & quotes
Both pages have a 4-step booking calendar: **Services → Date/Time → Details → Confirm**.
- A live **quote panel** updates as services are picked.
- Customers can **download a branded PDF quote** (reference number, items, HST) and **add the booking to their calendar** (.ics).
- Auto Care: pick a day and time slot inside opening hours. Heavy Equipment: pick start and end dates, and rental items are multiplied by the number of days.

All settings live in **`assets/booking-config.js`**:
- **Prices:** set `price: 89.99` on a service (or leave `null` to show "Quote"). HST 13% is added once every line has a price.
- **Bookings by email:** get a free access key at https://web3forms.com, then paste it into `web3formsKey`.
  Until then, the Confirm button sends the booking through WhatsApp (647-983-7575).
- **Opening hours, closed dates** (holidays), and how far ahead people can book.

## Google reviews
Paste real reviews from the Google Business Profile into `assets/reviews.js`. They show up
automatically as review cards. The "Read reviews on Google" and "Write a review" buttons always show.
For a direct "write a review" link, swap the button URL for
`https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`.

## Files
- `assets/site.css` – shared styles (yellow theme for Heavy Equipment, red for Auto Care)
- `assets/site.js` – WhatsApp forms, time slots, open-now badge, reviews
- `img/` – logos and photos
