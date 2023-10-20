<template>
  <div class="container">
    <h1 class="h1 my-6">
      This page loads an external JS script that displays an alert
    </h1>
    <h3 class="h3">
      The external script loads because:
    </h3>
    <ul>
      <li>
        It is referenced in useHead()
      </li>
      <li>
        script-src has 'strict-dynamic' and nonce
      </li>
    </ul>

    <br>
    <h3 class="h3">
      How CSP works here
    </h3>
    <p>
      The external script loads because:
    </p>
    <ul>
      <li>
        When you navigated to this page, Nuxt regenerated the 'head' tag
      </li>
      <li>
        The Nuxt app is already pre-approved by nonce
      </li>
      <li>
        'strict-dynamic' allows any child script called by Nuxt to execute
      </li>
    </ul>
    <p>You can observe this behaviour in your dev tools and observe how the 'head' tag is modified, and how the network activity shows the script loading</p>
  </div>
</template>
<script setup lang="ts">
useHead({
  script: [
    { src: '/external.js' }
  ]
})
</script>
