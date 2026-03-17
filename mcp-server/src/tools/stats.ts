import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiFetch, textResult } from "../helpers.js";

export function registerStatsTools(server: McpServer) {
  server.tool(
    "get_year_stats",
    "Get year-in-review statistics: completion rates, streaks, busiest months, label/priority/status breakdowns, and more.",
    {
      year: z.number().min(2000).max(2100).optional().describe("Year (defaults to current year)"),
    },
    async (params) => {
      const qs = params.year ? `?year=${params.year}` : "";
      const data = await apiFetch(`/api/stats/year${qs}`);
      return textResult(data);
    }
  );
}
