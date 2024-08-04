import 'reflect-metadata'
import { Lifecycle } from './lifecycle'
import { Module } from './modules'
import { createContainer } from './utils'
import { BindingScope, Config, InternalContainer, Newable, Provide } from './interfaces'

const defaultTimeout = 15000

interface Options {
  timeout?: number
  defaultScope?: BindingScope
}

export function provide(id: string | symbol, value: Newable, config?: Omit<Provide, 'id' | 'value'>): Provide {
  if (typeof id !== 'string' && typeof id !== 'symbol') {
    throw new TypeError('id is not a string or symbol')
  }

  if (typeof value !== 'function') {
    throw new TypeError('value is not a class')
  }

  return {
    ...config,
    id,
    value
  }
}

export function app(config?: Config, options?: Options): App {
  return new App(config, options)
}

class App {
  private lifecycle: Lifecycle
  private container: InternalContainer
  private root: Module
  private timeout: number
  private startTimeoutFn?: NodeJS.Timeout

  constructor(config?: Config, options?: Options) {
    this.container = createContainer({ defaultScope: options?.defaultScope })
    this.container.bind<Lifecycle>(Lifecycle).toSelf().inSingletonScope()
    this.lifecycle = this.container.get(Lifecycle)
    this.timeout = options?.timeout ?? defaultTimeout
    this.root = new Module(this.container, 'app', config)
  }

  /** Executes invokes e lifecycle onStart hooks */
  async run() {
    await this.root.executeInvokes()
    this.setTerminationListerner()
    this.setDeadlineForStart()
    await this.start()
  }

  private setTerminationListerner(): void {
    process.addListener('SIGTERM', this.stop.bind(this, true))
  }

  private setDeadlineForStart(): void {
    this.startTimeoutFn = setTimeout(this.stop.bind(this, false), this.timeout)
  }

  private setDeadlineForStop(): void {
    setTimeout(process.exit, this.timeout)
  }

  private unsetDeadline(): void {
    clearTimeout(this.startTimeoutFn)
  }

  private async start() {
    await this.lifecycle.start()
  }

  private async stop(force: boolean) {
    this.unsetDeadline()
    if (force || this.lifecycle.isStartLifecycleComplete()) {
      this.setDeadlineForStop()
      await this.lifecycle.stop()
      process.exit()
    }
  }
}
