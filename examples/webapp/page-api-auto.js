// page-api-auto.js
import { PD_FALLBACK_ENABLED, PD_FALLBACK_TIMEOUT_MS, PD_FIELDS } from "./config/pd-fallback.config.js";
import { readPersonalData } from "./page-api.js"; // juba olemas (kutsuv sild ekstensionini)

// Adapter sinu olemasolevale web-eid.js kasutusele.
// Oota, et see viskab exceptioni või tagastab { ok:false, reason:"no-cert" } kui sertifikaat puudub.
async function getPersonFromCert() {
  // >>> Plug-in: kasuta oma olemasolevat web-eid.js voogu, mis tagastab {ok:true, data:{givenName,surname,personalCode}}
  // Näiteks: const cert = await webEid.getCertificate(); const parsed = parseSubject(cert);
  throw new Error("web-eid adapter not wired");
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

export async function getIdentityAuto() {
  if (!PD_FALLBACK_ENABLED) {
    return await getPersonFromCert();
  }
  try {
    const certRes = await withTimeout(getPersonFromCert(), PD_FALLBACK_TIMEOUT_MS);
    if (certRes && certRes.ok) return certRes; // { ok:true, data:{ givenName, surname, personalCode } }
    // kukkus pehmelt läbi → jätka helperiga
  } catch (e) {
    // viga/timeout → jätka helperiga
  }
  const pdRes = await readPersonalData({ fids: PD_FIELDS });
  if (!pdRes?.ok) return pdRes; // { ok:false, error }
  const { givenName, surname, personalCode } = pdRes.data;
  return { ok: true, data: { givenName, surname, personalCode, source: "fallback:chip" } };
}

