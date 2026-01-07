import * as SDK from 'azure-devops-extension-sdk';
import { getClient } from 'azure-devops-extension-api';
import { GitRestClient, GitVersionType, PullRequestStatus, PullRequestTimeRangeType } from 'azure-devops-extension-api/Git';
import type { GitCommitRef, GitPullRequest, GitQueryCommitsCriteria, GitVersionDescriptor } from 'azure-devops-extension-api/Git';
import { Build, BuildRestClient, BuildResult } from 'azure-devops-extension-api/Build';
import { WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking';
import { WikiPageDetail, WikiRestClient } from 'azure-devops-extension-api/Wiki';
import type { ReviewData, RepoStats, PipelineStats, WorkItemStats, PRStats, WikiStats, GeneralStats, UserStat } from '../models/types';

export class AdoService {
    async initADO(): Promise<void> {
        if (window.self !== window.top || !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            try {
                await SDK.init();
                await SDK.ready();

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


        //Parallelize fetching data
        const [repoStats, pipelineStats, workItemStats, prStats, wikiStats] = await Promise.all([
            this.getRepoStats(projectId, year),
            this.getPipelineStats(projectId, year),
            this.getWorkItemStats(projectName, year),
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
                const pageSize = 1000;
                let continueFetch = true;
                let skip = 0;
                const allCommits: GitCommitRef[] = [];
                const searchCriteria = {
                    fromDate,
                    toDate,
                    itemVersion: { version: 'main', versionType: GitVersionType.Branch } as GitVersionDescriptor,
                    includeUserImageUrl: true,
                } as GitQueryCommitsCriteria;

                while (continueFetch) {
                    searchCriteria.$top = pageSize;
                    searchCriteria.$skip = skip;
                    const commits = await client.getCommits(repo.id, searchCriteria, projectId);

                    if (!commits || commits.length === 0) return;
                    allCommits.push(...commits);
                    if (commits.length < pageSize) {
                        continueFetch = false;
                    } else {
                        skip += pageSize;
                    }
                }

                repoCommitCounts.set(repo.name, allCommits.length);
                totalCommits += allCommits.length;

                for (const commit of allCommits) {
                    if (commit.author && commit.author.name) {
                        const name = commit.author.name;
                        // @ts-ignore: imageUrl exists on some responses
                        const imageUrl = commit.author.imageUrl;
                        const current = commitsByAuthor.get(name) || { count: 0, imageUrl };
                        commitsByAuthor.set(name, { count: current.count + 1, imageUrl: imageUrl || current.imageUrl });
                    }

                    if (commit.changeCounts) {
                        const changes = commit.changeCounts as any;
                        linesAdded += (changes[1] || 0) + (changes[2] || 0);
                        linesDeleted += (changes[16] || 0);
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

        const pageSize = 1000;
        let continuationToken = '';
        const allBuilds: Build[] = [];
        let continueFetch = true;

        while (continueFetch) {
            const builds = await client.getBuilds(
                project,
                undefined, undefined, undefined,
                minTime, maxTime,
                undefined, undefined, undefined, undefined, undefined, undefined,
                pageSize,
                continuationToken
            );
            if (builds.length === 0) {
                break;
            }
            allBuilds.push(...builds);
            if (builds.length < pageSize) {
                continueFetch = false;
            } else {
                continuationToken = builds[builds.length - 1].id?.toString() || '';
            }
        }

        const totalRuns = allBuilds.length;
        let successCount = 0;
        const buildsByDay = new Map<string, number>();
        const buildsByDef = new Map<string, number>();
        let longestRun = { name: '', durationMinutes: 0 };
        let fastestRun = { name: '', durationMinutes: 999999 };

        for (const build of allBuilds) {
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

        longestRun.durationMinutes = Math.round(longestRun.durationMinutes);
        fastestRun.durationMinutes = parseFloat(fastestRun.durationMinutes.toFixed(2));

        return {
            totalRuns,
            busiestDay: busiestDay.count ? busiestDay : { date: new Date().toISOString().split('T')[0], count: 0 },
            topPipelines,
            successRate: totalRuns > 0 ? (successCount / totalRuns) * 100 : 0,
            longestRun: longestRun.name ? longestRun : { name: 'None', durationMinutes: 0 },
            fastestRun: fastestRun.durationMinutes < 999999 ? fastestRun : { name: 'None', durationMinutes: 0 }
        };
    }

    private async getWorkItemStats(projectName: string, year: number): Promise<WorkItemStats> {
        const client = getClient(WorkItemTrackingRestClient);
        const fromDate = new Date(year, 0, 1).toISOString();
        const toDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

        const wiql = {
            query: `
            SELECT [System.Id]
            FROM WorkItems
            WHERE [System.TeamProject] = '${projectName}'
            AND [System.State] IN ('Closed', 'Completed', 'Done', 'Resolved')
            AND [Microsoft.VSTS.Common.ClosedDate] >= '${fromDate}'
            AND [Microsoft.VSTS.Common.ClosedDate] <= '${toDate}'
        `
        };

        try {
            const results = await client.queryByWiql(wiql, projectName, undefined, true);
            const workItemRefs = results.workItems || [];

            if (workItemRefs.length === 0) {
                return { completed: 0, bugsSquashed: 0, activeSprint: { name: 'Unknown', completedCount: 0 }, activeBacklogItems: [] };
            }

            // Batch fetch with only needed fields (max 200 per request)
            const ids = workItemRefs.map(wi => wi.id);
            const fields = ['System.WorkItemType', 'System.IterationPath'];
            const batchSize = 200;

            // Build all batch promises
            const batchPromises: Promise<any[]>[] = [];
            for (let i = 0; i < ids.length; i += batchSize) {
                const batchIds = ids.slice(i, i + batchSize);
                batchPromises.push(client.getWorkItems(batchIds, projectName, fields));
            }

            // Execute in parallel with concurrency limit
            const allWorkItems: any[] = [];
            const concurrencyLimit = 5;
            for (let i = 0; i < batchPromises.length; i += concurrencyLimit) {
                const batch = batchPromises.slice(i, i + concurrencyLimit);
                const results = await Promise.all(batch);
                results.forEach(items => allWorkItems.push(...items.filter(Boolean)));
            }

            // Aggregate stats
            let bugsSquashed = 0;
            const iterationCounts = new Map<string, number>();

            for (const item of allWorkItems) {
                const type = item.fields?.['System.WorkItemType'];
                const iteration = item.fields?.['System.IterationPath'];

                if (type === 'Bug') bugsSquashed++;
                if (iteration) {
                    iterationCounts.set(iteration, (iterationCounts.get(iteration) || 0) + 1);
                }
            }

            // Find most active sprint
            let activeSprint = { name: 'Unknown', completedCount: 0 };
            for (const [name, count] of iterationCounts) {
                if (count > activeSprint.completedCount || activeSprint.completedCount === 0) {
                    activeSprint = { name, completedCount: count };
                }
            }

            return {
                completed: allWorkItems.length,
                bugsSquashed,
                activeSprint,
                activeBacklogItems: []
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
        const pageSize = 500;
        const allPRs: GitPullRequest[] = [];
        let continueFetch = true;

        while (continueFetch) {
            const prs = await client.getPullRequestsByProject(
                project,
                {
                    status: PullRequestStatus.Completed,
                    maxTime: maxTime.toISOString(),
                    minTime: minTime.toISOString(),
                    queryTimeRangeType: PullRequestTimeRangeType.Closed,
                    $top: pageSize,
                    $skip: allPRs.length
                } as any
            );

            if (prs.length === 0) {
                break;
            }
            allPRs.push(...prs);
            if (prs.length < pageSize) {
                continueFetch = false;
            }
        }

        let merged = 0;
        const reviewers = new Map<string, { count: number, imageUrl?: string }>();
        let fastestMerge = { title: '', durationMinutes: 99999 };
        let longestMerge = { title: '', durationMinutes: 0 };

        for (const pr of allPRs) {
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
                        const durationMinutes = (closeDate.getTime() - createDate.getTime()) / (1000 * 60);

                        if (durationMinutes > longestMerge.durationMinutes) {
                            longestMerge = { title: pr.title || 'Untitled', durationMinutes };
                        }
                        if (durationMinutes < fastestMerge.durationMinutes && durationMinutes > 0) {
                            fastestMerge = { title: pr.title || 'Untitled', durationMinutes };
                        }
                    }
                }
            }
        }

        fastestMerge.durationMinutes = parseFloat(fastestMerge.durationMinutes.toFixed(2));
        longestMerge.durationMinutes = Math.round(longestMerge.durationMinutes);
        const sortedReviewers = [...reviewers.entries()]
            .map(([displayName, stats]) => ({ displayName, count: stats.count, imageUrl: stats.imageUrl }))
            .sort((a, b) => b.count - a.count);

        const topReviewer = sortedReviewers[0] || { displayName: 'Ghost', count: 0 };

        return {
            merged,
            topReviewer,
            discussionCount: merged, // Mock estimation: avg 3 comments per PR
            fastestMerge: fastestMerge.durationMinutes < 99999 ? fastestMerge : { title: 'None', durationMinutes: 0 },
            longestMerge: longestMerge.title ? longestMerge : { title: 'None', durationMinutes: 0 }
        };
    }

    private async getWikiStats(project: string, year: number): Promise<WikiStats> {
        const client = getClient(WikiRestClient);
        const result: WikiStats = { pagesCreated: 0, topPages: [], topAuthors: [] };
        try {
            const wikis = await client.getAllWikis(project);
            if (!wikis || wikis.length === 0) {
                return result;
            }

            for (const wiki of wikis) {
                const pageSize = 100;
                let continuationToken: string | null = null;
                const allPages: WikiPageDetail[] = [];
                let continueFetch = true;
                try {
                    while (continueFetch) {
                        const request: any = continuationToken ? {
                            continuationToken,
                            pageviewsForDays: 30,
                            top: pageSize,
                        } : { top: pageSize, pageviewsForDays: 30 };
                        const pages = await client.getPagesBatch(request, project, wiki.id)

                        if (pages.length === 0) {
                            break;
                        }
                        allPages.push(...pages);
                        if (pages.length < pageSize) {
                            continueFetch = false;
                        } else {
                            continuationToken = pages.continuationToken;
                        }
                    }
                } catch (e) {
                    // Ignore errors fetching pages
                }

                const topPages: { title: string; views: number }[] = [];
                const fromDate = new Date(year, 0, 1);
                const toDate = new Date(year, 11, 31, 23, 59, 59);
                for (const page of allPages) {
                    for (const viewStat of page.viewStats) {
                        if (viewStat.day >= fromDate && viewStat.day <= toDate) {
                            topPages.push({ title: page.path || 'Unknown', views: viewStat.count });
                        }
                    }
                }

                result.topPages.push(...topPages);
            }
            return result
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
