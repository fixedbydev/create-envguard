import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { detectFramework, detectPackageManager, getInstallCommand } from '../src/detect.js';

const TEST_DIR = join(tmpdir(), 'create-envguard-detect-' + process.pid);

function setup() {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
}

function writePkg(deps: Record<string, string> = {}, devDeps: Record<string, string> = {}) {
  writeFileSync(
    join(TEST_DIR, 'package.json'),
    JSON.stringify({ dependencies: deps, devDependencies: devDeps }),
    'utf-8',
  );
}

function writeLock(file: string) {
  writeFileSync(join(TEST_DIR, file), '', 'utf-8');
}

function cleanup() {
  for (const f of ['package.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock']) {
    const p = join(TEST_DIR, f);
    if (existsSync(p)) unlinkSync(p);
  }
}

describe('detectFramework', () => {
  afterEach(cleanup);

  it('should detect Next.js', () => {
    setup();
    writePkg({ next: '^14.0.0' });
    expect(detectFramework(TEST_DIR)).toBe('next');
  });

  it('should detect NestJS', () => {
    setup();
    writePkg({ '@nestjs/core': '^10.0.0' });
    expect(detectFramework(TEST_DIR)).toBe('nestjs');
  });

  it('should detect Vite', () => {
    setup();
    writePkg({}, { vite: '^5.0.0' });
    expect(detectFramework(TEST_DIR)).toBe('vite');
  });

  it('should detect Express', () => {
    setup();
    writePkg({ express: '^4.0.0' });
    expect(detectFramework(TEST_DIR)).toBe('express');
  });

  it('should fallback to node when no framework detected', () => {
    setup();
    writePkg({ lodash: '^4.0.0' });
    expect(detectFramework(TEST_DIR)).toBe('node');
  });

  it('should fallback to node when no package.json', () => {
    setup();
    expect(detectFramework(join(TEST_DIR, 'nonexistent'))).toBe('node');
  });
});

describe('detectPackageManager', () => {
  afterEach(cleanup);

  it('should detect pnpm', () => {
    setup();
    writeLock('pnpm-lock.yaml');
    expect(detectPackageManager(TEST_DIR)).toBe('pnpm');
  });

  it('should detect yarn', () => {
    setup();
    writeLock('yarn.lock');
    expect(detectPackageManager(TEST_DIR)).toBe('yarn');
  });

  it('should detect bun', () => {
    setup();
    writeLock('bun.lockb');
    expect(detectPackageManager(TEST_DIR)).toBe('bun');
  });

  it('should detect bun.lock', () => {
    setup();
    writeLock('bun.lock');
    expect(detectPackageManager(TEST_DIR)).toBe('bun');
  });

  it('should default to npm', () => {
    setup();
    expect(detectPackageManager(TEST_DIR)).toBe('npm');
  });
});

describe('getInstallCommand', () => {
  it('should generate npm install command', () => {
    expect(getInstallCommand('npm', ['foo', 'bar'])).toBe('npm install foo bar');
  });

  it('should generate npm dev install command', () => {
    expect(getInstallCommand('npm', ['foo'], true)).toBe('npm install --save-dev foo');
  });

  it('should generate pnpm add command', () => {
    expect(getInstallCommand('pnpm', ['foo'])).toBe('pnpm add foo');
  });

  it('should generate pnpm dev add command', () => {
    expect(getInstallCommand('pnpm', ['foo'], true)).toBe('pnpm add -D foo');
  });

  it('should generate yarn add command', () => {
    expect(getInstallCommand('yarn', ['foo'])).toBe('yarn add foo');
  });

  it('should generate bun add command', () => {
    expect(getInstallCommand('bun', ['foo'])).toBe('bun add foo');
  });

  it('should generate bun dev add command', () => {
    expect(getInstallCommand('bun', ['foo'], true)).toBe('bun add -d foo');
  });
});
