# Visitor integration

Use the [current application integration guide](APPLICATION-INTEGRATION-GUIDE.md)
and [SDK reference](https://github.com/aarepuusepp/web-eid-pd.js). The application bundles SDK
1.0.2; users install reader/package 2.1.10 and extension 2.1.6.

Readiness: status/watchStatus, without personal data or PIN. Explicit personal-data
read: readPersonalData/readAllReaders. Crypto: getDecryptCertificate then
unwrapTransportKey using the backend-issued challenge. PIN stays in the native
window; NFC CAN stays in the operation and is cleared afterwards. Consent and
machine policy apply to every API, including legacy adapters.

In Visitor, official Web eID certificate reading and EID-PD chip/NFC reading are
distinct actions. Detect EID-PD via SDK messages, not window.EstEID_PD existence.
No extension-ID entry, page-script injection or shared personal-data cache is
required. Reload application tabs after updating the extension.
