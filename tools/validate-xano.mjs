import { pathToFileURL } from "node:url";

const validatorPath = process.env.XANO_VALIDATOR_PATH;
const sourceDirectory = process.env.XANO_SOURCE_DIR;

if (!validatorPath || !sourceDirectory) {
  throw new Error("XANO_VALIDATOR_PATH and XANO_SOURCE_DIR are required.");
}

const { validateXanoscript } = await import(pathToFileURL(validatorPath).href);
const result = validateXanoscript({ directory: sourceDirectory, pattern: "**/*.xs" });

console.log(JSON.stringify({
  valid: result.valid,
  totalFiles: result.total_files,
  validFiles: result.valid_files,
  invalidFiles: result.invalid_files,
}, null, 2));

if (!result.valid) {
  console.error(result.message);
  process.exitCode = 1;
}
