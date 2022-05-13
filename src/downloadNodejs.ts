import axios from 'axios';
import { createHash } from 'crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join, homedir } from '@smake/utils';
import { extract } from 'tar';
import { download } from './download';

const NODEJS_ORG_MIRROR = 'https://nodejs.org/dist';
export const NODEJS_CACHE_DIR =
  process.platform === 'win32'
    ? join(homedir(), 'AppData', 'Roaming', 'smake', 'nodejs')
    : join(homedir(), '.cache', 'smake', 'nodejs');

export async function downloadNodejs(ver: string = process.version) {
  const cacheDir = join(NODEJS_CACHE_DIR, ver);
  const mirror =
    process.env.NVM_NODEJS_ORG_MIRROR ||
    process.env.NODEJS_ORG_MIRROR ||
    NODEJS_ORG_MIRROR;
  const includeDir = join(cacheDir, 'include');
  const libDir = join(cacheDir, 'lib');
  const checksumFile = join(libDir, 'checksum.json');
  let checksum;
  if (existsSync(checksumFile))
    checksum = JSON.parse(readFileSync(checksumFile).toString());

  const headersName = `node-${ver}-headers.tar.gz`;
  const headersDist = join(cacheDir, headersName);

  const libName = 'node.lib';

  const x64libDirname = 'win-x64';
  const x64libName = `${x64libDirname}/${libName}`;
  const x64libDist = join(libDir, x64libDirname, libName);

  const x86libDirname = 'win-x86';
  const x86libName = `${x86libDirname}/${libName}`;
  const x86libDist = join(libDir, x86libDirname, libName);

  const includeDirCached = existsSync(includeDir);
  const x64libCached = existsSync(x64libDist);
  const x86libCached = existsSync(x86libDist);

  let noX86 =
    checksum && !checksum.find((x: any) => x.name.startsWith('win-x86'));

  if (includeDirCached && x64libCached && (noX86 || x86libCached)) return;

  const checksumUrl = `${mirror}/${ver}/SHASUMS256.txt`;
  const res = await axios.get(checksumUrl);
  const str = res.data as string;
  const data = str
    .trim()
    .split('\n')
    .map((l) => {
      const [checksum, name] = l.split(/\s+/);
      return { checksum, name };
    });
  mkdirSync(libDir, { recursive: true });
  writeFileSync(checksumFile, JSON.stringify(data, null, 2));
  noX86 = !data.find((x) => x.name.startsWith('win-x86'));

  if (!includeDirCached) {
    const headersUrl = `${mirror}/${ver}/${headersName}`;
    const headersChecksum = data.find((x) => x.name === headersName)?.checksum;
    await download(headersName, headersUrl, headersDist);
    const headersBuffer = readFileSync(headersDist);
    const headersChecksumComputed = createHash('sha256')
      .update(headersBuffer)
      .digest('hex');
    if (headersChecksumComputed !== headersChecksum) {
      throw `Checksum error: ${headersName} ${headersChecksum} ${headersChecksumComputed}`;
    }
    await extract({
      file: headersDist,
      cwd: cacheDir,
      strip: 1,
    });
  }

  if (!x64libCached) {
    const x64libUrl = `${mirror}/${ver}/${x64libName}`;
    const x64libChecksum = data.find((x) => x.name === x64libName)?.checksum;
    const x64libSaved = join(cacheDir, libName + '.x64');
    await download(x64libName, x64libUrl, x64libSaved);
    const x64libBuffer = readFileSync(x64libSaved);
    const x64libChecksumComputed = createHash('sha256')
      .update(x64libBuffer)
      .digest('hex');
    if (x64libChecksumComputed !== x64libChecksum) {
      throw `Checksum error: ${x64libName} ${x64libChecksum} ${x64libChecksumComputed}`;
    }
    const x64libDir = join(libDir, x64libDirname);
    mkdirSync(x64libDir, { recursive: true });
    copyFileSync(x64libSaved, x64libDist);
  }

  if (!noX86 && !x86libCached) {
    const x86libUrl = `${mirror}/${ver}/${x86libName}`;
    const x86libChecksum = data.find((x) => x.name === x86libName)?.checksum;
    const x86libSaved = join(cacheDir, libName + '.x86');
    await download(x86libName, x86libUrl, x86libSaved);
    const x86libBuffer = readFileSync(x86libSaved);
    const x86libChecksumComputed = createHash('sha256')
      .update(x86libBuffer)
      .digest('hex');
    if (x86libChecksumComputed !== x86libChecksum) {
      throw `Checksum error: ${x86libName} ${x86libChecksum} ${x86libChecksumComputed}`;
    }
    const x86libDir = join(libDir, x86libDirname);
    mkdirSync(x86libDir, { recursive: true });
    copyFileSync(x86libSaved, x86libDist);
  }
}
