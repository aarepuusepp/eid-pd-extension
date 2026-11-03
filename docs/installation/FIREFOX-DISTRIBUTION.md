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

If Mozilla review remains pending, download the existing submission later without
uploading it again:

```powershell
./ops/get-firefox-signed-extension.ps1 -CredentialsFile '<local-credentials.txt>' -VersionId <AMO-version-id>
```

The local credential text file must contain the Mozilla issuer (`user:...`) and a
`JWT secret` label followed by its value. The helper reports pending review or
downloads the approved unlisted XPI. It verifies Mozilla's hash when supplied,
signature entries and manifest identity. It does not create a new submission.

For public distribution, the reviewed metadata is tracked in
`ops/amo-listed-metadata.json`, the license in `LICENSE` and the privacy policy in
`PRIVACY.md`. Set/update the AMO listing metadata and privacy policy before the
first listed submission, then use:

```powershell
./ops/sign-firefox-extension.ps1 -Channel listed -AmoMetadataFile ./ops/amo-listed-metadata.json -ApprovalTimeout 0
```

The zero timeout submits without waiting for Mozilla review or claiming that an
XPI was downloaded. To fetch that submission later, pass `-Channel listed` to
`get-firefox-signed-extension.ps1`. Version 2.1.6 was approved for self-distribution;
2.1.8 is the current public-channel submission. The 2.1.7 submission was superseded
before approval to correct Android compatibility. Do not upload the same version again.

The Developer Hub shows private/unlisted submissions as well as public versions.
Seeing a version there, or seeing its signing approval, does not mean the version
is publicly listed. Check the version's channel and the public page at
https://addons.mozilla.org/firefox/addon/eid-pd/.

The current public submission is version ID `6657755` (2.1.8). Download/check it:

```powershell
./ops/get-firefox-signed-extension.ps1 -CredentialsFile '<local-credentials.txt>' -VersionId 6657755 -Channel listed
```

References: [web-ext sign options](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign)
and [signing/distribution channels](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).
