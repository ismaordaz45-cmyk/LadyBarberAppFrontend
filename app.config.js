const { validateEasBuildEnvironment } = require('./scripts/build-security.cjs');

module.exports = ({ config }) => {
  validateEasBuildEnvironment(process.env);
  return config;
};
