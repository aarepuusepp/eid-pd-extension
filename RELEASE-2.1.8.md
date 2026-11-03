# Extension 2.1.8 — public Firefox distribution

Public AMO submission under the existing ID `eid-pd@aarepuusepp.ee`, with MIT
licensing, a published privacy policy and metadata in `ops/amo-listed-metadata.json`.
Version 2.1.6 remains the approved self-distribution package. The initial listed
submission 2.1.7 was superseded before approval because its Android manifest
block caused AMO to advertise unsupported Android compatibility.

The Firefox manifest now omits `gecko_android`; desktop Firefox minimum is 142.
The minimum also avoids the linter's Android data-consent warning for a desktop-only
manifest. EID-PD still requires the separately installed Windows native component.
Card operations, permission policy and native protocol are unchanged from 2.1.6.

The existing workstation installer pins extension 2.1.6. Its artifact is not
rebuilt or relabelled by this submission. Mozilla review determines when the listed
2.1.8 version becomes publicly available.

AMO submission: `6657755`, channel `listed`, submitted 2026-11-03. The server
confirmed only desktop Firefox 142+ compatibility. At submission time the version
was awaiting review (`unreviewed`); the superseded 2.1.7 file was disabled by AMO.
