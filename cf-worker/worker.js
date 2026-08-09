/* BIST hisse verisi için Yahoo Finance/Midas'a tarayıcıdan doğrudan CORS
   ile erişilemediği doğrulandığı için (bkz. index.html'deki fetchBistDaily)
   kullanıcının kendi Cloudflare hesabında barındırdığı bu proxy'ye
   yönlendiriliyor. Yalnızca izin verilen host'lara istek geçirir. */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    if (!target) {
      return new Response("Missing url parameter. Full incoming URL was: " + request.url, { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch (e) {
      return new Response("Invalid url. target param was: " + target, { status: 400 });
    }

    const allowedHosts = [
      "query1.finance.yahoo.com",
      "query2.finance.yahoo.com",
      "www.getmidas.com",
      "www.isyatirim.com.tr",
      "www.coindesk.com",
      "cointelegraph.com",
      "decrypt.co",
      "deep-index.moralis.io",
    ];
    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response(
        "Host not allowed. Parsed hostname was: " + JSON.stringify(targetUrl.hostname) +
        " | target param was: " + target +
        " | full incoming URL was: " + request.url,
        { status: 403 }
      );
    }

    /* Moralis header ile kimlik doğrular; tarayıcı doğrudan CORS'a
       takılırsa istek buradan geçer ve API anahtarı (mkey) X-API-Key
       header'ı olarak eklenir. Anahtar yalnızca kullanıcının kendi
       Worker'ında görülür. */
    const fwdHeaders = { "User-Agent": "Mozilla/5.0" };
    const mkey = url.searchParams.get("mkey");
    if (mkey) fwdHeaders["X-API-Key"] = mkey;
    const resp = await fetch(targetUrl.toString(), { headers: fwdHeaders });
    const body = await resp.arrayBuffer();
    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.delete("content-security-policy");
    return new Response(body, { status: resp.status, headers });
  },
};
