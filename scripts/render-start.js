/* eslint-disable no-console */
const { execSync, spawn } = require('child_process')

function waitForDatabase() {
  const maxAttempts = 30
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
      return
    } catch (err) {
      console.log(`Database not ready (attempt ${attempt}/${maxAttempts}). Retrying in 2s...`)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000)
    }
  }
  throw new Error('Database did not become ready in time')
}

function startServer() {
  const child = spawn('node', ['backend/dist/server.js'], {
    stdio: 'inherit',
    env: process.env,
  })
  child.on('exit', (code) => process.exit(code ?? 1))
}

function main() {
  console.log('Preparing Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('Waiting for database...')
  waitForDatabase()
  console.log('Starting server...')
  startServer()
}

main()


