import type { Components } from "../../../components.js"
import type { Dependencies } from "./base.js"
import type { Channel, ChannelOptions } from "../channel.js"
import type { Implementation } from "../implementation.js"

import * as Base from "./base.js"
import * as ChannelFission from "./fission/channel.js"
import * as ChannelMod from "../channel.js"
import * as Fission from "./fission/index.js"

export function createChannel(
  endpoints: Fission.Endpoints,
  dependencies: Dependencies,
  options: ChannelOptions
): Promise<Channel> {
  return ChannelMod.createWssChannel(
    dependencies.reference,
    ChannelFission.endpoint(
      `${endpoints.server}${endpoints.apiPath}`.replace(
        /^https?:\/\//,
        "wss://"
      )
    ),
    options
  )
}

export const isUsernameAvailable = async (
  endpoints: Fission.Endpoints,
  username: string
): Promise<boolean> => {
  return Fission.isUsernameAvailable(endpoints, username)
}

export const isUsernameValid = async (username: string): Promise<boolean> => {
  return Fission.isUsernameValid(username)
}

export const emailVerify = async (
  endpoints: Fission.Endpoints,
  options: { email?: string }
): Promise<{ success: boolean }> => {
  const { success } = await Fission.emailVerify(endpoints, options)
  return { success: success }
}

export const login = async (
  endpoints: Fission.Endpoints,
  dependencies: Dependencies,
  options: {
    code: string
  }
): Promise<{ success: boolean }> => {
  const { success } = await Fission.loginAccount(
    endpoints,
    dependencies,
    options
  )

  if (success)
    return Base.login(dependencies, { ...options, type: Base.TYPE })
  return { success: false }
}

export const register = async (
  endpoints: Fission.Endpoints,
  dependencies: Dependencies,
  options: {
    username: string
    email: string
    code: string
  }
): Promise<{ success: boolean }> => {
  const { success } = await Fission.createAccount(
    endpoints,
    dependencies,
    options
  )

  if (success)
    return Base.register(dependencies, { ...options, type: Base.TYPE })
  return { success: false }
}

export const getAccountInfo = async (): Promise<{ data: any }> => {
  try {
    // const { success } = await Fission.createAccount(endpoints, dependencies, options)
    console.log("endpoints ", "endpoints")

    const agentData: any = localStorage.getItem("agent")
    if (!agentData) return { data: null }

    return { data: null }

    // if (!client) {
    //   const _agentData = JSON.parse(agentData);

    //   console.log("creating client again ", resolveSigner);
    //   const agent = new Agent({
    //     store: _agentData.store,
    //     signer: _agentData.signer,
    //   });

    //   console.log("agent ", agent);
    //   console.log(
    //     "agent ",
    //     localStorage.setItem("agent", JSON.stringify(agent))
    //   );
    //   console.log("agent ", localStorage.getItem("agent"));

    //   client = await Client.create({
    //     url: SERVER_URL,
    //     agent,
    //   });
    // }

    // console.log("getAccountInfo123123 client ", client);

    // // const out = await client.verifyEmail(email)
    // const user: any = localStorage.getItem("user");
    // const ucans: any = localStorage.getItem("ucans");
    // console.log("user did.........", user, JSON.parse(user)?.did);
    // console.log("user ucans.........", user, JSON.parse(ucans));
    // const accountInfo = await client.accountInfo(JSON.parse(user)?.did);
    // console.log("accountInfo.........", accountInfo);
    // return { data: accountInfo?.result };
  } catch (err) {
    return { data: null }
  }
}

// 🛳

export function implementation(
  endpoints: Fission.Endpoints,
  dependencies: Dependencies
): Implementation<Components> {
  const base = Base.implementation(dependencies)

  return {
    type: base.type,

    canDelegateAccount: base.canDelegateAccount,
    delegateAccount: base.delegateAccount,
    linkDevice: base.linkDevice,
    session: base.session,

    isUsernameValid,

    createChannel: (...args) => createChannel(endpoints, dependencies, ...args),
    isUsernameAvailable: (...args) => isUsernameAvailable(endpoints, ...args),
    login: (...args) => login(endpoints, dependencies, ...args),
    register: (...args) => register(endpoints, dependencies, ...args),

    emailVerify: (...args) => emailVerify(endpoints, ...args),
  }
}
