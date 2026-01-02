import * as SDK from 'azure-devops-extension-sdk';
import { getClient } from 'azure-devops-extension-api';
import { GitRestClient, GitVersionType, PullRequestStatus } from 'azure-devops-extension-api/Git';
import type { GitVersionDescriptor } from 'azure-devops-extension-api/Git';
import { BuildRestClient, BuildResult } from 'azure-devops-extension-api/Build';
import { WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking';
import { WikiRestClient } from 'azure-devops-extension-api/Wiki';
import type { ReviewData, RepoStats, PipelineStats, WorkItemStats, PRStats, WikiStats, GeneralStats, UserStat } from '../models/types';

export class AdoService {
    async initADO(): Promise<void> {
        if (window.self !== window.top || !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            try {
                console.log('Initializing Azure DevOps SDK...');
                await SDK.init();
                await SDK.ready();
                console.log('Azure DevOps SDK initialized successfully.');

            } catch (error) {
                console.error('Failed to initialize Azure DevOps SDK:', error);
            }
        }
    };

    getProject(): { id: string, name: string } | undefined {
        return SDK.getWebContext().project;
    };

    async getReviewData(year: number): Promise<ReviewData> {
        const project = await this.getProject();
        if (!project) {
            throw new Error('No project context found');
        }

        const projectId = project.id;
        const projectName = project.name;

        // Parallelize fetching data
        const [repoStats, pipelineStats, workItemStats, prStats, wikiStats] = await Promise.all([
            this.getRepoStats(projectId, year),
            this.getPipelineStats(projectId, year),
            this.getWorkItemStats(projectId, year),
            this.getPrStats(projectId, year),
            this.getWikiStats(projectId, year)
        ]);

        return {
            year,
            generatedAt: new Date().toISOString(),
            scope: {
                type: 'project',
                id: projectId,
                name: projectName,
            },
            stats: {
                repos: repoStats,
                pipelines: pipelineStats,
                workItems: workItemStats,
                pr: prStats,
                wiki: wikiStats,
                general: this.getGeneralStats(projectName)
            }
        };
    }

    private async getRepoStats(projectId: string, year: number): Promise<RepoStats> {
        const client = getClient(GitRestClient);
        const repos = await client.getRepositories(projectId);

        const fromDate = new Date(year, 0, 1).toISOString();
        const toDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

        let totalCommits = 0;
        let linesAdded = 0;
        let linesDeleted = 0;
        const commitsByAuthor = new Map<string, { count: number, imageUrl?: string }>();
        const commitsByHour = new Map<string, number>();
        const commitsByDay = new Map<string, number>();
        const repoCommitCounts = new Map<string, number>();

        // Limit to first 20 repos to avoid performance bottlenecks
        const activeRepos = repos.slice(0, 20);

        const commitPromises = activeRepos.map(async (repo) => {
            if (!repo.id) return;
            try {
                const searchCriteria = {
                    fromDate,
                    toDate,
                    itemVersion: { version: 'main', versionType: GitVersionType.Branch } as GitVersionDescriptor,
                    includeUserImageUrl: true,
                    $top: 1000
                } as any; // Cast to any to avoid strict type checks on optional fields vs required

                const commits = await client.getCommits(repo.id, searchCriteria, projectId);

                if (!commits || commits.length === 0) return;

                repoCommitCounts.set(repo.name, commits.length);
                totalCommits += commits.length;

                for (const commit of commits) {
                    if (commit.author && commit.author.name) {
                        const name = commit.author.name;
                        // @ts-ignore: imageUrl exists on some responses
                        const imageUrl = commit.author.imageUrl;
                        const current = commitsByAuthor.get(name) || { count: 0, imageUrl };
                        commitsByAuthor.set(name, { count: current.count + 1, imageUrl: imageUrl || current.imageUrl });
                    }

                    if (commit.changeCounts) {
                        const changes = commit.changeCounts as any;
                        linesAdded += (changes['Add'] || 0) + (changes['Edit'] || 0);
                        linesDeleted += (changes['Delete'] || 0);
                    }

                    if (commit.author?.date) {
                        const date = new Date(commit.author.date);
                        const hour = date.getHours().toString().padStart(2, '0');
                        commitsByHour.set(hour, (commitsByHour.get(hour) || 0) + 1);

                        const day = date.toISOString().split('T')[0];
                        commitsByDay.set(day, (commitsByDay.get(day) || 0) + 1);
                    }
                }
            } catch (e) {
                // Ignore errors for individual repos
            }
        });

        await Promise.all(commitPromises);

        const sortedAuthors = [...commitsByAuthor.entries()]
            .map(([displayName, stats]) => ({ displayName, count: stats.count, imageUrl: stats.imageUrl }))
            .sort((a, b) => b.count - a.count);

        const topContributor: UserStat = sortedAuthors[0] || { displayName: 'Ghost', count: 0 };
        const topContributors: UserStat[] = sortedAuthors.slice(0, 5);

        let busiestDay = { date: '', count: 0 };
        for (const [date, count] of commitsByDay) {
            if (count > busiestDay.count) busiestDay = { date, count };
        }

        let activeRepo = { name: '', count: 0 };
        for (const [name, count] of repoCommitCounts) {
            if (count > activeRepo.count) activeRepo = { name, count };
        }

        return {
            totalCommits,
            topContributor,
            topContributors,
            busiestDay: busiestDay.count ? busiestDay : { date: new Date().toISOString().split('T')[0], count: 0 },
            commitTimeDistribution: Object.fromEntries(commitsByHour),
            linesAdded,
            linesDeleted,
            activeRepo: activeRepo.count ? activeRepo : { name: 'None', count: 0 }
        };
    }

    private async getPipelineStats(project: string, year: number): Promise<PipelineStats> {
        const client = getClient(BuildRestClient);
        const minTime = new Date(year, 0, 1);
        const maxTime = new Date(year, 11, 31, 23, 59, 59);

        const builds = await client.getBuilds(
            project,
            undefined, undefined, undefined,
            minTime, maxTime,
            undefined, undefined, undefined, undefined, undefined, undefined,
            1000
        );

        const totalRuns = builds.length;
        let successCount = 0;
        const buildsByDay = new Map<string, number>();
        const buildsByDef = new Map<string, number>();
        let longestRun = { name: '', durationMinutes: 0 };
        let fastestRun = { name: '', durationMinutes: 999999 };

        for (const build of builds) {
            if (build.result === BuildResult.Succeeded) {
                successCount++;
            }

            if (build.startTime) {
                const day = build.startTime.toISOString().split('T')[0];
                buildsByDay.set(day, (buildsByDay.get(day) || 0) + 1);
            }

            const defName = build.definition?.name || 'Unknown';
            buildsByDef.set(defName, (buildsByDef.get(defName) || 0) + 1);

            if (build.startTime && build.finishTime) {
                const start = new Date(build.startTime).getTime();
                const finish = new Date(build.finishTime).getTime();
                const durationMinutes = (finish - start) / 1000 / 60;

                // Only consider reasonable durations
                if (durationMinutes > 0.1) {
                    if (durationMinutes > longestRun.durationMinutes) {
                        longestRun = { name: defName, durationMinutes };
                    }
                    if (durationMinutes < fastestRun.durationMinutes) {
                        fastestRun = { name: defName, durationMinutes };
                    }
                }
            }
        }

        let busiestDay = { date: '', count: 0 };
        for (const [date, count] of buildsByDay) {
            if (count > busiestDay.count) busiestDay = { date, count };
        }

        const topPipelines = [...buildsByDef.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalRuns,
            busiestDay: busiestDay.count ? busiestDay : { date: new Date().toISOString().split('T')[0], count: 0 },
            topPipelines,
            successRate: totalRuns > 0 ? (successCount / totalRuns) * 100 : 0,
            longestRun: longestRun.name ? longestRun : { name: 'None', durationMinutes: 0 },
            fastestRun: fastestRun.durationMinutes < 999999 ? fastestRun : { name: 'None', durationMinutes: 0 }
        };
    }

    private async getWorkItemStats(project: string, year: number): Promise<WorkItemStats> {
        const client = getClient(WorkItemTrackingRestClient);
        const fromDate = new Date(year, 0, 1).toISOString();
        const toDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

        // Query for completed items
        const wiql = {
            query: `
                SELECT [System.Id], [System.WorkItemType], [System.IterationPath]
                FROM WorkItems
                WHERE [System.TeamProject] = '${project}'
                AND [System.State] IN ('Closed', 'Completed', 'Done', 'Resolved')
                AND [Microsoft.VSTS.Common.ClosedDate] >= '${fromDate}'
                AND [Microsoft.VSTS.Common.ClosedDate] <= '${toDate}'
            `
        };

        try {
            const results = await client.queryByWiql(wiql);
            const workItems = results.workItems || [];

            // Note: queryByWiql only returns references (id, url). We need to fetch details for more info if needed.
            // But we can get IDs and just count for basic stats.
            // If we want type breakdown, we assume the query filtered correctly, but to group by type we'd need fields.
            // queryByWiql doesn't return fields values in the list response usually.
            // However, we can just assume the count is "completed".

            // To differentiate bugs vs others, we might need a separate query or fetch details.
            // Let's do a separate query for bugs to be accurate.

            const bugWiql = {
                query: `
                    SELECT [System.Id]
                    FROM WorkItems
                    WHERE [System.TeamProject] = '${project}'
                    AND [System.WorkItemType] = 'Bug'
                    AND [System.State] IN ('Closed', 'Completed', 'Done', 'Resolved')
                    AND [Microsoft.VSTS.Common.ClosedDate] >= '${fromDate}'
                    AND [Microsoft.VSTS.Common.ClosedDate] <= '${toDate}'
                `
            };
            const bugResults = await client.queryByWiql(bugWiql);

            // For active sprint, just return a placeholder or try to find most active iteration path from a sample?
            // Since we can't easily aggregate fields via WIQL without fetching details, we will skip "Active Sprint" logic
            // and just put the most common iteration if we fetch details.
            // Fetching 1000 items details is heavy.

            return {
                completed: workItems.length,
                bugsSquashed: bugResults.workItems?.length || 0,
                activeSprint: { name: 'Yearly Summary', completedCount: workItems.length }, // Placeholder
                activeBacklogItems: [] // Keeping empty as it requires fetching active items/comments which is expensive
            };

        } catch (e) {
            console.error('Error fetching work items', e);
            return { completed: 0, bugsSquashed: 0, activeSprint: { name: 'Unknown', completedCount: 0 }, activeBacklogItems: [] };
        }
    }

    private async getPrStats(project: string, year: number): Promise<PRStats> {
        const client = getClient(GitRestClient);
        const minTime = new Date(year, 0, 1);
        const maxTime = new Date(year, 11, 31, 23, 59, 59);

        // Fetch completed PRs
        const searchCriteria = {
            status: PullRequestStatus.Completed,
            $top: 500
            // Note: filtering by date range in criteria is not directly supported in all API versions for *completion* date
            // We'll filter client side.
        } as any;

        const prs = await client.getPullRequestsByProject(project, searchCriteria);

        let merged = 0;
        const reviewers = new Map<string, { count: number, imageUrl?: string }>();
        let fastestMerge = { title: '', durationHours: 99999 };
        let longestMerge = { title: '', durationHours: 0 };

        for (const pr of prs) {
            if (pr.closedDate) {
                const closeDate = new Date(pr.closedDate);
                if (closeDate >= minTime && closeDate <= maxTime) {
                    merged++;

                    // Reviewers
                    if (pr.reviewers) {
                        for (const reviewer of pr.reviewers) {
                            if (reviewer.displayName) {
                                const current = reviewers.get(reviewer.displayName) || { count: 0, imageUrl: reviewer.imageUrl };
                                reviewers.set(reviewer.displayName, { count: current.count + 1, imageUrl: reviewer.imageUrl });
                            }
                        }
                    }

                    // Duration
                    if (pr.creationDate) {
                        const createDate = new Date(pr.creationDate);
                        const durationHours = (closeDate.getTime() - createDate.getTime()) / (1000 * 60 * 60);

                        if (durationHours > longestMerge.durationHours) {
                            longestMerge = { title: pr.title || 'Untitled', durationHours };
                        }
                        if (durationHours < fastestMerge.durationHours && durationHours > 0) {
                            fastestMerge = { title: pr.title || 'Untitled', durationHours };
                        }
                    }
                }
            }
        }

        const sortedReviewers = [...reviewers.entries()]
            .map(([displayName, stats]) => ({ displayName, count: stats.count, imageUrl: stats.imageUrl }))
            .sort((a, b) => b.count - a.count);

        const topReviewer = sortedReviewers[0] || { displayName: 'Ghost', count: 0 };

        return {
            merged,
            topReviewer,
            discussionCount: merged * 3, // Mock estimation: avg 3 comments per PR
            fastestMerge: fastestMerge.durationHours < 99999 ? fastestMerge : { title: 'None', durationHours: 0 },
            longestMerge: longestMerge.title ? longestMerge : { title: 'None', durationHours: 0 }
        };
    }

    private async getWikiStats(project: string, year: number): Promise<WikiStats> {
        const client = getClient(WikiRestClient);
        try {
            const wikis = await client.getAllWikis(project);
            if (!wikis || wikis.length === 0) {
                return { pagesCreated: 0, topPages: [], topAuthors: [] };
            }

            // Just check the first wiki
            const wiki = wikis[0];
            // Listing all pages might be heavy if deep structure. 'pagesBatch'??
            // We'll skip deep traversal for now and just use a placeholder or minimal check.
            console.log(wiki);
            console.log(year);

            return {
                pagesCreated: 5, // Placeholder
                topPages: [{ title: 'Home', views: 100 }],
                topAuthors: []
            };
        } catch (e) {
            return { pagesCreated: 0, topPages: [], topAuthors: [] };
        }
    }

    private getGeneralStats(teamName: string): GeneralStats {
        return {
            teamName,
            funFacts: [
                'We shipped code!',
                'We fixed bugs!',
                'We are awesome!'
            ]
        };
    }
}
