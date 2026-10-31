# Windows browser installation — EID-PD 2.1.10 / extension 2.1.6

1. Install the EID-PD 2.1.10 development EXE with administrator rights. It installs
   reader 2.1.10, WinUI PIN runtime and native-host registrations for all browsers.
2. Open Start > EID-PD > Paigaldusjuhend (installation.html). It contains exact
   copyable installed paths and separate first-install/update instructions.
3. Chrome: chrome://extensions > Developer mode > Load unpacked > select
   C:\Program Files\eid-pd-reader\browsers\chromium.
4. Edge: edge://extensions > Developer mode > Load unpacked > the same directory.
5. Firefox: about:debugging#/runtime/this-firefox > Load Temporary Add-on > select
   C:\Program Files\eid-pd-reader\browsers\firefox\manifest.json.
6. Reload every application tab. Temporary Firefox extensions must be reloaded
   after browser restart. Chrome/Edge updates may require the extension Reload button.

Build-output directories instead use artifacts/browsers/2.1.6/chromium or
artifacts/browsers/2.1.6/firefox/manifest.json. Prefer the installed stable paths
for workstation testing. Users do not edit native manifests, extension IDs or
registry entries. The installer generates them from package configuration.

Open an HTTPS application with a trusted certificate. Check status before an
explicit card read. Grant personal-data/decrypt consent when requested. PIN1
is entered only in the native window; CAN is entered in the NFC operation form.

The popup shows extension and reader versions separately. Extension 2.1.6 and
reader/package 2.1.10 are expected. A missing reader differs from missing card,
missing PKCS#11 module or wrong module architecture. A reload fixes a stale page
bridge after extension updates; disabling origin/policy checks is not a remedy.

The development extension is not an official store release. Public builds require
stable store IDs/URLs, code signing and a Mozilla-signed XPI. IT deployment uses
browser policies as described in the installer DEPLOYMENT.md. Manual development
loading does not establish public-store or clean-machine acceptance.
