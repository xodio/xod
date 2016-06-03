module.exports = {
  MODE: {
    DEVELOPMENT: {
      NAME: 'development',
      SERVER: {
        PORT: 1705,
        HOST: 'localhost'
      },
      SERVICES: {
        LOGGER: {
          MODE: 'console'
        }
      }
    },
    PRODUCTION: {
      NAME: 'production',
      SERVER: {
        PORT: 1706,
        HOST: 'localhost'
      },
      SERVICES: {
        LOGGER: {
          MODE: 'console'
        }
      }
    },
    TEST: {
      NAME: 'test',
      SERVER: {
        PORT: 1707,
        HOST: 'localhost'
      },
      SERVICES: {
        LOGGER: {
          MODE: 'console'
        }
      }
    }
  }
};
