import { buildApp } from "./app.js"

const DEFAULT_PORT = 3000
const DEFAULT_HOST = "0.0.0.0"
const DEFAULT_LOG_LEVEL = "info"

const isProduction = process.env.NODE_ENV === "production"

const app = buildApp({
  logger: {
    level: process.env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL,
    ...(isProduction
      ? {}
      : {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          },
        }),
  },
})
const port = Number(process.env.PORT ?? DEFAULT_PORT)

app
  .listen({ port, host: DEFAULT_HOST })
  .then(() => {
    app.log.info(`Backend listening on http://localhost:${port}`)
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
