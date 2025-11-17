// config/pd-fallback.config.js
export const PD_FALLBACK_ENABLED = true;             // peal/maas
export const PD_FALLBACK_TIMEOUT_MS = 5000;          // kaua oodata web-eid vastust
export const PD_FIELDS = {                           // DF/EF FID override võimalus
  df_personal: "5000",
  ef_surname:  "5001",
  ef_given:    "5002",
  ef_code:     "5006"
};

