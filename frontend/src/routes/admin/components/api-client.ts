function redirectToAdminLogin() {
  const callbackUrl = `${window.location.pathname}${window.location.search}`
  const loginUrl = new URL("/admin/login", window.location.origin)

  loginUrl.searchParams.set("callbackUrl", callbackUrl)
  window.location.assign(loginUrl)
}

export async function fetchAdmin(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init)

  if (response.status === 401) {
    redirectToAdminLogin()
  }

  return response
}
