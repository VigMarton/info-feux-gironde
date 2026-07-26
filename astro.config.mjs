import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://info-feux-gironde.com",
  trailingSlash: "always",
  redirects: {
    "/": "/fr/",
  },
});
