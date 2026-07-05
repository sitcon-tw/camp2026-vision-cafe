export function startGithubLogin(callbackUrl = "/select") {
  const loginUrl = new URL("/api/auth/github/start", window.location.origin)
  loginUrl.searchParams.set("callbackUrl", callbackUrl)
  window.location.assign(loginUrl.toString())
}

export async function logoutStudent(callbackUrl = "/select") {
  await fetch("/api/auth/logout", { method: "POST" })
  window.location.assign(callbackUrl)
}
