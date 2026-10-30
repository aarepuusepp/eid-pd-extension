/* Shared, side-effect free access policy used by both browser implementations. */
globalThis.EIDPDPolicy = (() => {
  const fail = (code, message) => Object.assign(new Error(message), { code });
  function origin(value) {
    let u;
    try { u = new URL(value); } catch { throw fail('ERR_EIDPD_CONTEXT_INSECURE', 'HTTPS veebiaadress on nõutud'); }
    if (u.protocol !== 'https:' || u.username || u.password) throw fail('ERR_EIDPD_CONTEXT_INSECURE', 'HTTPS veebiaadress on nõutud');
    return u.origin;
  }
  function validate(p) {
    if (!p || !['ask','allow','deny'].includes(p.defaultAction) ||
        !Array.isArray(p.allowedOrigins) || !Array.isArray(p.blockedOrigins)) throw fail('ERR_EIDPD_POLICY_INVALID','Vigane keskne seadistus');
    for (const value of [...p.allowedOrigins,...p.blockedOrigins]) {
      try {
        if(typeof value!=='string'||/[\\\s*]/.test(value))throw Error('invalid origin');
        const u = new URL(value); origin(value);
        if (u.search || u.hash || (u.pathname !== '/' && u.pathname !== ''))throw Error('invalid origin');
      } catch { throw fail('ERR_EIDPD_POLICY_INVALID','Vigane keskne veebiaadress'); }
    }
    return p;
  }
  function decision(p, site, saved) {
    validate(p); site=origin(site);
    if (p.blockedOrigins.some(v => origin(v)===site)) return 'deny';
    if (p.allowedOrigins.some(v => origin(v)===site)) return 'allow';
    if (p.defaultAction !== 'ask') return p.defaultAction;
    return saved === 'allow' ? 'allow' : 'ask';
  }
  function senderOrigin(sender) {
    if (!sender.tab || sender.frameId !== 0 || !sender.url || !sender.tab.url) throw fail('ERR_EIDPD_CONTEXT_INSECURE','Ainult veebilehe põhivaade on lubatud');
    const site=origin(sender.url);
    if (site !== origin(sender.tab.url)) throw fail('ERR_EIDPD_SITE_DENIED','Veebileht on muutunud');
    return site;
  }
  return {fail,origin,validate,decision,senderOrigin};
})();
