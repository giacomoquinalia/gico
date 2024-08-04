import { Container, inject, injectable } from 'inversify'
import { Lifecycle } from './lifecycle'
import { BindingScope, InternalContainer, Invoke, Provide } from './interfaces'

export const Injectable = injectable
export const Inject = inject

export interface ContainerOptions {
  defaultScope?: BindingScope
}

export function createContainer(options: ContainerOptions): InternalContainer {
  return new Container({
    autoBindInjectable: true,
    defaultScope:
      options.defaultScope === 'singleton' ? 'Singleton' : options.defaultScope === 'request' ? 'Request' : 'Transient'
  })
}

export function bindDependencies(container: InternalContainer, provides: Provide[]): void {
  for (const provide of provides) {
    const bind = container.bind(provide.id).to(provide.value)
    switch (provide.scope) {
      case 'singleton':
        bind.inSingletonScope()
        break
      case 'request':
        bind.inRequestScope()
        break
      default:
        bind.inTransientScope()
        break
    }
  }
}

export function injectDependencies(container: InternalContainer, invokes: Invoke[]): Invoke[] {
  const _invokes = invokes.map((invoke) => {
    const injections = [container.get(Lifecycle), container]
    return invoke.bind(invoke, ...injections)
  })

  return _invokes
}
