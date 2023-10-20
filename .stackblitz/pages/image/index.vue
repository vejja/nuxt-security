<template>
  <div class="container custom-inlined">
    <h1 class="h1 my-6">
      This page loads an image via NuxtImg
    </h1>
    <NuxtImg src="https://nuxt.com/assets/design-kit/icon-green.svg" crossorigin="anonymous" />
    <h3 class="h3">
      The image loads because:
    </h3>
    <ul>
      <li>
        We load NuxtImg with option 'domains: ['nuxt.com']' to whitelist the external domain nuxt.com
      </li>
      <li>
        img-src has 'self'
      </li>
    </ul>

    <br>
    <h3 class="h3">
      How CSP works here
    </h3>
    <p>
      The image loaded because:
    </p>
    <ul>
      <li>
        The NuxtImg module used an html image element to load the asset
      </li>
      <li>
        The asset is in fact provided by our server, which takes care of proxying the external nuxt.com site
      </li>
      <li>
        'self' was allowed in 'img-src'
      </li>
    </ul>
    <p>You can observe this behaviour in your dev tools and observe how the NuxtImg image source is loaded from a server route which is located at /_ipx/_/... and returns the image asset</p>
  </div>
</template>
