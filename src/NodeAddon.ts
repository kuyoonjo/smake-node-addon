import { LLVM } from '@smake/llvm';
import { join, resolve } from '@smake/utils';
import { relative } from 'path';
import { ccPath } from './ccPath';
import { downloadNodejs, NODEJS_CACHE_DIR } from './downloadNodejs';

export class NodeAddon extends LLVM {
  NODE_VERSION = process.version;
  get type() {
    return 'shared' as any;
  }
  protected _sharedOutPrefix = '';
  protected _sharedOutSuffix = '.node';
  protected _msvcCRT: 'MD' | 'MT' = 'MT';

  get cxflags() {
    if (this._cxflags === undefined) {
      if (this.target.includes('apple')) {
        this._cxflags = [
          '-Qunused-arguments',
          '-Daddon_EXPORTS',
          '-D_DARWIN_USE_64_BIT_INODE=1',
          '-D_LARGEFILE_SOURCE',
          '-D_FILE_OFFSET_BITS=64',
          '-DBUILDING_NODE_EXTENSION',
          '-fPIC',
        ];
      } else if (this.target.includes('windows-msvc')) {
        this._cxflags = [
          ...super.cxflags,
          '-Daddon_EXPORTS',
          '/EHsc',
        ];
      } else {
        this._cxflags = [
          `--sysroot ${this.sysroot}`,
          '-Qunused-arguments',
          '-Daddon_EXPORTS',
          '-fPIC',
        ];
      }
    }
    return this._cxflags;
  }

  get shflags() {
    if (this._shflags === undefined) {
      if (this.target.includes('apple')) {
        this._shflags = [
          ...super.shflags,
          '-D_DARWIN_USE_64_BIT_INODE=1',
          '-D_LARGEFILE_SOURCE',
          '-D_FILE_OFFSET_BITS=64',
          '-DBUILDING_NODE_EXTENSION',
          '-dynamiclib',
          '-Wl,-headerpad_max_install_names',
          '-undefined',
          'dynamic_lookup',
        ];
      } else if (this.target.includes('windows-msvc')) {
        this._shflags = [
          ...super.shflags,
          '/DELAYLOAD:NODE.EXE',
        ];
      } else {
        this._shflags = super.shflags;
      }
    }
    return this._shflags;
  }

  get includedirs() {
    if (this._includedirs === undefined) {
      const cacheDir = join(NODEJS_CACHE_DIR, this.NODE_VERSION);
      this._includedirs = [
        ...super.includedirs,
        `${cacheDir}/include/node`,
        resolve(process.cwd(), 'node_modules', 'nan'),
        resolve(process.cwd(), 'node_modules', 'node-addon-api'),
      ];
    }
    return this._includedirs;
  }
  set includedirs(v) {
    this._includedirs = v;
  }

  get linkdirs() {
    if (this._linkdirs === undefined) {
      if (this.target.includes('windows-msvc')) {
        const cacheDir = join(NODEJS_CACHE_DIR, this.NODE_VERSION);
        this._linkdirs = [
          ...super.linkdirs,
          `${cacheDir}/lib/${this.target.startsWith('x86_64') ? 'win-x64' : 'win-x86'
          }`,
        ];
      } else {
        this._linkdirs = super.linkdirs;
      }
    }
    return this._linkdirs;
  }
  set linkdirs(v) {
    this._linkdirs = v;
  }

  get libs() {
    if (this._libs === undefined) {
      if (this.target.includes('windows-msvc')) {
        this._libs = [
          ...super.libs,
          'node',
          'kernel32',
          'user32',
          'gdi32',
          'winspool',
          'shell32',
          'ole32',
          'oleaut32',
          'uuid',
          'comdlg32',
          'advapi32',
          'delayimp',
        ];
      } else {
        this._libs = super.libs;
      }
    }
    return this._libs;
  }
  set libs(v) {
    this._libs = v;
  }

  async generateCommands(first: boolean, last: boolean) {
    await downloadNodejs(this.NODE_VERSION);
    return super.generateCommands(first, last);
  }

  async buildObjs() {
    if (this.target.includes('windows-msvc')) {
      const file = `${relative(process.cwd(), ccPath).replace(
        /\\/g,
        '/'
      )}/win_delay_load_hook.cc`;
      if (!this.files.includes(file))
        this.files.push(file);
    }

    return super.buildObjs();
  }
}
