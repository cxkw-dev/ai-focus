#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTodoTools } from "./tools/todos.js";
import { registerLabelTools } from "./tools/labels.js";
import { registerPeopleTools } from "./tools/people.js";
import { registerNotebookTools } from "./tools/notebook.js";
import { registerAzureTools } from "./tools/azure.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerAccomplishmentTools } from "./tools/accomplishments.js";
import { registerStatsTools } from "./tools/stats.js";
import { registerStatusUpdateTools } from "./tools/status-updates.js";
import { registerSessionTools } from "./tools/sessions.js";
const server = new McpServer({
    name: "ai-focus",
    version: "1.0.0",
});
registerTodoTools(server);
registerLabelTools(server);
registerPeopleTools(server);
registerNotebookTools(server);
registerAzureTools(server);
registerContactTools(server);
registerAccomplishmentTools(server);
registerStatsTools(server);
registerStatusUpdateTools(server);
registerSessionTools(server);
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("AI Focus MCP server running on stdio");
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
