import prettier from 'prettier';

export async function format(source: string) {
  const config = await resolveConfig();
  return prettier.format(source, {
    ...config,
    parser: 'typescript',
  });
}

// private

async function resolveConfig() {
  const configFile = await prettier.resolveConfigFile();
  if (!configFile) {
    return {};
  }
  const options = await prettier.resolveConfig(configFile);
  return options || {};
}
