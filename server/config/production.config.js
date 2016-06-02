const productionConfig = {
  name: 'production',
  server: {
    port: 1706,
    host: 'localhost'
  },
  services: {
    client: {
      mode: 'production',
      path: '/dists/production',
      host: 'localhost',
      port: 2706
    },
    logger: {
      mode: 'file',
      path: '/log'
    }
  }
};

module.exports = productionConfig;
