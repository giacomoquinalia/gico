# Gico

A dependecy injection based application framework for Node.js.

## Installation

You can get the latest release and the type definitions using your preferred package manager:

```sh
> npm install gico
> yarn add gico
> pnpm add gico
```

## Damn simple tutorial

The pourpose of this section is to focus on concepts. After reading it, I strongly recommend checking out full implementation examples at [examples](https://github.com/giacomoquinalia).

We will use fx to control the lifecycle of a HTTP server application. It depends on a database and a cache system. Both are plain javascript classes.

There are three concepts to understand:

- **App**: the representation of your application
- **Module**: logical organization of dependencies and "invoke functions"
- **Lifecycle**: start and stop application hooks

All code you will see assumes the import of fx like:

```ts
import * as g from 'gico'
```

### App

An app starts with its own root module, so we need to declare its dependencies:

```ts
g.app({
  provides: [
    g.provide('database', Database),
    g.provide('cache', Cache)
  ]
})
```

The provides array option will bind all dependencies that our app needs to run to the container, so they can be injected anywhere in the application by using the **Inject** decorator.

An identifier can be either a **string** or **symbol**. And the only type of value currently supported is **plain javascript classes**.

### Module

Now we need to configure the database and cache services. Then, say to fx how to start and stop each one of them.

To do so, we create **invoke functions**, which recieves the application's lifecycle and the container of dependencies.

```ts
function database(lc: g.Lifecycle, container: g.Container) {
  const url = 'localhost:5432'
  const db = new DB(url)

  lc.append({
    async onStart() {
      await db.connect()
    },
    async onStop() {
      await db.disconnect()
    }
  })
}

function cache(lc: g.Lifecycle, container: g.Container) {
  const url = 'localhost:5432'
  const cache = new Cache(url)

  lc.append({
    async onStart() {
      await cache.connect()
    },
    async onStop() {
      await cache.disconnect()
    }
  })
}
```

Add them to app:

```ts
g.app({
  provides: [
    g.provide('database', Database),
    g.provide('cache', Cache)
  ],
  invokes: [database, cache]
})
```

It is important to note that invoke functions are executed in **order they appear** in the invokes array.

### Lifecycle

Every hook added to lifecycle via invoke functions will be executed when the application runs. Start hooks are executed in order they were provided and stop hooks will be executed in reverse order.

A hook cannot block the execution of subsequent hooks, except by the last one.

### HTTP server

Now we have to create the HTTP server and add it to the app.

```ts
function httpServer(lc: g.Lifecycle, container: g.Container) {
  const port = 3000
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        data: 'Hello World!'
      })
    )
  })

  lc.append({
    onStart() {
      server.listen(port)
    },
    onStop() {
      server.close(console.error)
    }
  })
}

g.app({
  provides: [
    g.provide('database', Database),
    g.provide('cache', Cache)
  ],
  invokes: [database, cache, httpServer]
})
```

### Run

Finally, lets run the applcation. It will run until a SIGTERM signal is sent to the server.

```ts
g.app({
  provides: [
    g.provide('database', Database),
    g.provide('cache', Cache)
  ],
  invokes: [database, cache, httpServer]
}).run()
```

