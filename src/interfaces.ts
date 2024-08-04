import { Container as C } from 'inversify'

export interface App {
  run(): Promise<void>
}

export interface Lifecycle {
  append(hook: Hook): void
}

export type Container = Pick<C, 'get'>

export type InternalContainer = C

export type Newable<T extends new (...args: any[]) => any = any> = T

export type Invoke = (lc?: Lifecycle, container?: Container) => Promise<void> | void

export type BindingScope = 'singleton' | 'transient' | 'request'

export interface Provide {
  id: string | symbol
  value: Newable
  scope?: BindingScope
}

export interface Config {
  provides?: Provide[]
  invokes?: Invoke[]
  modules?: any[]
}

/** A Hook is a pair of start and stop callbacks, either of which can be null,
  plus a string identifying the supplier of the hook. */
export interface Hook {
  onStart(): Promise<void> | void
  onStop?(): Promise<void> | void
  onStartName?: string
  onStopName?: string
}
