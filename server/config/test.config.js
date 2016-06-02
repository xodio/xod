export const testConfig = {
  name: 'test',
  server: {
    port: 1707,
    host: 'localhost'
  },
  services: {
    client: {
      mode: 'test',
      path: '/diests/test',
      port: 2707,
      host: 'localhost'
    }
  }
};
