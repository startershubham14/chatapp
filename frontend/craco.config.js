const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Override webpack dev server configuration to use newer options
      if (webpackConfig.devServer) {
        // Remove deprecated options
        delete webpackConfig.devServer.onAfterSetupMiddleware;
        delete webpackConfig.devServer.onBeforeSetupMiddleware;
        
        // Use newer setupMiddlewares option
        webpackConfig.devServer.setupMiddlewares = (middlewares, devServer) => {
          // Add any custom middleware here if needed
          return middlewares;
        };
      }
      return webpackConfig;
    },
  },
  devServer: {
    // Modern webpack dev server configuration
    setupMiddlewares: (middlewares, devServer) => {
      // Add any custom middleware here if needed
      return middlewares;
    },
    // Disable deprecation warnings
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  },
};
