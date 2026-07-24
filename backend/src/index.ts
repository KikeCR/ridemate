import { buildApp } from "./app.js"

const isProduction = process.env.NODE_ENV === "production"

const app = buildApp({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
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
const port = Number(process.env.PORT ?? 3000)

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Backend listening on http://localhost:${port}`)
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
