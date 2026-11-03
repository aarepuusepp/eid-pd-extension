# Extension 2.1.7 — superseded AMO submission

This submission was superseded by 2.1.8 before public approval: AMO derives Android
compatibility from the manifest and did not accept the desktop-only metadata
override. Version 2.1.8 removes the Android manifest block and raises the Firefox
minimum to 142, allowing strict linting without claiming Android support.

Version bump for the first listed AMO submission: 2.1.6 was already submitted
and approved in the unlisted channel. The extension ID remains
`eid-pd@aarepuusepp.ee`. Card operations, permission policy and native protocol
are unchanged from 2.1.6.

- Adds the MIT license and a privacy policy describing actual extension data flow.
- Adds reproducible public AMO metadata in `ops/amo-listed-metadata.json`.
- Corrects the Firefox homepage. The attempted desktop-only compatibility override
  did not take effect; this submission must not be used as the public release.
- The native installer and reader have separate versions. Existing installer
  builds pinned to extension 2.1.6 are not rebuilt or relabelled by this submission.

Public availability depends on Mozilla's listed-channel review. Check the
Developer Hub and public listing; an approved unlisted version alone does not
establish public availability.
