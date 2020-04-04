import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as path from 'path'
import {SemVer} from 'semver'
import semver from 'semver/preload'

export const MinimumAutoVersion = new SemVer('9.25.0')

export interface IAutoCommandManager {
  // Setup commands
  info(listPlugins: boolean): Promise<string>

  // Release commands
  version(onlyPublishWithReleaseVersion: boolean, from: string): Promise<string>

  changelog(
    dryRun: boolean,
    noVersionPrefix: boolean,
    name: string,
    email: string,
    from: string,
    to: string,
    title: string,
    message: string,
    baseBranch: string
  ): Promise<void>

  release(
    dryRun: boolean,
    noVersionPrefix: boolean,
    name: string,
    email: string,
    from: string,
    useVersion: string,
    baseBranch: string,
    preRelease: boolean
  ): Promise<void>

  shipit(
    dryRun: boolean,
    baseBranch: string,
    onlyGraduateWithReleaseLabel: boolean
  ): Promise<void>

  latest(dryRun: boolean, baseBranch: string): Promise<void>

  next(dryRun: boolean, message: string): Promise<void>

  canary(
    dryRun: boolean,
    pr: number,
    build: string,
    message: string,
    force: boolean
  ): Promise<void>

  // Pull Request Interaction commands
  label(pr: number): Promise<string>

  prStatus(
    dryRun: boolean,
    pr: number,
    context: string,
    url: string,
    sha: string,
    state: PrState,
    description: string
  ): Promise<void>

  prCheck(
    dryRun: boolean,
    pr: number,
    context: string,
    url: string
  ): Promise<string>

  prBody(
    dryRun: boolean,
    pr: number,
    context: string,
    message: string
  ): Promise<void>

  comment(
    dryRun: boolean,
    pr: number,
    context: string,
    message: string,
    edit: boolean,
    del: boolean
  ): Promise<void>
}

export async function createCommandManager(
  repo: string,
  owner: string,
  githubApi: string,
  plugins: string[]
): Promise<IAutoCommandManager> {
  return await AutoCommandManager.createCommandManager(
    repo,
    owner,
    githubApi,
    plugins
  )
}

class AutoCommandManager implements IAutoCommandManager {
  private autoEnv = {}
  private autoCommand = ''
  private globalArgs: string[] = []
  // Private constructor; use createCommandManager(
  constructor() {}

  async info(listPlugins: boolean): Promise<string> {
    const args: string[] = [AutoCommand.info]
    if (listPlugins) {
      args.push('--list-plugins')
    }
    const output = await this.execAuto(args)
    return output.stdout
  }

  async version(
    onlyPublishWithReleaseVersion: boolean,
    from: string
  ): Promise<string> {
    const args = ['version']
    if (onlyPublishWithReleaseVersion) {
      args.push('--only-publish-with-release-label')
    }
    if (from) {
      args.push('--from', from)
    }
    const output = await this.execAuto(args)
    return output.stdout
  }

  async changelog(
    dryRun: boolean,
    noVersionPrefix: boolean,
    name: string,
    email: string,
    from: string,
    to: string,
    title: string,
    message: string,
    baseBranch: string
  ): Promise<void> {
    const args: string[] = [AutoCommand.changelog]
    AutoCommandManager.commonChangelogReleaseArgs(
      args,
      dryRun,
      noVersionPrefix,
      name,
      email,
      from
    )
    if (to) {
      args.push('--to', to)
    }
    if (title) {
      args.push('--title', title)
    }
    if (message) {
      args.push('--message', message)
    }
    if (baseBranch) {
      args.push('--base-branch', baseBranch)
    }
    await this.execAuto(args)
  }

  async release(
    dryRun: boolean,
    noVersionPrefix: boolean,
    name: string,
    email: string,
    from: string,
    useVersion: string,
    baseBranch: string,
    preRelease: boolean
  ): Promise<void> {
    const args: string[] = [AutoCommand.release]
    AutoCommandManager.commonChangelogReleaseArgs(
      args,
      dryRun,
      noVersionPrefix,
      name,
      email,
      from
    )
    if (useVersion) {
      args.push('--use-version', useVersion)
    }
    if (baseBranch) {
      args.push('--base-branch', baseBranch)
    }
    if (preRelease) {
      args.push('--pre-release')
    }
    await this.execAuto(args)
  }

  async shipit(
    dryRun: boolean,
    baseBranch: string,
    onlyGraduateWithReleaseLabel: boolean
  ): Promise<void> {
    const args: string[] = [AutoCommand.shipit]
    if (dryRun) {
      args.push('--dry-run')
    }
    if (baseBranch) {
      args.push('--base-branch', baseBranch)
    }
    if (onlyGraduateWithReleaseLabel) {
      args.push('--only-graduate-with-release-label')
    }
    await this.execAuto(args)
  }

  async next(dryRun: boolean, message: string): Promise<void> {
    const args: string[] = [AutoCommand.next]
    if (dryRun) {
      args.push('--dry-run')
    }
    if (message) {
      args.push('--message', message)
    }
    await this.execAuto(args)
  }

  async canary(
    dryRun: boolean,
    pr: number,
    build: string,
    message: string,
    force: boolean
  ): Promise<void> {
    const args: string[] = [AutoCommand.canary]
    if (dryRun) {
      args.push('--dry-run')
    }
    if (pr > 0) {
      args.push('--pr', pr.toString())
    }
    if (build) {
      args.push('--build', build)
    }
    if (message) {
      args.push('--message', message)
    }
    if (force) {
      args.push('--force')
    }
    await this.execAuto(args)
  }

  async label(pr: number): Promise<string> {
    const args: string[] = [AutoCommand.label]
    if (pr > 0) {
      args.push('--pr', pr.toString())
    }
    const output = await this.execAuto(args)
    return output.stdout
  }

  async latest(dryRun: boolean, baseBranch: string): Promise<void> {
    const args: string[] = [AutoCommand.latest]
    if (dryRun) {
      args.push('--dry-run')
    }
    if (baseBranch) {
      args.push('--base-branch', baseBranch)
    }
    await this.execAuto(args)
  }

  async prStatus(
    dryRun: boolean,
    pr: number,
    context: string,
    url: string,
    sha: string,
    state: PrState,
    description: string
  ): Promise<void> {
    const args: string[] = [AutoCommand.prStatus]
    AutoCommandManager.commonPrArgs(args, dryRun, pr, context)
    if (url) {
      args.push('--url', url)
    }
    if (sha) {
      args.push('--sha', sha)
    }
    if (state) {
      args.push('--state', state)
    }
    if (description) {
      args.push('--description', description)
    }
    this.execAuto(args)
  }

  async prCheck(
    dryRun: boolean,
    pr: number,
    context: string,
    url: string
  ): Promise<string> {
    const args: string[] = [AutoCommand.prCheck]
    AutoCommandManager.commonPrArgs(args, dryRun, pr, context)
    if (url) {
      args.push('--url', url)
    }
    const output = await this.execAuto(args)
    return output.stdout
  }

  async prBody(
    dryRun: boolean,
    pr: number,
    context: string,
    message: string
  ): Promise<void> {
    const args: string[] = [AutoCommand.prBody]
    AutoCommandManager.commonPrArgs(args, dryRun, pr, context)
    if (message) {
      args.push('--message', message)
    }
    this.execAuto(args)
  }

  async comment(
    dryRun: boolean,
    pr: number,
    context: string,
    message: string,
    edit: boolean,
    del: boolean
  ): Promise<void> {
    const args: string[] = [AutoCommand.comment]
    AutoCommandManager.commonPrArgs(args, dryRun, pr, context)
    if (message) {
      args.push('--message', message)
    }
    if (edit) {
      args.push('--edit')
    }
    if (del) {
      args.push('--delete')
    }
    this.execAuto(args)
  }

  static async createCommandManager(
    repo: string,
    owner: string,
    githubApi: string,
    plugins: string[]
  ): Promise<AutoCommandManager> {
    const result = new AutoCommandManager()
    await result.initializeCommandManager(repo, owner, githubApi, plugins)
    return result
  }

  private async execAuto(
    args: string[],
    allowAllExitCodes = false
  ): Promise<AutoOutput> {
    const result = new AutoOutput()

    const env = {}
    for (const key of Object.keys(process.env)) {
      env[key] = process.env[key]
    }
    for (const key of Object.keys(this.autoEnv)) {
      env[key] = this.autoEnv[key]
    }

    const stdout: string[] = []

    const options = {
      cwd: path.resolve(__dirname),
      env,
      ignoreReturnCode: allowAllExitCodes,
      listeners: {
        stdout: (data: Buffer) => {
          stdout.push(data.toString())
        }
      }
    }
    const execArgs = [...this.globalArgs, ...args]

    result.exitCode = await exec.exec(
      `"${this.autoCommand}"`,
      execArgs,
      options
    )
    result.stdout = stdout.join('')
    return result
  }

  private async initializeCommandManager(
    repo: string,
    owner: string,
    githubApi: string,
    plugins: string[]
  ): Promise<void> {
    if (repo) {
      this.globalArgs.push('--repo', repo)
    }
    if (owner) {
      this.globalArgs.push('--owner', owner)
    }
    if (githubApi) {
      this.globalArgs.push('--githubApi', githubApi)
    }
    if (plugins && plugins.length > 0) {
      this.globalArgs.push('--plugins', `[${plugins.join(' ')}]`)
    }
    try {
      this.autoCommand = await io.which('npx', true)
      this.autoCommand = `${this.autoCommand} auto`
    } catch (npxError) {
      try {
        this.autoCommand = await io.which('auto', true)
      } catch (autoError) {
        throw new Error(
          'Unable to locate executable file for either npx or auto'
        )
      }
    }
    core.debug('Getting auto version')
    let autoVersion: SemVer
    let autoOutput = await this.execAuto(['--version'])
    let stdout = autoOutput.stdout.trim()
    if (!stdout.includes('\n')) {
      const match = stdout.match(/\d+\.\d+(\.\d+)?/)
      if (!match || !semver.valid(match[0])) {
        throw new Error('Unable to determine the auto version')
      } else {
        autoVersion = new SemVer(match[0])
        if (autoVersion < MinimumAutoVersion) {
          throw new Error(
            `Minimum required auto version is ${MinimumAutoVersion}. Your auto ('${this.autoCommand}') is ${autoVersion}`
          )
        }
      }
    }
  }

  private static commonChangelogReleaseArgs(
    args: string[],
    dryRun: boolean,
    noVersionPrefix: boolean,
    name: string,
    email: string,
    from: string
  ) {
    if (dryRun) {
      args.push('--dry-run')
    }
    if (noVersionPrefix) {
      args.push('--no-version-prefix')
    }
    if (name) {
      args.push('--name', name)
    }
    if (email) {
      args.push('--email', email)
    }
    if (from) {
      args.push('--from', from)
    }
  }

  private static commonPrArgs(
    args: string[],
    dryRun: boolean,
    pr: number,
    context: string
  ) {
    if (dryRun) {
      args.push('--dry-run')
    }
    if (pr > 0) {
      args.push('--pr', pr.toString())
    }
    if (context) {
      args.push('--context', context)
    }
  }
}

export enum AutoCommand {
  // Setup commands
  info = 'info',
  // Publishing commands
  //version = 'version',
  changelog = 'changelog',
  release = 'release',
  shipit = 'shipit',
  latest = 'latest',
  next = 'next',
  canary = 'canary',
  // PR Interaction
  label = 'label',
  prStatus = 'pr-status',
  prCheck = 'pr-check',
  prBody = 'pr-body',
  comment = 'comment'
}

export enum PrState {
  // ['pending', 'success', 'error', 'failure']
  pending = 'pending',
  success = 'success',
  error = 'error',
  failure = 'failure'
}

class AutoOutput {
  stdout = ''
  exitCode = 0
}
