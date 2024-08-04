import { Hook } from './interfaces'
import { Injectable } from './utils'

/**
 * Lifecycle coordinates application lifecycle hooks.
 */
@Injectable()
export class Lifecycle {
  private hooks: Hook[]
  private numStarted: number

  constructor() {
    this.hooks = []
    this.numStarted = 0
  }

  isStartLifecycleComplete(): boolean {
    return this.numStarted === this.hooks.length
  }

  append(hook: Hook): void {
    this.hooks.push(hook)
  }

  async start() {
    for (const hook of this.hooks) {
      await this.runStartHook(hook)
      this.numStarted++
    }
  }

  private async runStartHook(hook: Hook): Promise<number> {
    const begin = performance.now()
    await hook.onStart()
    return performance.now() - begin
  }

  /**
    Stop runs any OnStop hooks whose OnStart counterpart succeeded. OnStop
    hooks run in reverse order.
    */
  async stop() {
    for (; this.numStarted > 0; this.numStarted--) {
      const hook = this.hooks[this.numStarted - 1]!

      if (hook.onStop === undefined) {
        continue
      }

      await this.runStopHook(hook)
    }
  }

  private async runStopHook(hook: Hook): Promise<number> {
    const begin = performance.now()
    await hook.onStop!()
    return performance.now() - begin
  }
}
