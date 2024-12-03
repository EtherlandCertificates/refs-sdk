import * as DID from "../../../../did/index.js";
import * as DNS from "../../dns-over-https.js";
import * as Fission from "../../../../common/fission.js";
import * as TypeChecks from "../../../../common/type-checks.js";
import * as Ucan from "../../../../ucan/index.js";
import { decodeCID } from "../../../../common/cid.js";
import { getAccountInfo } from "../../../auth/implementation/fission-base.js";
/**
 * Get the CID of a user's data root.
 * First check Fission server, then check DNS
 *
 * @param username The username of the user that we want to get the data root of.
 */
export async function lookup(endpoints, dependencies, username) {
    const maybeRoot = await lookupOnFisson(endpoints, dependencies, username);
    if (!maybeRoot)
        return null;
    if (maybeRoot !== null)
        return maybeRoot;
    try {
        const cid = await DNS.lookupDnsLink(username + ".files." + endpoints.userDomain);
        return !cid ? null : decodeCID(cid);
    }
    catch (err) {
        console.error(err);
        throw new Error("Could not locate user root in DNS");
    }
}
/**
 * Get the CID of a user's data root from the Fission server.
 *
 * @param username The username of the user that we want to get the data root of.
 */
export async function lookupOnFisson(endpoints, dependencies, username) {
    try {
        console.log(" lookupOnFisson2 ", username);
        // const resp = await fetch(
        //   Fission.apiUrl(endpoints, `user/data/${username}`),
        //   { cache: "reload" } // don't use cache
        // )
        const cid = await getAccountInfo();
        console.log("lookupOnFisson2 1 ", cid);
        // const cid = await resp.json()
        return decodeCID(cid.data);
    }
    catch (err) {
        dependencies.manners.log("Could not locate user root on Fission server: ", TypeChecks.hasProp(err, "toString") ? err.toString() : err);
        return null;
    }
}
/**
 * Update a user's data root.
 *
 * @param cid The CID of the data root.
 * @param proof The proof to use in the UCAN sent to the API.
 */
export async function update(endpoints, dependencies, cidInstance, proof) {
    const cid = cidInstance.toString();
    // Debug
    dependencies.manners.log("🌊 Updating your DNSLink:", cid);
    console.log("update data roots ", cid);
    // Make API call
    return { success: true };
    return await fetchWithRetry(Fission.apiUrl(endpoints, `user/data/${cid}`), {
        headers: async () => {
            const jwt = Ucan.encode(await Ucan.build({
                dependencies: dependencies,
                audience: await Fission.did(endpoints),
                issuer: await DID.ucan(dependencies.crypto),
                potency: "APPEND",
                proof: Ucan.encode(proof),
                // TODO: Waiting on API change.
                //       Should be `username.fission.name/*`
                resource: proof.payload.rsc
            }));
            return { "authorization": `Bearer ${jwt}` };
        },
        retries: 100,
        retryDelay: 5000,
        retryOn: [502, 503, 504],
    }, {
        method: "PUT"
    }).then((response) => {
        if (response.status < 300)
            dependencies.manners.log("🪴 DNSLink updated:", cid);
        else
            dependencies.manners.log("🔥 Failed to update DNSLink for:", cid);
        return { success: response.status < 300 };
    }).catch(err => {
        dependencies.manners.log("🔥 Failed to update DNSLink for:", cid);
        console.error(err);
        return { success: false };
    });
}
async function fetchWithRetry(url, retryOptions, fetchOptions, retry = 0) {
    const headers = await retryOptions.headers();
    const response = await fetch(url, {
        ...fetchOptions,
        headers: { ...fetchOptions.headers, ...headers }
    });
    if (retryOptions.retryOn.includes(response.status)) {
        if (retry < retryOptions.retries) {
            return await new Promise((resolve, reject) => setTimeout(() => fetchWithRetry(url, retryOptions, fetchOptions, retry + 1).then(resolve, reject), retryOptions.retryDelay));
        }
        else {
            throw new Error("Too many retries for fetch");
        }
    }
    return response;
}
//# sourceMappingURL=data-root.js.map