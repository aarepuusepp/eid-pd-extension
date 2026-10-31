# Extension 2.1.6 (2026-10-31)

The popup and website-permission settings now display the browser extension and
native reader versions separately. The extension uses runtime.getManifest(); the
reader value comes from its native status response. The refresh button detects
upgrades and missing hosts without reading card data or asking for PIN/consent.
This diagnostic works even on Firefox about:debugging or with no card present.

COMPONENT_VERSIONS is restricted to our own popup/settings documents. Website
callers cannot use it to bypass origin/policy checks. Protocol checks remain
independent from component version numbers.

Workstation package 2.1.6 bundles extension 2.1.6 and unchanged reader 2.1.5.
The bundled SDK is still 1.0.2; permissions and development extension ID are unchanged.
Load the new unpacked directory/Firefox manifest and refresh application tabs.

Validation: 27 dispatcher tests; actual Chromium/Edge extension flows with mocked
native I/O, including unequal versions and unavailable reader; Firefox popup and
settings rendering/refresh with mocked browser/native APIs. No real-card operation
was required or performed for this presentation/diagnostic change.
