import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  event.node.res.setHeader('Content-Type', 'application/javascript')
  const text = `
    console.log("I'm a script that was dynamically generated and then inlined, and I write logs to the console")
    alert("I'm a script that was dynamically generated and then inlined")
  `
  return text
})
