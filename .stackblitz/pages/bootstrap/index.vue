<template>
  <div class="container">
    <h1 class="h1 my-6">
      This page loads Bootstrap CSS and Bootstrap JS
    </h1>

    <h3 class="h3">
      The ressources load because:
    </h3>
    <ul>
      <li> Both CSS and JS are referenced in useHead()</li>
      <li>script-src has 'strict-dynamic' and nonce</li>
      <li>style-src has 'https:'</li>
    </ul>
    <br>
    <h3 class="h3">
      How CSP works here
    </h3>
    <p>
      It is exactly the same mechanism as for self-hosted ressources, except that we fetch them from a CDN
    </p>
    <p>
      This requires the following settings:
    </p>
    <ul>
      <li>
        crossorigin on both ressources must be set to "anonymous" due to CORS (this has nothing to do with CSP)
      </li>
      <li>
        no change is required for script-src, because 'strict-dynamic' is set
      </li>
      <li>
        a change is required for style-src to allow external ressources, via 'https:'
      </li>
    </ul>

    <p>
      Setting style-src to 'https:' is perfectly CSP compliant because:
    </p>
    <ul>
      <li>
        'strict-dynamic' does not exist on style-src elements
      </li>
      <li>
        nonces do not apply to external stylesheets on style-src elements (they only work on inlined styles)
      </li>
    </ul>
    <p>If you want to be even stricter, you can set style-src to 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css'</p>
  </div>
</template>
<script setup lang="ts">
useHead({
  script: () => [
    { src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js', integrity: 'sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL', crossorigin: 'anonymous' }
  ],
  link: () => [
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css', integrity: 'sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN', crossorigin: 'anonymous' }
  ]
})
</script>
