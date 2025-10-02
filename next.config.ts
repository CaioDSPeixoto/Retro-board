import type { NextConfig } from "next";
import packageJson from "./package.json";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: packageJson.version,
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
