const fs = require('node:fs');

const REQUIRED_SIGNATURE_MARKER = 'jar verified.';
const CRITICAL_SIGNATURE_WARNINGS = [
  /jar is unsigned/i,
  /contains unsigned entries/i,
  /signature[^\n]*(?:invalid|error)/i,
  /unable to verify/i,
  /certificate has expired/i,
  /certificate is not yet valid/i,
  /does(?: not|n't) allow code signing/i,
];

const validatePublicApiUrl = (rawUrl) => {
  const candidate = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!candidate) {
    throw new Error('EXPO_PUBLIC_API_URL es obligatoria durante EAS Build.');
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL debe ser una URL absoluta valida.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL debe utilizar HTTPS.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('EXPO_PUBLIC_API_URL no debe contener credenciales.');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('EXPO_PUBLIC_API_URL no debe contener query ni fragmentos.');
  }

  const pathname = parsed.pathname.replace(/\/+$/, '');
  if (pathname !== '/api') {
    throw new Error('EXPO_PUBLIC_API_URL debe terminar exactamente en /api.');
  }

  return `${parsed.origin}${pathname}`;
};

const validateEasBuildEnvironment = (env = process.env) => {
  if (env.EAS_BUILD !== 'true') return undefined;
  return validatePublicApiUrl(env.EXPO_PUBLIC_API_URL);
};

const assertJarsignerVerification = (report) => {
  if (typeof report !== 'string' || !report.trim()) {
    throw new Error('La evidencia de jarsigner esta vacia.');
  }
  if (!report.includes(REQUIRED_SIGNATURE_MARKER)) {
    throw new Error('jarsigner no confirmo que el AAB tenga una firma valida.');
  }
  const criticalWarning = CRITICAL_SIGNATURE_WARNINGS.find((pattern) => pattern.test(report));
  if (criticalWarning) {
    throw new Error('jarsigner reporto una advertencia critica de firma.');
  }
};

const runCli = (argv) => {
  const [command, filePath] = argv;
  if (command !== 'verify-signature-report' || !filePath) {
    throw new Error('Uso: node scripts/build-security.cjs verify-signature-report <archivo>');
  }
  const report = fs.readFileSync(filePath, 'utf8');
  assertJarsignerVerification(report);
};

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  assertJarsignerVerification,
  validateEasBuildEnvironment,
  validatePublicApiUrl,
};
