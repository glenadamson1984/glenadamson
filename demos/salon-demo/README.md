# Salon Daybook

An independent Ember.js portfolio prototype by Glen Adamson, inspired by the operational workflow of a salon team. Not Phorest software. All names, bookings and prices are fictional.

Ember 7.4, Glimmer components, tracked state and Vite. No backend, login, payments, notifications or live customer data. State is local to one browser.

## Walkthrough

1. Check Amelia Brooks in, start her service and complete it.
2. Filter the board by stylist or search for a client/service.
3. Try adding an Ava booking at 10:30. Her 10:15 colour appointment conflicts, so the form rejects it.
4. Add a booking at 14:00. Reload and verify it persists.
5. Cancel a scheduled booking and use its free slot.
6. Choose Reset demo, then Reset to sample day. All changes are replaced with the original eight bookings. Keep changes cancels the reset.

## Prerequisites

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (with npm)
- [Google Chrome](https://google.com/chrome/)

## Installation

- From this repository root: `cd demos/salon-demo`
- `npm ci`

## Running / Development

- `npm run start`
- Visit your app at [http://localhost:4200](http://localhost:4200).
- Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Code Generators

Make use of the many generators for code, try `npm exec ember help generate` for more details

### Running Tests

- `node --test tests/daybook.test.mjs` checks booking conflicts, adjacency, cancellation, service bounds and persistence validation.
- Root `npm test` checks the main website.
- `npm run test` is the generated Ember/QUnit harness; it is not part of the verified check set.

### Linting

- `npm run lint`
- `npm run lint:fix`

### Building

- `npm exec vite build --mode development` (development)
- `npm run build` (production)

### Deploying

From the repository root, run `npm run build:salon-demo` after installing this demo's dependencies. This packages the production build under `public/demos/salon-ops`. Commit those assets with source changes. The site's existing Vercel deployment serves them at `/demos/salon-ops/index.html`.

On Windows the packaging script preloads `scripts/windows-links.cjs` to use directory junctions and file copies rather than privileged symlinks. It changes no OS settings. On other platforms the normal Vite build is used.

## Further Reading / Useful Links

- [ember.js](https://emberjs.com/)
- [Vite](https://vite.dev)
- Development Browser Extensions
  - [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  - [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
