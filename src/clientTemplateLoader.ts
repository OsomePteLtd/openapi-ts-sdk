export function loadTemplate() {
  return require('fs').readFileSync('./template/sdkClient.ts').toString();
}
