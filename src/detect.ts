import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Supported frameworks. */
export type Framework = 'next' | 'nestjs' | 'vite' | 'express' | 'node';

/** Supported package managers. */
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

/**
 * Detect the framework from package.json dependencies.
 *
 * @param cwd - The project directory.
 * @returns The detected framework, or `'node'` as fallback.
 */
export function detectFramework(cwd: string): Framework {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return 'node';

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if (allDeps['next']) return 'next';
    if (allDeps['@nestjs/core']) return 'nestjs';
    if (allDeps['vite']) return 'vite';
    if (allDeps['express']) return 'express';
  } catch {
    // Invalid package.json
  }

  return 'node';
}

/**
 * Detect the package manager by checking for lock files.
 *
 * @param cwd - The project directory.
 * @returns The detected package manager.
 */
export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

/**
 * Get the install command for a package manager.
 */
export function getInstallCommand(
  pm: PackageManager,
  packages: string[],
  dev: boolean = false,
): string {
  const pkgs = packages.join(' ');
  switch (pm) {
    case 'bun':
      return `bun add ${dev ? '-d ' : ''}${pkgs}`;
    case 'pnpm':
      return `pnpm add ${dev ? '-D ' : ''}${pkgs}`;
    case 'yarn':
      return `yarn add ${dev ? '-D ' : ''}${pkgs}`;
    default:
      return `npm install ${dev ? '--save-dev ' : ''}${pkgs}`;
  }
}

/** Framework display names. */
export const FRAMEWORK_NAMES: Record<Framework, string> = {
  next: 'Next.js',
  nestjs: 'NestJS',
  vite: 'Vite',
  express: 'Express',
  node: 'Node.js',
};
