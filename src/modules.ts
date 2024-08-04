import { Config, InternalContainer, Invoke, Provide } from './interfaces';
import { bindDependencies, injectDependencies } from './utils'

export function module(name: string, opts?: Config): { name: string; opts?: Config } {
  return { name, opts }
}

export class Module {
  private container: InternalContainer
  // private name: string
  private provides: Provide[]
  private invokes: Invoke[]
  private modules: Module[]

  constructor(container: InternalContainer, name: string, opts?: Config) {
    this.container = container
    // this.name = name
    this.provides = opts?.provides
    this.invokes = opts?.invokes
    this.doBindings()
    this.modules = opts.modules?.map((mod) => new Module(this.container, mod.name, mod.opts)) ?? []
  }

  private doBindings() {
    bindDependencies(this.container, this.provides)
  }

  async executeInvokes(): Promise<void> {
    this.invokes = injectDependencies(this.container, this.invokes)

    for (const invoke of this.invokes) {
      await invoke()
    }

    for (const module of this.modules) {
      await module.executeInvokes()
    }
  }
}
