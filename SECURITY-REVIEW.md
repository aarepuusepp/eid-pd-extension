# Dependency review, 2026-10-30

Release: 2.1.3; shared web SDK: 1.0.1.

- Extension access-policy tests: 22 passed; SDK tests: 12 passed.
- Chromium and Edge extension bridge tests passed with a mocked native host.
- `npm audit --omit=dev`: no production dependency findings. The packaged extension contains no npm runtime dependencies.
- Full `npm audit` reports one underlying low-severity advisory, GHSA-gcqx-w48m-w2h4 (CVE-2026-93753), through `web-ext -> addons-linter -> deepmerge 4.3.1`. The current web-ext is 10.8.0. No patched deepmerge version is available. The three reported dependency findings refer to this one chain. Do not use audit's forced downgrade to obsolete web-ext as a fix. Keep linting restricted to trusted repository sources until upstream publishes a fix.
- Native reader uses libcdoc-go v2.0.6. govulncheck found no vulnerable imported packages or calls. Its module graph also includes the unused, unmaintained x/crypto/openpgp advisory GO-2026-5932; OpenPGP is not imported by the reader.

This is a development release. Browser-store publication, signing and clean-Windows lifecycle acceptance remain separate release gates. Mocked browser tests do not replace physical-card acceptance.
