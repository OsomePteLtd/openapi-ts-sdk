function parse() {
  const fs = require('fs');
  const template = fs.readFileSync('template/sdkClient.ts').toString();
  const formatted = `export function loadTemplate() {\n\treturn \`\n${template}\`}`;
  fs.writeFileSync('src/clientTemplateLoader.ts', formatted);
}
parse();
