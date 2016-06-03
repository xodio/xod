const developmentConfig = {
  name: 'development',
  server: {
    port: 8705,
    host: 'localhost'
  },
  services: {
    client: {
      mode: 'development',
      path: '/dists/development',
      port: 9705,
      host: 'localhost',
      script: 'export NODE_ENV="development" && npm run ng2-client'
    }
  }
};

module.exports = developmentConfig;
