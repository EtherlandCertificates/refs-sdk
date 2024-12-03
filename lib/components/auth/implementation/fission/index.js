import * as DID from "../../../../did/index.js";
import * as Fission from "../../../../common/fission.js";
import * as Ucan from "../../../../ucan/index.js";
import { USERNAME_BLOCKLIST } from "./blocklist.js";
export * from "../../../../common/fission.js";
/**
 * Create a user account.
 */
export async function createAccount(endpoints, dependencies, userProps) {
    // const success = await createAccountApi({username: userProps.username, email: userProps.email, code: userProps.code});
    // return {success}
    const jwt = Ucan.encode(await Ucan.build({
        audience: await Fission.did(endpoints),
        dependencies: dependencies,
        issuer: await DID.ucan(dependencies.crypto),
    }));
    const response = await fetch(Fission.apiUrl(endpoints, "/account"), {
        method: "POST",
        headers: {
            "authorization": `Bearer ${jwt}`,
            "content-type": "application/json"
        },
        body: JSON.stringify(userProps)
    });
    return {
        success: response.status < 300
    };
}
/**
 * Create a user account.
 */
export async function emailVerify(endpoints, userProps) {
    const response = await fetch(Fission.apiUrl(endpoints, "/auth/email/verify"), {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(userProps)
    });
    return {
        success: response.status < 300
    };
}
/**
 * Check if a username is available.
 */
export async function isUsernameAvailable(endpoints, username) {
    console.log("sdk isUsernameAvailable  ");
    const resp = await fetch(Fission.apiUrl(endpoints, `/account`));
    return !resp.ok;
}
/**
 * Check if a username is valid.
 */
export function isUsernameValid(username) {
    return !username.startsWith("-") &&
        !username.endsWith("-") &&
        !username.startsWith("_") &&
        /^[a-zA-Z0-9_-]+$/.test(username) &&
        !USERNAME_BLOCKLIST.includes(username.toLowerCase());
}
/**
 * Ask the fission server to send another verification email to the
 * user currently logged in.
 *
 * Throws if the user is not logged in.
 */
export async function resendVerificationEmail(endpoints, crypto, reference) {
    // We've not implemented an "administer account" resource/ucan, so authenticating
    // with any kind of ucan will work server-side
    const localUcan = (await reference.repositories.ucans.getAll())[0];
    if (localUcan === null) {
        throw "Could not find your local UCAN";
    }
    const jwt = Ucan.encode(await Ucan.build({
        audience: await Fission.did(endpoints),
        dependencies: { crypto },
        issuer: await DID.ucan(crypto),
        proof: localUcan,
        potency: null
    }));
    const response = await fetch(Fission.apiUrl(endpoints, "/user/email/resend"), {
        method: "POST",
        headers: {
            "authorization": `Bearer ${jwt}`
        }
    });
    return {
        success: response.status < 300
    };
}
//# sourceMappingURL=index.js.map