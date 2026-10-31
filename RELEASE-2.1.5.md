# Extension 2.1.5 (2026-10-31)

Adds explicit NFC mode and CAN forwarding for certificate reading and key
unwrapping through the existing origin/consent gate. Advertises nfcCryptoBridge
and rejects native hosts without nfcCryptoSupported. Rechecks policy, navigation
and concurrent card operations after asynchronous NFC capability discovery.

Includes web-eid-pd.js 1.0.2 with NFC options, certificate metadata, capability
checks and per-reader-mode diagnostics. PIN remains in the native component;
CAN is not persisted. Native messaging protocol remains 1.

Use with workstation package 2.1.5. Development IDs and browser permissions
are unchanged. Reload the extension and application tabs after updating.
Automated browser checks use simulated native responses; real-card acceptance
is documented in the reader release notes. Store signing/publication is separate.
