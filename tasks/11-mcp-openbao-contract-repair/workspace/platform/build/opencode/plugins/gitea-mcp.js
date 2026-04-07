export const GiteaMcpPlugin = async () => {
  return {
    "shell.env": async (_input, output) => {
      if (!output.env.GITEA_BASE_URL) {
        output.env.GITEA_BASE_URL = "https://git.thepeoples.dev"
      }
    },
    "mcp.servers": async () => [
      {
        name: "gitea",
        command: "npx",
        args: ["-y", "--package=gitea-mcp-tool", "gitea-mcp"],
        env: {
          GITEA_TOKEN: "{env:GITEA_TOKEN}",
          GITEA_BASE_URL: "{env:GITEA_BASE_URL}",
        },
      },
    ],
  }
}
