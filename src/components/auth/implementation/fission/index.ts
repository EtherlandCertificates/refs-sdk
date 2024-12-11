import type { Dependencies } from "../base.js"

import * as Crypto from "../../../crypto/implementation.js"
import * as DID from "../../../../did/index.js"
import * as Fission from "../../../../common/fission.js"
import * as Reference from "../../../reference/implementation.js"
import * as Ucan from "../../../../ucan/index.js"
import { UCAN } from "@fission-codes/ucan"
import { EdDSASigner } from "iso-signatures/signers/eddsa.js"

import { USERNAME_BLOCKLIST } from "./blocklist.js"
import { Endpoints } from "../../../../common/fission.js"

export * from "../../../../common/fission.js"

/**
 * Login a user account.
 */
export async function loginAccount(
  endpoints: Endpoints,
  dependencies: Dependencies,
  userProps: {
    username: string
    did: string
  }
): Promise<{ did: string; username: string }> {
  const signer = await EdDSASigner.generate()

  const ucan = await UCAN.create({
    issuer: signer,
    audience: await Fission.did(endpoints),
    capabilities: { [signer.did]: { "account/link": [{}] } },
  })

  const response = await fetch(
    Fission.apiUrl(endpoints, `/account/${userProps.did}/link`),
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${ucan}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ code: "" }),
    }
  )

  return {
    did: userProps.did,
    username: JSON.stringify(response),
  }
}

/**
 * Create a user account.
 */
export async function createAccount(
  endpoints: Endpoints,
  dependencies: Dependencies,
  userProps: {
    username: string
    email: string
    code: string
  }
): Promise<{ success: boolean }> {
  const signer = await EdDSASigner.generate()

  const ucan = await UCAN.create({
    issuer: signer,
    audience: await Fission.did(endpoints),
    capabilities: { [signer.did]: { "account/create": [{}] } },
  })

  const response = await fetch(Fission.apiUrl(endpoints, "/account"), {
    method: "POST",
    headers: {
      authorization: `Bearer ${ucan}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(userProps),
  })

  return {
    success: response.status < 300,
  }
}

/**
 * Create a user account.
 */
export async function emailVerify(
  endpoints: Endpoints,
  userProps: {
    email?: string
  }
): Promise<{ success: boolean }> {
  const response = await fetch(
    Fission.apiUrl(endpoints, "/auth/email/verify"),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(userProps),
    }
  )

  return {
    success: response.status < 300,
  }
}

/**
 * Check if a username is available.
 */
export async function isUsernameAvailable(
  endpoints: Endpoints,
  username: string
): Promise<boolean> {
  console.log("sdk isUsernameAvailable  ")
  const resp = await fetch(Fission.apiUrl(endpoints, `/account`))

  return !resp.ok
}

/**
 * Check if a username is valid.
 */
export function isUsernameValid(username: string): boolean {
  return (
    !username.startsWith("-") &&
    !username.endsWith("-") &&
    !username.startsWith("_") &&
    /^[a-zA-Z0-9_-]+$/.test(username) &&
    !USERNAME_BLOCKLIST.includes(username.toLowerCase())
  )
}

/**
 * Ask the fission server to send another verification email to the
 * user currently logged in.
 *
 * Throws if the user is not logged in.
 */
export async function resendVerificationEmail(
  endpoints: Endpoints,
  crypto: Crypto.Implementation,
  reference: Reference.Implementation
): Promise<{ success: boolean }> {
  // We've not implemented an "administer account" resource/ucan, so authenticating
  // with any kind of ucan will work server-side
  const localUcan = (await reference.repositories.ucans.getAll())[0]
  if (localUcan === null) {
    throw "Could not find your local UCAN"
  }

  const jwt = Ucan.encode(
    await Ucan.build({
      audience: await Fission.did(endpoints),
      dependencies: { crypto },
      issuer: await DID.ucan(crypto),
      proof: localUcan,
      potency: null,
    })
  )

  const response = await fetch(
    Fission.apiUrl(endpoints, "/user/email/resend"),
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    }
  )

  return {
    success: response.status < 300,
  }
}
