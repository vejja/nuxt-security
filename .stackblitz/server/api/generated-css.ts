import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  event.node.res.setHeader('Content-Type', 'text/css')
  const text = `
    .custom-inlined {
        color: green
    }
  `
  return text
})
