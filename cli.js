#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');

const { generateSdk } = require('./dist');
const package = require('./package.json');

async function main(opts, args) {
  if (args.length === 0) {
    throw new Error('No spec files given');
  }
  const specFiles = args.map((arg) => path.resolve(process.cwd(), arg));
  const outDir = path.resolve(process.cwd(), opts.outDir);
  await generateSdk(specFiles, outDir);
}

program
  .version(package.version)
  .name(package.name)
  .description(package.description)
  .requiredOption(
    '-o, --outDir <dir>',
    'path to a directory for a generated SDK',
  )
  .arguments('<specFiles...>');

program.parse(process.argv);

main(program.opts(), program.args).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
