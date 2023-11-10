import { getRouteRules, defineEventHandler } from '#imports'

export default defineEventHandler((event) => {
  const routeRules = getRouteRules(event)
  console.log('route', event.path)
  console.log('rules', routeRules)
})