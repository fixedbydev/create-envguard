import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { scaffold } from '../src/scaffold.js';

const TEST_DIR = join(tmpdir(), 'create-envguard-scaffold-' + process.pid);

function setup() {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
}

function writePkg(scripts: Record<string, string> = {}) {
  writeFileSync(
    join(TEST_DIR, 'package.json'),
    JSON.stringify({ name: 'test', scripts }, null, 2),
    'utf-8',
  );
}

function writeEnv(content: string) {
  writeFileSync(join(TEST_DIR, '.env'), content, 'utf-8');
}

describe('scaffold', () => {
  beforeEach(() => {
    setup();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create env.schema.ts for Next.js', () => {
    writePkg();

    scaffold({
      cwd: TEST_DIR,
      framework: 'next',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const schema = readFileSync(join(TEST_DIR, 'env.schema.ts'), 'utf-8');
    expect(schema).toContain("import { guard } from '@stacklance/envguard-core'");
    expect(schema).toContain('NEXT_PUBLIC_API_URL');
  });

  it('should create env.schema.ts for NestJS', () => {
    writePkg();

    scaffold({
      cwd: TEST_DIR,
      framework: 'nestjs',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const schema = readFileSync(join(TEST_DIR, 'env.schema.ts'), 'utf-8');
    expect(schema).toContain('PORT');
    expect(schema).toContain('DATABASE_URL');
  });

  it('should create env.schema.ts for Vite', () => {
    writePkg();

    scaffold({
      cwd: TEST_DIR,
      framework: 'vite',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const schema = readFileSync(join(TEST_DIR, 'env.schema.ts'), 'utf-8');
    expect(schema).toContain('VITE_API_URL');
  });

  it('should create env.schema.ts for Express', () => {
    writePkg();

    scaffold({
      cwd: TEST_DIR,
      framework: 'express',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const schema = readFileSync(join(TEST_DIR, 'env.schema.ts'), 'utf-8');
    expect(schema).toContain('PORT');
  });

  it('should create env.schema.ts for plain Node', () => {
    writePkg();

    scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const schema = readFileSync(join(TEST_DIR, 'env.schema.ts'), 'utf-8');
    expect(schema).toContain('NODE_ENV');
    expect(schema).toContain('PORT');
  });

  it('should create .env.example from .env', () => {
    writePkg();
    writeEnv('PORT=3000\nSECRET_KEY=abc123\n');

    scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const example = readFileSync(join(TEST_DIR, '.env.example'), 'utf-8');
    expect(example).toContain('PORT=');
    expect(example).toContain('SECRET_KEY=');
    expect(example).not.toContain('3000');
    expect(example).not.toContain('abc123');
  });

  it('should add .env to .gitignore', () => {
    writePkg();
    writeFileSync(join(TEST_DIR, '.gitignore'), 'node_modules\n', 'utf-8');

    scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const gitignore = readFileSync(join(TEST_DIR, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('.env');
  });

  it('should not duplicate .env in .gitignore', () => {
    writePkg();
    writeFileSync(join(TEST_DIR, '.gitignore'), 'node_modules\n.env\n', 'utf-8');

    const result = scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    expect(result.filesModified).not.toContain('.gitignore');
  });

  it('should add scripts to package.json when CLI installed', () => {
    writePkg();

    scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: [],
      installCli: true,
      skipInstall: true,
      dryRun: false,
    });

    const pkg = JSON.parse(readFileSync(join(TEST_DIR, 'package.json'), 'utf-8'));
    expect(pkg.scripts['env:check']).toBe('env-guard check');
    expect(pkg.scripts['predev']).toBe('env-guard check');
    expect(pkg.scripts['prebuild']).toBe('env-guard check');
  });

  it('should include docker and k8s packages when extras selected', () => {
    const result = scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: ['docker', 'k8s'],
      installCli: false,
      skipInstall: true,
      dryRun: true,
    });

    expect(result.packagesInstalled).toContain('@stacklance/envguard-docker');
    expect(result.packagesInstalled).toContain('@stacklance/envguard-k8s');
  });

  it('should not write files in --dry-run mode', () => {
    writePkg();

    const result = scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: [],
      installCli: true,
      skipInstall: true,
      dryRun: true,
    });

    expect(result.filesCreated).toContain('env.schema.ts');
    expect(existsSync(join(TEST_DIR, 'env.schema.ts'))).toBe(false);
  });

  it('should not overwrite existing env.schema.ts', () => {
    writePkg();
    writeFileSync(join(TEST_DIR, 'env.schema.ts'), 'existing', 'utf-8');

    scaffold({
      cwd: TEST_DIR,
      framework: 'node',
      pm: 'npm',
      extras: [],
      installCli: false,
      skipInstall: true,
      dryRun: false,
    });

    const content = readFileSync(join(TEST_DIR, 'env.schema.ts'), 'utf-8');
    expect(content).toBe('existing');
  });
});
