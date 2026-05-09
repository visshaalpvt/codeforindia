import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/d1/overview", permanent: true },
      { source: "/cases", destination: "/d1/cases", permanent: true },
      { source: "/cases/new", destination: "/d1/cases", permanent: true },
      { source: "/cases/:id", destination: "/d1/cases", permanent: true },
      { source: "/evidence", destination: "/d1/evidence", permanent: true },
      { source: "/timeline", destination: "/d1/timeline", permanent: true },
      { source: "/crime-map", destination: "/d1/crime-map", permanent: true },
      { source: "/sensors", destination: "/d1/sensors", permanent: true },
      { source: "/custody", destination: "/d1/custody", permanent: true },
      { source: "/notifications", destination: "/d1/notifications", permanent: true },
      { source: "/autopsy", destination: "/d2/autopsy", permanent: true },
      { source: "/tod", destination: "/d2/tod", permanent: true },
      { source: "/anomalies", destination: "/d3/anomalies", permanent: true },
      { source: "/correlation", destination: "/d3/correlation", permanent: true },
      { source: "/ai-summary", destination: "/d3/ai-summary", permanent: true },
      { source: "/chat", destination: "/d3/chat", permanent: true },
      { source: "/reports", destination: "/d3/reports", permanent: true },
    ];
  },
};

export default nextConfig;
