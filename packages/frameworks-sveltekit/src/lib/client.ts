import type {
  LiteralUnion,
  SignInOptions,
  SignInAuthorizationParams,
  SignOutParams,
} from "next-auth/react"
import type {
  BuiltInProviderType,
  RedirectableProviderType,
} from "@auth/core/providers"
import { base } from "$app/paths";

/**
 * Client-side method to initiate a signin flow
 * or send the user to the signin page listing all possible providers.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://authjs.dev/reference/sveltekit/client#signin)
 */
export async function signIn<
  P extends RedirectableProviderType | undefined = undefined
>(
  providerId?: LiteralUnion<
    P extends RedirectableProviderType
      ? P | BuiltInProviderType
      : BuiltInProviderType
  >,
  options?: SignInOptions,
  authorizationParams?: SignInAuthorizationParams
) {
  const { callbackUrl = window.location.href, redirect = true } = options ?? {}

  // TODO: Support custom providers
  const isCredentials = providerId === "credentials"
  const isEmail = providerId === "email"
  const isSupportingReturn = isCredentials || isEmail

  const basePath = base ?? ""
  const signInUrl = `${basePath}/auth/${
    isCredentials ? "callback" : "signin"
  }/${providerId}`

  const _signInUrl = `${signInUrl}?${new URLSearchParams(authorizationParams)}`

  // TODO: Remove this since Sveltekit offers the CSRF protection via origin check
  const csrfTokenResponse = await fetch(`${basePath}/auth/csrf`)
  const { csrfToken } = await csrfTokenResponse.json()

  const res = await fetch(_signInUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    // @ts-ignore
    body: new URLSearchParams({
      ...options,
      csrfToken,
      callbackUrl,
    }),
  })

  const data = await res.clone().json()

  if (redirect || !isSupportingReturn) {
    // TODO: Do not redirect for Credentials and Email providers by default in next major
    window.location.href = data.url ?? callbackUrl
    // If url contains a hash, the browser does not reload the page. We reload manually
    if (data.url.includes("#")) window.location.reload()
    return
  }

  return res
}

/**
 * Signs the user out, by removing the session cookie.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://authjs.dev/reference/sveltekit/client#signout)
 */
export async function signOut(options?: SignOutParams) {
  const { callbackUrl = window.location.href } = options ?? {}
  const basePath = base ?? ""
  // TODO: Remove this since Sveltekit offers the CSRF protection via origin check
  const csrfTokenResponse = await fetch(`${basePath}/auth/csrf`)
  const { csrfToken } = await csrfTokenResponse.json()
  const res = await fetch(`${basePath}/auth/signout`, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl,
    }),
  })
  const data = await res.json()

  const url = data.url ?? callbackUrl
  window.location.href = url
  // If url contains a hash, the browser does not reload the page. We reload manually
  if (url.includes("#")) window.location.reload()
}
