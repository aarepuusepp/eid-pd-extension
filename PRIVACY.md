# Privacy and permissions

EID-PD reads the requested cardholder name, identification code and document data,
or the authentication/decryption certificate, and returns them to the calling
website only after its effective access policy permits the operation. The website
is responsible for its subsequent use of those results. Firefox therefore declares
the personallyIdentifyingInfo data category at installation; it does not claim
that no personal information is handled.

The extension has no analytics or telemetry endpoint. It does not cache personal
data, certificates, decrypted content or keys. Local extension storage contains
only user-granted website origins and the granted operation group. The settings
page can remove these grants. Central administrator policy can override them.

PIN1 is entered in a native workstation dialog, never in the web page. It is not
returned to the website or logged. Native diagnostics does not read cardholder
data. Each confirmation displays the requesting HTTPS origin and operation.

The tabs permission is used to cancel pending operations when their initiating
tab navigates or closes. Native messaging connects only to the installed EID-PD
host. HTTPS content scripts implement the page message bridge; access to card
operations is separately enforced by the extension and native machine policy.

The browser-action popup automatically checks presence while open. Reading in the
popup requires an explicit button press and a current HTTPS tab. Its origin is
resolved by the browser, not the webpage. Central blocked/default-deny policy is
still enforced. The popup's button is a one-time consent to a local preview; it
does not persist a website grant and never forwards the result to a webpage.
Results exist only in the popup document, are hidden after 30 seconds, on a
detected removal/navigation or when the popup closes. There is no shared result
cache. The settings page remains available from the popup to revoke site grants.
