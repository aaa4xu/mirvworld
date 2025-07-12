import { $ } from 'bun';
import fs from 'node:fs/promises';
import path from 'node:path';

const target = './packages/openfront/src';
const headDir = 'master';
const goldsrc = path.join(target, headDir);
const versions = (await fs.readdir(target)).filter((v) => v !== headDir && !v.startsWith('.'));

try {
  await $`git -v`.text();
} catch (err) {
  console.error('Error: git is required to run this script');
  process.exit(1);
}

if (await fs.exists(goldsrc)) {
  console.log('Updating game sources...');
  await $`cd ${goldsrc} && git pull`;
} else {
  console.log('Cloning game sources...');
  await $`git clone https://github.com/openfrontio/OpenFrontIO.git ${goldsrc}`;
}

for (const version of versions) {
  console.log(`Preparing version ${version}...`);
  const versionPath = path.join(target, version);
  const gamePath = path.join(versionPath, 'src');
  const patchesPath = path.join(versionPath, 'patches');
  await $`rm -rf ${gamePath} && cp -r ${goldsrc} ${gamePath} && cd ${gamePath} && git checkout ${version}`.quiet();

  const patches = await fs.readdir(patchesPath).catch(() => []);
  for (const patch of patches) {
    const patchPath = path.resolve(path.join(patchesPath, patch));
    console.log(`- Applying patch ${patch}...`);
    await $`cd ${gamePath} && git apply ${patchPath}`.quiet();
  }
}

console.log('Done!');
