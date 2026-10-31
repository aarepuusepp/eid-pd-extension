# Configuration ownership

End users install the workstation package and load their development extension
using [installation instructions](../installation/INSTALLATION.md). They do not
edit native manifests or extension IDs. Package/release-config.json and the
installer generate native-host allowlists and registry entries.

Admins manage HKLM policy or %ProgramData%\eid-pd-reader\policy.json:

```json
{"defaultAction":"ask","allowedOrigins":[],"blockedOrigins":[]}
```

Origins are exact HTTPS scheme, host and port; no path or wildcard. Explicit block
wins, then central allow, then defaultAction. User grants apply only in ask mode.
Malformed policy blocks operations. Personal-data/decrypt consent are separate.
See the installer DEPLOYMENT.md for precise registry/ACL and managed-browser policy
instructions. Runtime config.yaml sets reader/logging/PKCS#11 defaults, not website
permissions. No page-provided PIN or shared cross-site personal-data cache is used.
