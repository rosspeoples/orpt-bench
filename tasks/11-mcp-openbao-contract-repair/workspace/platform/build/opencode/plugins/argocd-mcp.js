export const ArgoCDMcpPlugin = async () => {
  return {
    "shell.env": async (_input, output) => {
      if (!output.env.ARGOCD_URL) {
        output.env.ARGOCD_URL = "https://argocd.thepeoples.dev"
      }
    },
    "mcp.servers": async () => [
      {
        name: "argocd",
        command: "npx",
        args: ["-y", "argocd-mcp"],
        env: {
          ARGOCD_AUTH_TOKEN: "{env:ARGOCD_AUTH_TOKEN}",
          ARGOCD_URL: "{env:ARGOCD_URL}",
        },
      },
    ],
  }
}
