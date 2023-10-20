import crypto from "node:crypto";
import { defineEventHandler } from "h3";
import { getRouteRules } from "#imports";
export default defineEventHandler((event) => {
  let csp = `${event.node.res.getHeader("Content-Security-Policy")}`;
  const routeRules = getRouteRules(event);
  if (routeRules.security.nonce !== false) {
    const nonceConfig = routeRules.security.nonce;
    const nonce = (
      /* nonceConfig?.value ? nonceConfig.value() : */
      Buffer.from(crypto.randomUUID()).toString("base64")
    );
    event.context.nonce = nonce;
    csp = csp.replaceAll("{{nonce}}", nonce);
  } else {
    csp = csp.replaceAll("'nonce-{{nonce}}'", "");
  }
  event.node.res.setHeader("Content-Security-Policy", csp);
});
