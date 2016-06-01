export const productionConfig = {
  name: 'production',
  server: {
    port: 1706,
    host: 'localhost'
  },
  services: {
    logger: {
      mode: 'console'
    }
  }
};
