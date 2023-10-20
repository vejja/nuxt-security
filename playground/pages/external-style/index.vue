<template>
  <div class="container custom-external">
    <h1 class="h1 my-6">
      This page loads an external CSS ressource that styles everthing blue
    </h1>

    <h3 class="h3">
      The external CSS loads because:
    </h3>
    <ul>
      <li>
        It is referenced in useHead()
      </li>
      <li>
        style-src has 'self'
      </li>
    </ul>

    <br>
    <h3 class="h3">
      How CSP works here
    </h3>
    <p>
      The external stylesheet loads because all self-hosted stylesheets are allowed
    </p>
    <ul>
      <li>
        When you navigated to this page, Nuxt regenerated the 'head' tag and inserted the 'link' element
      </li>
      <li>
        The stylesheet is self-hosted
      </li>
      <li>
        'self' is allowed by 'style-src'
      </li>
    </ul>
    <p>You can observe this behaviour in your dev tools and observe how the 'head' tag is modified, and how the network activity shows the stylesheet loading</p>
  </div>
</template>
<script setup lang="ts">
useHead({
  link: [
    { rel: 'stylesheet', href: '/external.css' }
  ]
})
</script>
