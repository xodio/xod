export const developmentConfig = {
  name: 'development',
  server: {
    port: 1705,
    host: 'localhost'
  },
  services: {
    client: {
      mode: 'development',
      path: '/dists/development',
      port: 2705,
      host: 'localhost'
    },
    logger: {
      mode: 'console'
    }
  }
};
