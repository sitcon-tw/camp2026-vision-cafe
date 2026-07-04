export function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getOptionalEnv(name: string, fallback: string) {
  return process.env[name] || fallback
}

export function getGooglePrivateKey() {
  return getRequiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n")
}
