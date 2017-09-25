<template lang='jade'>
  footer.p2.bg--off-white
    .contain
      p
        em 2017 muphy & oosai
      //- p Using Gekko v{{ version.gekko }} and Gekko UI v{{ version.ui }}.
</template>

<script>
const gekkoPackage = require('../../../../../package.json');
const uiPackage = require('../../../package.json');

export default {
  data: () => {
    return {
      version: {
        gekko: gekkoPackage.version,
        ui: uiPackage.version
      }
    }
  }
}
</script>
