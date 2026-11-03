# Privacy policy — EID-PD browser extension

Updated: 2026-11-03. Developer: Aare Puusepp.

This extension connects supported HTTPS websites to the separately installed
EID-PD native workstation component on Windows. A compatible card reader and
Estonian ID card are required for card operations.

The extension uses the requesting tab's URL/origin to enforce site permissions
and administrator policy. It stores extension settings and remembered site
permissions locally in browser storage. It does not collect browsing history.

On an explicit card operation, the extension can pass cardholder information,
public certificates and cryptographic operation results between the native
component and the requesting website. Cardholder information may include names,
personal identification code and document details. Access is controlled by
administrator policy and, where required, the extension's own consent dialog.
Personal-data and decryption permissions are separate. Status polling does not
read cardholder information or request a PIN.

The extension does not send telemetry or cardholder information to the developer
or an analytics service. Results returned to an authorized website are available
to that website, whose own privacy policy governs subsequent processing and
transmission to its backend. Review that website's policy before granting access.

Cardholder information is not persisted in extension storage or shared between
websites. The extension popup can display data locally after an explicit read.
It clears displayed results when the card is removed. PIN entry takes place in
the native workstation dialog; PIN is not accepted as a webpage/extension option.
For NFC operations, the CAN entered for the operation is forwarded to the native
component and is not persisted by the extension.

The popup preview requires a current HTTPS tab and follows central blocked/default-deny
policy. It does not grant a website permission or forward its preview to the page.
Results exist only in the popup document and are hidden after 30 seconds, when
removal/navigation is detected, or when the popup closes. The tabs permission is
used to cancel pending operations on navigation/close. Native messaging connects
only to the installed EID-PD host.

Remembered site permissions can be revoked in the extension settings. Removing
the extension removes its browser-local settings; administrator policy and the
native workstation installation are managed separately.

Questions and issues: https://github.com/aarepuusepp/eid-pd-extension/issues
