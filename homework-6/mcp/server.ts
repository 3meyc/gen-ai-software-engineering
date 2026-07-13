import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  formatResultsSummary,
  listTransactionResults,
  readPipelineSummary,
  readTransactionResult,
  ResultsNotFoundError,
} from "./results-reader.js";

const SUMMARY_URI = "pipeline://summary";

function createServer(): McpServer {
  const server = new McpServer({
    name: "pipeline-status",
    version: "1.0.0",
  });

  server.registerTool(
    "get_transaction_status",
    {
      description:
        "Return the current pipeline result for a transaction from shared/results/. Sanity check: TXN009 should always be rejected.",
      inputSchema: z.object({
        transaction_id: z
          .string()
          .describe("Transaction ID, e.g. TXN001"),
      }),
    },
    async ({ transaction_id }) => {
      try {
        const result = await readTransactionResult(transaction_id);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const message =
          err instanceof ResultsNotFoundError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to read transaction result";
        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "list_pipeline_results",
    {
      description:
        "List a summary of all processed transactions from shared/results/",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const results = await listTransactionResults();
        if (results.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No pipeline results found. Run `npm run pipeline` in homework-6 first.",
              },
            ],
            isError: true,
          };
        }
        const summary = await readPipelineSummary();
        const text = formatResultsSummary(results, summary);
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to list results";
        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    },
  );

  server.registerResource(
    "pipeline-summary",
    SUMMARY_URI,
    {
      description: "Latest pipeline run summary from pipeline-summary.json",
      mimeType: "text/plain",
    },
    async (uri) => {
      const summary = await readPipelineSummary();
      if (!summary) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "No pipeline summary found. Run `npm run pipeline` in homework-6 first.",
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/plain",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
