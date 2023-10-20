<template>
  <div class="container custom-inlined">
    <h1 class="h1 my-6">
      This page loads an /api route that dynamically injects an inline style, everything should be green
    </h1>
    <h3 class="h3">
      The external /api route loads because:
    </h3>
    <ul>
      <li>
        It is referenced in useHead()
      </li>
      <li>
        script-src has 'strict-dynamic' and nonce
      </li>
    </ul>
    <h3 class="h3">
      The dynamically generated stylesheet loads because:
    </h3>
    <ul>
      <li>
        style-src has 'self'
      </li>
    </ul>

    <br>
    <h3 class="h3">
      How CSP works here
    </h3>
    <p>
      The external /api route loads because:
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
      <li>
        The 'link' tag was inserted into html at this point
      </li>
    </ul>
    <p>
      The dynamically-generated stylesheet was inlined because:
    </p>
    <ul>
      <li>
        The link tag has an href pointing to '/api/generated-css', which is self-hosted
      </li>
      <li>
        'self' was allowed in style-src
      </li>
    </ul>
    <p>You can observe this behaviour in your dev tools and observe how the 'head' tag is modified, and how the network activity shows the /api script loading, and then returning the inlined code</p>
  </div>
</template>
<script setup lang="ts">
useHead({
  link: [
    { rel: 'stylesheet', href: '/api/generated-css' }
  ]
})
</script>
