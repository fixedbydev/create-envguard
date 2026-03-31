import * as p from '@clack/prompts';
import chalk from 'chalk';
import { detectFramework, detectPackageManager, FRAMEWORK_NAMES } from './detect.js';
import { scaffold, printSummary } from './scaffold.js';
import type { Framework } from './detect.js';

const args = process.argv.slice(2);

const flags = {
  framework: getFlag('--framework') as Framework | undefined,
  docker: args.includes('--docker'),
  k8s: args.includes('--k8s'),
  skipInstall: args.includes('--skip-install'),
  dryRun: args.includes('--dry-run'),
};

const isAdd = args[0] === 'add';
const cwd = process.cwd();

function getFlag(name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

async function runInteractive(): Promise<void> {
  p.intro(chalk.bold('create-envguard'));

  const detected = detectFramework(cwd);
  const pm = detectPackageManager(cwd);

  const framework = await p.select({
    message: `Detected framework: ${chalk.cyan(FRAMEWORK_NAMES[detected])}. Confirm or override:`,
    options: [
      { value: detected, label: `${FRAMEWORK_NAMES[detected]} (detected)` },
      ...(['next', 'nestjs', 'vite', 'express', 'node'] as const)
        .filter((f) => f !== detected)
        .map((f) => ({ value: f, label: FRAMEWORK_NAMES[f] })),
    ],
  });

  if (p.isCancel(framework)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  const extras = await p.multiselect({
    message: 'Do you use any of these? (space to select)',
    options: [
      { value: 'docker', label: 'Docker / docker-compose' },
      { value: 'k8s', label: 'Kubernetes' },
    ],
    required: false,
  });

  if (p.isCancel(extras)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  const installCli = await p.confirm({
    message: 'Install CLI tools (env-guard check, diff, audit)?',
    initialValue: true,
  });

  if (p.isCancel(installCli)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  const s = p.spinner();
  s.start('Setting up envguard...');

  const result = scaffold({
    cwd,
    framework: framework as Framework,
    pm,
    extras: (extras ?? []) as ('docker' | 'k8s')[],
    installCli: installCli as boolean,
    skipInstall: flags.skipInstall,
    dryRun: flags.dryRun,
  });

  s.stop('Done!');
  printSummary(result);
  p.outro('Happy validating!');
}

async function runAdd(): Promise<void> {
  const framework = flags.framework ?? detectFramework(cwd);
  const pm = detectPackageManager(cwd);

  const extras: ('docker' | 'k8s')[] = [];
  if (flags.docker) extras.push('docker');
  if (flags.k8s) extras.push('k8s');

  if (flags.dryRun) {
    console.log(chalk.bold('\n  Dry run mode — no files will be written.\n'));
  }

  console.log(chalk.bold(`  Framework: ${chalk.cyan(FRAMEWORK_NAMES[framework])}`));
  console.log(chalk.bold(`  Package manager: ${chalk.cyan(pm)}`));
  if (extras.length > 0) {
    console.log(chalk.bold(`  Extras: ${chalk.cyan(extras.join(', '))}`));
  }
  console.log('');

  const result = scaffold({
    cwd,
    framework,
    pm,
    extras,
    installCli: true,
    skipInstall: flags.skipInstall,
    dryRun: flags.dryRun,
  });

  printSummary(result);
}

if (isAdd) {
  runAdd().catch(console.error);
} else {
  runInteractive().catch(console.error);
}
