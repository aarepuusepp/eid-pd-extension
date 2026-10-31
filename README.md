# EID-PD browser extension 2.1.5

Chrome, Edge and Firefox native-messaging bridge for the EID-PD Windows reader.
See [release notes](RELEASE-2.1.5.md). Includes web-eid-pd.js 1.0.2.

## Development installation

Build the matching 2.1.5 workstation package in the sibling eid-pd-installer
repository with build-installer.ps1. Install its EXE, then load its unpacked
browser directory:
- Chrome/Edge: Extensions > Developer mode > Load unpacked > browsers/2.1.5/chromium.
- Firefox: about:debugging#/runtime/this-firefox > Load Temporary Add-on >
  browsers/2.1.5/firefox/manifest.json. Reload after each Firefox restart.

The installer generates the matching native host registrations and stable
development extension ID. Do not manually edit manifests or copy IDs into web
applications. Reload every application tab after updating the extension.
Public distribution requires browser-store publication/signing separately.

## Web integration

Bundle the npm package in web-eid-pd with the application. See its README and
TypeScript declarations. HTTPS top-level pages only; do not inject scripts from
chrome-extension URLs. The legacy EstEID_PD and web-eid-decrypt interfaces share
the same permission gate.

Readiness/status does not read personal data or request PIN. Card operations
require the central policy and, where applicable, extension-owned user consent.
Personal-data and decrypt grants are separate; blocked origins take precedence.
Personal data is not cached between requests or websites.

NFC certificate reading/key unwrapping requires mode=nfc and a six-digit CAN.
The bridge checks native NFC capability, then rechecks policy/navigation and
card-operation exclusivity before dispatch. PIN1 stays in the native dialog;
CAN is not persisted. The popup previews card data locally on explicit action
without granting a website permission or forwarding the result to that website.

## Checks

- npm test: permission, legacy, NFC, navigation and concurrency regression tests.
- npm --prefix web-eid-pd test: shared SDK and readiness watcher tests.
- npm run test:browser: Chromium/Edge extension, SDK, consent and popup flows
  using mocked native I/O.
- Real-card acceptance: see eid-pd-reader/docs/NFC-CRYPTO.md and
  docs/DIRECT-NFC-TEST.md in that repository. Mocked browser tests do not replace it.
