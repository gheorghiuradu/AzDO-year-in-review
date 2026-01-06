import type { StoryCategory, StoryConfig } from "./types";

export const AVAILABLE_STORIES: StoryConfig[] = [
    // Repos
    { id: 'repos-commits', category: 'repos', enabled: true, title: 'Total Commits' },
    { id: 'repos-top-contributor', category: 'repos', enabled: true, title: 'Top Contributor' },
    { id: 'repos-leaderboard', category: 'repos', enabled: true, title: 'Top 5 Contributors' },
    { id: 'repos-busiest-day', category: 'repos', enabled: true, title: 'Day with Most Commits' },
    // { id: 'repos-commit-time', category: 'repos', enabled: true, title: 'Commit Time Distribution' },
    { id: 'repos-lines', category: 'repos', enabled: true, title: 'Lines of Code' },
    { id: 'repos-active-repo', category: 'repos', enabled: true, title: 'Most Active Repo' },
    // Pipelines
    { id: 'pipelines-total', category: 'pipelines', enabled: true, title: 'Total Pipeline Runs' },
    { id: 'pipelines-busiest-day', category: 'pipelines', enabled: true, title: 'Most Busy Day' },
    { id: 'pipelines-top-3', category: 'pipelines', enabled: true, title: 'Top 3 Pipelines' },
    { id: 'pipelines-success-rate', category: 'pipelines', enabled: true, title: 'Success Rate' },
    { id: 'pipelines-longest', category: 'pipelines', enabled: true, title: 'Longest Run' },
    { id: 'pipelines-fastest', category: 'pipelines', enabled: true, title: 'Fastest Run' },
    // Wiki
    // { id: 'wiki-created', category: 'wiki', enabled: true, title: 'Pages Created' },
    { id: 'wiki-most-visited', category: 'wiki', enabled: true, title: 'Most Visited Pages' },
    // { id: 'wiki-top-contributors', category: 'wiki', enabled: true, title: 'Top Wiki Authors' },
    // Work Items
    { id: 'work-completed', category: 'workItems', enabled: true, title: 'Completed Work Items' },
    { id: 'work-bugs', category: 'workItems', enabled: true, title: 'Bugs Squashed' },
    { id: 'work-sprint', category: 'workItems', enabled: true, title: 'Sprint Champion' },
    // { id: 'work-active-backlog', category: 'workItems', enabled: true, title: 'Most Active Items' },
    // PRs
    { id: 'pr-merged', category: 'pr', enabled: true, title: 'PRs Merged' },
    { id: 'pr-champion', category: 'pr', enabled: true, title: 'Code Review Champion' },
    // { id: 'pr-discussion', category: 'pr', enabled: true, title: 'Discussion Stats' },
    { id: 'pr-fastest', category: 'pr', enabled: true, title: 'Fastest Merge' },
    { id: 'pr-longest', category: 'pr', enabled: true, title: 'Longest Journey' },
    // Achievements
    { id: 'achievements-team-stats', category: 'achievements', enabled: true, title: 'Team Stats Summary' },
    { id: 'achievements-fun-facts', category: 'achievements', enabled: true, title: 'Fun Facts' },
    { id: 'achievements-prediction', category: 'achievements', enabled: true, title: 'Prediction for Next Year' },
    { id: 'achievements-finale', category: 'achievements', enabled: true, title: 'Thank You / Finale' },
];

export const CATEGORY_LABELS: Record<StoryCategory, string> = {
    repos: 'Azure Repos',
    pipelines: 'Azure Pipelines',
    wiki: 'Azure Wiki',
    workItems: 'Boards & Work Items',
    pr: 'Pull Requests',
    achievements: 'Achievements & Fun'
};