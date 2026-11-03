# Firefox packaging and Mozilla signing

Run `npm ci` in eid-pd-extension, then:

```powershell
./ops/package-extension-firefox.ps1
```

This creates `dist/eid-pd-extension-firefox-<version>.zip`, an unsigned submission
package using the Firefox manifest. Temporary staging directories are removed.

For a permanently installable XPI, set the local environment variables
`AMO_API_KEY` and `AMO_API_SECRET` (or `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`).
Obtain credentials from the [AMO API credentials page](https://addons.mozilla.org/developers/addon/api/key/).
Keep secrets outside Git and do not put them in chat, command history or logs.

```powershell
./ops/sign-firefox-extension.ps1 -Channel unlisted
```

The script packages, lints, submits and downloads a signed XPI into a fresh
`dist/amo-unlisted-<request>/` directory. It uses the project's locked web-ext
dependency and passes credentials through the child process environment. It checks
signature entries and manifest identity/version and prints the XPI SHA256.
Install the XPI through Firefox's Add-ons Manager > gear > Install Add-on From
File. Also install the matching native workstation component and reload application tabs.

`unlisted` is self-distribution, not a public searchable AMO listing. For a public
listing select `-Channel listed`. Initial listings also need AMO metadata, supplied
with `-AmoMetadataFile <local-json-file>`; updates must match the existing extension
ID. Review/signing can remain pending beyond the timeout. Check the
[Developer Hub](https://addons.mozilla.org/developers/) before retrying and use a
new extension version when required.

References: [web-ext sign options](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign)
and [signing/distribution channels](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).
