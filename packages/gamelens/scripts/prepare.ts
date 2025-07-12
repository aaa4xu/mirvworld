import { $ } from 'bun';
import fs from 'node:fs/promises';
import path from 'node:path';

const sharedRoot = path.resolve('./packages/gamelens/src/Shared');
const target = './gamelens';
const headDir = '.master';
const goldsrc = path.join(target, headDir);

const [, , argVersion] = Bun.argv;
let versions: string[];

if (argVersion) {
  versions = [argVersion];

  // Verify that the specified directory exists and is valid
  const versionPath = path.join(target, argVersion);
  try {
    const stat = await fs.stat(versionPath);
    if (!stat.isDirectory()) {
      console.error(`Error: '${argVersion}' is not a directory inside ${target}.`);
      process.exit(1);
    }
  } catch {
    console.error(`Error: version directory '${argVersion}' does not exist inside ${target}.`);
    process.exit(1);
  }
} else {
  versions = (await fs.readdir(target)).filter((v) => !v.startsWith('.'));
}

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
  const gamelensPath = path.join(gamePath, 'src', 'gamelens');
  const patchesPath = path.join(versionPath, 'patches');
  await $`rm -rf ${gamePath} && cp -r ${goldsrc} ${gamePath} && cd ${gamePath} && git checkout ${version}`.quiet();

  const patches = (await fs.readdir(patchesPath).catch(() => [])).sort((a, b) => a.localeCompare(b));
  for (const patch of patches) {
    const patchPath = path.resolve(path.join(patchesPath, patch));
    console.log(`- Applying patch ${patch}...`);
    await $`cd ${gamePath} && git apply ${patchPath}`.quiet();
  }
  console.log('- Copying shared files...');
  await $`cp -r ${sharedRoot} ${gamelensPath}`.quiet();
  await $`cd ${gamePath} && git add . && git commit -m "current gamelens state"`.quiet();
}

console.log('Done!');
