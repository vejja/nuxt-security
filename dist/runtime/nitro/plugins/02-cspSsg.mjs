import path from "node:path";
import crypto from "node:crypto";
import defu from "defu";
import { useRuntimeConfig } from "#imports";
const moduleOptions = useRuntimeConfig().security;
export default (function(nitro) {
  nitro.hooks.hook("render:html", (html, { event }) => {
    if (!isContentSecurityPolicyEnabled(event, moduleOptions)) {
      return;
    }
    if (!moduleOptions.headers) {
      return;
    }
    const scriptPattern = /<script[^>]*>(.*?)<\/script>/gs;
    const scriptHashes = [];
    const hashAlgorithm = "sha256";
    let match;
    while ((match = scriptPattern.exec(html.bodyAppend.join(""))) !== null) {
      if (match[1]) {
        scriptHashes.push(generateHash(match[1], hashAlgorithm));
      }
    }
    const cspConfig = moduleOptions.headers.contentSecurityPolicy;
    if (cspConfig && typeof cspConfig !== "string") {
      html.head.push(generateCspMetaTag(cspConfig, scriptHashes));
    }
  });
  function generateCspMetaTag(policies, scriptHashes) {
    const unsupportedPolicies = {
      "frame-ancestors": true,
      "report-uri": true,
      sandbox: true
    };
    const tagPolicies = defu(policies);
    if (scriptHashes.length > 0 && moduleOptions.ssg?.hashScripts) {
      tagPolicies["script-src"] = (tagPolicies["script-src"] ?? []).concat(scriptHashes);
    }
    const contentArray = [];
    for (const [key, value] of Object.entries(tagPolicies)) {
      if (unsupportedPolicies[key]) {
        continue;
      }
      let policyValue;
      if (Array.isArray(value)) {
        policyValue = value.join(" ");
      } else if (typeof value === "boolean") {
        policyValue = "";
      } else {
        policyValue = value;
      }
      if (value !== false) {
        contentArray.push(`${key} ${policyValue}`);
      }
    }
    const content = contentArray.join("; ");
    return `<meta http-equiv="Content-Security-Policy" content="${content}">`;
  }
  function generateHash(content, hashAlgorithm) {
    const hash = crypto.createHash(hashAlgorithm);
    hash.update(content);
    return `'${hashAlgorithm}-${hash.digest("base64")}'`;
  }
  function isContentSecurityPolicyEnabled(event, options) {
    const nitroPrerenderHeader = "x-nitro-prerender";
    const nitroPrerenderHeaderValue = event.node.req.headers[nitroPrerenderHeader];
    if (!nitroPrerenderHeaderValue) {
      return false;
    }
    if (!["", ".html"].includes(path.extname(nitroPrerenderHeaderValue))) {
      return false;
    }
    return true;
  }
});
