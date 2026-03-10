# Configurações Kiro

Este diretório contém configurações específicas do workspace.

## mcp.json (Futuro)

Aqui você poderá configurar servidores MCP (Model Context Protocol) para estender as capacidades do Kiro.

Exemplo:
```json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {},
      "disabled": false
    }
  }
}
```
