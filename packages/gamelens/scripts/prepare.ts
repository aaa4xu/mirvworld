import { $ } from 'bun';
import fs from 'node:fs/promises';
import path from 'node:path';

const goldsrc = './versions/master';
const versions = (await fs.readdir('./versions')).filter((v) => v !== 'master');

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
  const gamePath = `./versions/${version}/game`;
  const patchesPath = `./versions/${version}/patches`;
  await $`rm -rf ${gamePath} && cp -r ${goldsrc} ${gamePath} && cd ${gamePath} && git checkout ${version}`.quiet();

  const patches = await fs.readdir(patchesPath).catch(() => []);
  for (const patch of patches) {
    const patchPath = path.resolve(`${patchesPath}/${patch}`);
    console.log(`- Applying patch ${patch}...`);
    await $`cd ${gamePath} && git apply ${patchPath}`.quiet();
  }
}

console.log('Done!');
