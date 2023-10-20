import { defineEventHandler, getRequestHeader, createError, setHeader, getRouteRules, useStorage } from "#imports";
const storage = useStorage("#storage-driver");
export default defineEventHandler(async (event) => {
  const routeRules = getRouteRules(event);
  const rateLimiterConfig = routeRules.security.rateLimiter;
  if (rateLimiterConfig !== false) {
    const ip = getIP(event);
    let storageItem = await storage.getItem(ip);
    if (!storageItem) {
      await setStorageItem(rateLimiterConfig, ip);
    } else {
      if (typeof storageItem !== "object") {
        return;
      }
      const timeSinceFirstRateLimit = storageItem.date;
      const timeForInterval = storageItem.date + rateLimiterConfig?.interval;
      if (Date.now() >= timeForInterval) {
        await setStorageItem(rateLimiterConfig, ip);
        storageItem = await storage.getItem(ip);
      }
      const isLimited = timeSinceFirstRateLimit <= timeForInterval && storageItem.value === 0;
      if (isLimited) {
        const tooManyRequestsError = {
          statusCode: 429,
          statusMessage: "Too Many Requests"
        };
        if (rateLimiterConfig.headers) {
          setHeader(event, "x-ratelimit-remaining", 0);
          setHeader(event, "x-ratelimit-limit", rateLimiterConfig?.tokensPerInterval);
          setHeader(event, "x-ratelimit-reset", timeForInterval);
        }
        if (rateLimiterConfig.throwError === false) {
          return tooManyRequestsError;
        }
        throw createError(tooManyRequestsError);
      }
      const newItemDate = timeSinceFirstRateLimit > timeForInterval ? Date.now() : storageItem.date;
      const newStorageItem = { value: storageItem.value - 1, date: newItemDate };
      await storage.setItem(ip, newStorageItem);
      const currentItem = await storage.getItem(ip);
      if (currentItem && rateLimiterConfig.headers) {
        setHeader(event, "x-ratelimit-remaining", currentItem.value);
        setHeader(event, "x-ratelimit-limit", rateLimiterConfig?.tokensPerInterval);
        setHeader(event, "x-ratelimit-reset", timeForInterval);
      }
    }
  }
});
async function setStorageItem(rateLimiterConfig, ip) {
  const rateLimitedObject = { value: rateLimiterConfig?.tokensPerInterval, date: Date.now() };
  await storage.setItem(ip, rateLimitedObject);
}
function getIP(event) {
  const req = event?.node?.req;
  let xForwardedFor = getRequestHeader(event, "x-forwarded-for");
  if (xForwardedFor === "::1") {
    xForwardedFor = "127.0.0.1";
  }
  const transformedXForwardedFor = xForwardedFor?.split(",")?.pop()?.trim() || "";
  const remoteAddress = req?.socket?.remoteAddress || "";
  let ip = transformedXForwardedFor || remoteAddress;
  if (ip) {
    ip = ip.split(":")[0];
  }
  return ip;
}
