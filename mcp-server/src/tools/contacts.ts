import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiFetch, textResult, resolveTodoId } from "../helpers.js";

export function registerContactTools(server: McpServer) {
  server.tool(
    "list_todo_contacts",
    "List contacts assigned to a todo. Each contact has a person (name, email) and a role describing their involvement.",
    {
      taskNumber: z.number().int().positive().optional().describe("Task number (e.g. 7)"),
      id: z.string().optional().describe("Todo cuid (use taskNumber instead when possible)"),
    },
    async (params) => {
      const result = await resolveTodoId(params);
      if ("error" in result) return result.error;
      const data = await apiFetch(`/api/todos/${result.resolvedId}/contacts`);
      return textResult(data);
    }
  );

  server.tool(
    "add_todo_contact",
    "Add a contact (person) to a todo with a role. Use list_people first to find the person's ID.",
    {
      taskNumber: z.number().int().positive().optional().describe("Task number (e.g. 7)"),
      id: z.string().optional().describe("Todo cuid"),
      personId: z.string().describe("Person ID to add as contact"),
      role: z.string().describe("Role this person plays (e.g. 'reviewer', 'stakeholder')"),
    },
    async (params) => {
      const result = await resolveTodoId(params);
      if ("error" in result) return result.error;
      const data = await apiFetch(`/api/todos/${result.resolvedId}/contacts`, {
        method: "POST",
        body: JSON.stringify({ personId: params.personId, role: params.role }),
      });
      return textResult(data);
    }
  );

  server.tool(
    "remove_todo_contact",
    "Remove a contact from a todo. Use list_todo_contacts first to find the contact ID.",
    {
      taskNumber: z.number().int().positive().optional().describe("Task number"),
      id: z.string().optional().describe("Todo cuid"),
      contactId: z.string().describe("The TodoContact ID to remove"),
    },
    async (params) => {
      const result = await resolveTodoId(params);
      if ("error" in result) return result.error;
      const data = await apiFetch(`/api/todos/${result.resolvedId}/contacts/${params.contactId}`, {
        method: "DELETE",
      });
      return textResult(data);
    }
  );
}
