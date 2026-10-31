# Application integration with web-eid-pd.js 1.0.2

Bundle the web-eid-pd npm package with the application (current repositories use
file/vendor dependencies). Do not load scripts from a chrome-extension URL or
inject a page API using an extension ID. Use a trusted HTTPS top-level page.

```js
import { status, readPersonalData, describeStatus } from 'web-eid-pd.js';
const state = await status();
console.log(describeStatus(state)); // diagnostics only, no cardholder data/PIN
// Run from an explicit user action and handle errors/results:
const result = await readPersonalData({ mode: 'contact' });
if (result.ok && result.data) {
  // Populate only this application's intended form.
}
```

Exports: status, watchStatus, readPersonalData, readAllReaders,
getDecryptCertificate, unwrapTransportKey, describeStatus and installationHelp.
[SDK documentation and types](../../web-eid-pd/README.md) are the API authority.
The link is relative to the repository's docs folder; SDK is at web-eid-pd/.

For NFC use {mode:'nfc', can, lang}; clear CAN after the operation and never send
it to the backend. getDecryptCertificate reads the public certificate without
PIN. Backend PrepareClientUnwrap creates a challenge; unwrapTransportKey invokes
the local reader PIN/key operation; backend FinishClientDecrypt verifies output.
PIN and PKCS#11 settings are never webpage options. The native dialog times out
at 60 seconds. Retry must be an explicit new user action after a failed operation.

Machine policy and extension consent apply to new and legacy APIs. The browser's
tab metadata supplies origin; web-message origins are not trusted. Personal-data
and decrypt grants are separate. Do not auto-read personal data in status polling
or share card data between sites. window.EstEID_PD and legacy decrypt modules are
compatibility adapters, not the readiness detection mechanism for new applications.

Current tested set: SDK 1.0.2, extension 2.1.6, reader/package 2.1.10. Check protocol
and NFC capabilities rather than requiring equal extension/reader version numbers.
Use [installation](../installation/INSTALLATION.md) for the user-facing setup.
