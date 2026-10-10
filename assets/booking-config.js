/* ============================================================
 * 905 Group – booking & quote settings
 * ============================================================
 * PRICES
 *   price: null       → shows "Quote" (we confirm the price)
 *   price: 89.99      → fixed price
 *   from: true        → shows "from $89.99"
 *   unit: 'day'       → multiplied by the number of rental days
 *   HST (13%) is added only when every selected line has a price.
 *
 * WHERE BOOKINGS GO
 *   web3formsKey: ''  → bookings are confirmed via WhatsApp
 *   web3formsKey: 'xxxxxxxx-xxxx-…' → bookings are emailed to you
 *     (free key: go to https://web3forms.com, enter the email that
 *      should receive bookings, paste the key here)
 *   WhatsApp is always offered as well.
 * ============================================================ */
window.BOOKING = {
  autocare: {
    business: '905 Auto Care & Collision Center',
    short: '905 Auto Care',
    prefix: 'AC',
    logo: 'img/905-autocare-logo.png',
    address: '73 Eastern Ave, Brampton, ON L6W 1X9',
    phone: '905-451-6700',
    whatsapp: '16479837575',
    web3formsKey: '',
    mode: 'slot',                 // pick a day + time
    slotMinutes: 30,
    daysAhead: 60,
    closedDates: [],              // e.g. ['2026-12-25', '2027-01-01']
    hours: { 0: ['10:00', '18:30'], 1: ['09:30', '19:30'], 2: ['09:30', '19:30'], 3: ['09:30', '19:30'], 4: ['09:30', '19:30'], 5: ['09:30', '19:30'], 6: ['10:00', '18:30'] },
    detailsTitle: 'Your vehicle',
    services: [
      { id: 'oil',      icon: '🛢️', name: 'Engine Oil Change',       desc: 'Oil & filter, fluid top-up',          price: null },
      { id: 'safety',   icon: '✅', name: 'MTO Safety Certificate',  desc: 'Ontario safety inspection',           price: null },
      { id: 'brakes',   icon: '🛑', name: 'Brake Service',           desc: 'Pads, rotors, calipers',              price: null },
      { id: 'susp',     icon: '🔩', name: 'Suspension & Steering',   desc: 'Shocks, struts, alignment check',     price: null },
      { id: 'tirechg',  icon: '🛞', name: 'Tire Change',             desc: 'Seasonal swap & balance',             price: null },
      { id: 'tirefix',  icon: '🔧', name: 'Tire Repair',             desc: 'Flat & puncture repair',              price: null },
      { id: 'battery',  icon: '🔋', name: 'Battery',                 desc: 'Test & replacement',                  price: null },
      { id: 'altstart', icon: '⚙️', name: 'Alternator / Starter',    desc: 'Charging & starting system',          price: null },
      { id: 'collision',icon: '🚗', name: 'Collision Repair',        desc: 'Body work estimate',                  price: null },
      { id: 'elec',     icon: '⚡', name: 'Electrical',              desc: 'Wiring, lights, sensors',             price: null },
      { id: 'hvac',     icon: '❄️', name: 'Heating & A/C',           desc: 'A/C recharge, heater repair',         price: null },
      { id: 'diag',     icon: '🩺', name: 'Diagnostics',             desc: 'Check-engine light & other issues',   price: null }
    ]
  },

  heavy: {
    business: '905 Heavy Equipment',
    short: '905 Heavy Equipment',
    prefix: 'HE',
    logo: 'img/905-heavy-logo.png',
    address: '73 Eastern Ave, Brampton, ON L6W 1X9',
    phone: '437-770-5440',
    whatsapp: '16479837575',
    web3formsKey: '',
    mode: 'range',                // pick start + end date
    daysAhead: 120,
    closedDates: [],
    hours: { 0: ['07:00', '19:00'], 1: ['07:00', '19:00'], 2: ['07:00', '19:00'], 3: ['07:00', '19:00'], 4: ['07:00', '19:00'], 5: ['07:00', '19:00'], 6: ['07:00', '19:00'] },
    detailsTitle: 'Job site',
    services: [
      { id: 'exc',   icon: '🏗️', name: 'Excavator Rental',     desc: 'Mini & full-size',               price: null, unit: 'day' },
      { id: 'doz',   icon: '🚜', name: 'Dozer Rental',         desc: 'Grading & clearing',             price: null, unit: 'day' },
      { id: 'skid',  icon: '🛻', name: 'Skid Steer Rental',    desc: 'Compact & versatile',            price: null, unit: 'day' },
      { id: 'wl',    icon: '🚧', name: 'Wheel Loader Rental',  desc: 'Load & move material',           price: null, unit: 'day' },
      { id: 'bh',    icon: '⛏️', name: 'Backhoe Rental',       desc: 'Loader + excavator',             price: null, unit: 'day' },
      { id: 'att',   icon: '🪝', name: 'Attachments',          desc: 'Buckets, forks, augers, hammers', price: null, unit: 'day' },
      { id: 'op',    icon: '👷', name: 'Operator',             desc: 'Experienced operator',           price: null, unit: 'day' },
      { id: 'del',   icon: '🚚', name: 'Delivery & Pickup',    desc: 'Flatbed to your site',           price: null },
      { id: 'rep',   icon: '🔧', name: 'Equipment Repair',     desc: 'Shop or on-site',                price: null },
      { id: 'demo',  icon: '🧱', name: 'Demolition Job',       desc: 'Residential & commercial',       price: null },
      { id: 'dig',   icon: '🕳️', name: 'Excavation Job',       desc: 'Foundations, trenching, grading', price: null },
      { id: 'tow',   icon: '🚨', name: 'Towing',               desc: '24/7 dispatch',                  price: null }
    ]
  }
};
