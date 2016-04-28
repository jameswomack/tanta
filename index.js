require('./src/app').default;

if (module.hot)
  module.hot.accept('./src/app', () => {
    require('./src/app').default;
  });
