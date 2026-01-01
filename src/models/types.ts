
export interface ReviewData {
    year: number;
    generatedAt: string; // ISO date
    scope: {
        type: 'project' | 'repo' | 'team';
        id?: string;
        name?: string;
    };
    stats: {
        repos: RepoStats;
        pipelines: PipelineStats;
        wiki: WikiStats;
        workItems: WorkItemStats;
        pr: PRStats;
        general: GeneralStats;
    };
    config?: {
        enabledStoryIds: string[];
    };
}

export interface RepoStats {
    totalCommits: number;
    topContributor: UserStat;
    topContributors: UserStat[]; // Top 5
    busiestDay: { date: string; count: number }; // ISO date
    commitTimeDistribution: Record<string, number>; // Hour of day -> count
    linesAdded: number;
    linesDeleted: number;
    activeRepo: { name: string; count: number };
}

export interface PipelineStats {
    totalRuns: number;
    busiestDay: { date: string; count: number };
    topPipelines: { name: string; count: number }[];
    successRate: number; // 0-100
    longestRun: { name: string; durationMinutes: number };
    fastestRun: { name: string; durationMinutes: number };
}

export interface WikiStats {
    pagesCreated: number;
    topPages: { title: string; views: number }[];
    topAuthors: UserStat[];
}

export interface WorkItemStats {
    completed: number;
    bugsSquashed: number;
    activeSprint: { name: string; completedCount: number };
    activeBacklogItems: { title: string; comments: number }[];
}

export interface PRStats {
    merged: number;
    topReviewer: UserStat;
    discussionCount: number; // Comments/threads
    fastestMerge: { title: string; durationHours: number };
    longestMerge: { title: string; durationHours: number };
}

export interface GeneralStats {
    teamName: string;
    funFacts: string[];
}

export interface UserStat {
    displayName: string;
    imageUrl?: string;
    count: number;
}

export type StoryCategory = 'repos' | 'pipelines' | 'wiki' | 'workItems' | 'pr' | 'achievements';

export interface StoryConfig {
    id: string;
    category: StoryCategory;
    enabled: boolean;
    title: string;
}

export type SlideTheme = 'purple' | 'pink' | 'cyan' | 'emerald' | 'default';

export interface SlideData {
    id: string;
    type: string;
    title?: string;
    data: any;
    duration?: number; // seconds
    theme?: SlideTheme;
}

