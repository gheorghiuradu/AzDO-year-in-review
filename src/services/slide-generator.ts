import type { ReviewData, SlideData } from '../types';

// actually random string is fine.

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateSlides = (data: ReviewData): SlideData[] => {
    const slides: SlideData[] = [];

    // 1. Intro Slide
    slides.push({
        id: generateId(),
        type: 'intro',
        title: 'Welcome',
        data: { year: data.year, teamName: data.stats.general.teamName },
        duration: 5,
        theme: 'default'
    });

    // 2. Repos Stories
    const repos = data.stats.repos;
    slides.push({
        id: generateId(),
        type: 'stat-big-number',
        title: 'Total Commits',
        data: {
            value: repos.totalCommits,
            label: 'Commits Pushed',
            subtext: "You've been pretty COMMIT-ted this year!",
            icon: 'git-commit'
        },
        theme: 'purple'
    });

    slides.push({
        id: generateId(),
        type: 'top-contributor',
        title: 'Top Contributor',
        data: { user: repos.topContributor, subtitle: 'The Commit King/Queen! 👑' },
        theme: 'purple'
    });

    slides.push({
        id: generateId(),
        type: 'leaderboard',
        title: 'Top Contributors',
        data: { users: repos.topContributors, metric: 'commits' },
        theme: 'purple'
    });

    // 3. Pipeline Stories
    const pipes = data.stats.pipelines;
    slides.push({
        id: generateId(),
        type: 'stat-big-number',
        title: 'Total Pipeline Runs',
        data: {
            value: pipes.totalRuns,
            label: 'Pipeline Runs',
            subtext: "That's a lot of builds!",
            icon: 'rocket'
        },
        theme: 'pink'
    });

    slides.push({
        id: generateId(),
        type: 'stat-percentage',
        title: 'Success Rate',
        data: {
            value: pipes.successRate,
            label: 'Success Rate',
            subtext: "Green builds make the dream work! 💚"
        },
        theme: 'pink'
    });

    // 4. PR Stories
    const pr = data.stats.pr;
    slides.push({
        id: generateId(),
        type: 'stat-big-number',
        title: 'Merged PRs',
        data: {
            value: pr.merged,
            label: 'Pull Requests Merged',
            subtext: "Ship it! 🚢",
            icon: 'git-merge'
        },
        theme: 'cyan'
    });

    slides.push({
        id: generateId(),
        type: 'leaderboard-simple',
        title: 'Top Reviewer',
        data: { user: pr.topReviewer, metric: 'reviews', label: 'Review Champion 🔍' },
        theme: 'cyan'
    });

    // 5. Summary / Outro
    slides.push({
        id: generateId(),
        type: 'outro',
        title: 'That\'s a Wrap!',
        data: { year: data.year },
        theme: 'default'
    });

    return slides;
};
