// R10a — Cloudflare Pages Function (catch-all).
//
// Off by default: with REDIRECT_TO unset this is a pass-through, so the deployment
// behaves exactly as today and this can ship before the cutover with no effect.
//
// On the cutover day Josh sets REDIRECT_TO=https://gmg.tabletop-almanac.com on the
// hp-tracker Pages project and redeploys. Every request is then answered with a 301
// to the same path and query string (so ?obrref= survives) on that host. The
// response carries Access-Control-Allow-Origin: * because the CORS check runs on
// every response in a redirect chain (see R10a §0.1).
//
// Requests already on the target host pass through, so a project that also serves
// that host (or a test before the day) cannot redirect to itself in a loop.
//
// Written in plain JavaScript with a JSDoc type so the TypeScript build does not
// need @cloudflare/workers-types.
//
/**
 * @param {{ request: Request, env: { REDIRECT_TO?: string }, next: () => Promise<Response> }} context
 * @returns {Response | Promise<Response>}
 */
export const onRequest = ({ request, env, next }) => {
    if (!env.REDIRECT_TO) return next();
    const url = new URL(request.url);
    const target = new URL(env.REDIRECT_TO).hostname;
    if (url.hostname === target) return next();
    url.hostname = target;
    return new Response(null, {
        status: 301,
        headers: { Location: url.toString(), "Access-Control-Allow-Origin": "*" },
    });
};
