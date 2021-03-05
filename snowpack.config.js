// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: "/dist",
    public: "/"
  },
  buildOptions: {
    htmlFragments: true
  },
  alias: {
    "@app": "./src"
  }
};
