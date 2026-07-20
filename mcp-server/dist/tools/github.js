import { z } from 'zod';
import { apiFetch, textResult } from '../helpers.js';
export function registerGitHubTools(server) {
    server.tool('get_github_pr_status', 'Get the live status of a GitHub pull request: state (open/merged/closed), draft flag, review status, approval counts, and how far behind the base branch it is.', {
        url: z
            .string()
            .describe('GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)'),
    }, async ({ url }) => {
        const data = await apiFetch(`/api/github/pr-status?url=${encodeURIComponent(url)}`);
        return textResult(data);
    });
    server.tool('get_github_issue_status', 'Get the live status of a GitHub issue: state (open/closed), state reason, labels, assignees, and author.', {
        url: z
            .string()
            .describe('GitHub Issue URL (e.g. https://github.com/owner/repo/issues/123)'),
    }, async ({ url }) => {
        const data = await apiFetch(`/api/github/issue-status?url=${encodeURIComponent(url)}`);
        return textResult(data);
    });
}
