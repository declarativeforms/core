import {
  parseFormYaml,
  validateFormDefinition,
} from '@declarativeforms/core';
import fs from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../../../../..');

describe('published YAML examples', () => {
  const yamlFiles = [
    ...findFiles(path.join(repositoryRoot, 'examples'), /\.ya?ml$/),
    ...findFiles(path.join(repositoryRoot, 'templates'), /\.ya?ml$/),
  ];

  test.each(yamlFiles)('%s matches the runtime schema', (file) => {
    expectValidYaml(file, fs.readFileSync(file, 'utf8'));
  });

  const documentationFiles = [
    path.join(repositoryRoot, 'README.md'),
    ...findFiles(path.join(repositoryRoot, 'docs'), /\.mdx?$/),
  ].filter((file) => path.basename(file) !== 'AGENTS.md');
  const documentationBlocks = documentationFiles.flatMap((file) =>
    readYamlBlocks(file),
  );

  test.each(documentationBlocks)(
    '$name matches the runtime schema',
    ({ file, source }) => {
      expectValidYaml(file, source);
    },
  );
});

function findFiles(directory: string, pattern: RegExp): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? findFiles(entryPath, pattern)
        : pattern.test(entry.name)
          ? [entryPath]
          : [];
    })
    .sort();
}

function readYamlBlocks(file: string): Array<{
  file: string;
  name: string;
  source: string;
}> {
  const markdown = fs.readFileSync(file, 'utf8');
  const blocks: Array<{ file: string; name: string; source: string }> = [];
  const pattern = /```yaml(?:[^\n]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(markdown))) {
    index += 1;
    blocks.push({
      file,
      name: `${path.relative(repositoryRoot, file)} YAML block ${index}`,
      source: match[1],
    });
  }

  return blocks;
}

function expectValidYaml(file: string, source: string): void {
  const definition = parseFormYaml(source);
  const errors = validateFormDefinition(definition);
  expect(errors).toEqual([]);
  expect(file).toBeTruthy();
}
