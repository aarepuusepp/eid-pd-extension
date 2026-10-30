# Extension 2.1.3

Toolbar PNGs now contain the complete SVG artwork at eight pixel sizes; explicit
manifest sizes cover standard and scaled displays. Generate them on Windows with
`pwsh -File extension/icons/generate-icons.ps1`. Access policy, permissions and
SDK 1.0.1 are unchanged. Reload application tabs after reloading the extension.

Real CDOC1 decryption with version 2.1.2 was confirmed by the user in Chrome and
Firefox on 2026-10-30. Firefox development packages are temporary add-ons loaded
through about:debugging; these are not signed store releases.
