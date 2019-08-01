const config = {
  api: {
    version: 'v1',
    port: 8910,
    rateLimit: {
      burst: 100,
      rate: 10,
      ip: true, // Set to true if directly exposed to the internet.
      xff: false, // Set to true if behind a reverse proxy or similar.
      maxKeys: 100000
    }
  }
};

export default config;
