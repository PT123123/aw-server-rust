const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: "cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",
    fixturesFolder: "cypress/fixtures",
    baseUrl: "http://localhost:5600",
    testIsolation: false,
  },

  component: {
    devServer: {
      framework: "vue-cli",
      bundler: "webpack",
    },
    specPattern: "aw-webui/cypress/component/**/*.cy.{js,jsx,ts,tsx}",
  },
});
