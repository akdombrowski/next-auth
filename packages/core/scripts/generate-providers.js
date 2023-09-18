import { join } from "path"
import { readdirSync, writeFileSync } from "fs"

const providersPath = join(process.cwd(), "src/providers")

const files = readdirSync(providersPath, "utf8")

const nonOAuthFile = ["oauth-types", "oauth", "index", "email", "credentials"]
const providers = files.map((file) => {
  const strippedProviderName = file.substring(0, file.indexOf("."))
  return `"${strippedProviderName}"`
}).filter((provider) => !nonOAuthFile.includes(provider.replace(/"/g, '')))

const result = `
// THIS FILE IS AUTOGENERATED. DO NOT EDIT.
export type OAuthProviderType = 
  | ${providers.join("\n  | ")}`

writeFileSync(join(providersPath, "oauth-types.ts"), result)
