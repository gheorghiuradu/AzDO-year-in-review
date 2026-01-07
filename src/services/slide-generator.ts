import type { Predictions, ReviewData, SlideData } from '../models/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateSlides = (data: ReviewData, predictions: Predictions): SlideData[] => {
    const slides: SlideData[] = [];
    const enabledIds = new Set(data.config?.enabledStoryIds || []);

    const addSlide = (id: string, builder: () => SlideData) => {
        if (enabledIds.has(id)) {
            slides.push(builder());
        }
    };

    // 1. Intro Slide
    slides.push({
        id: generateId(),
        type: 'intro',
        title: 'Welcome',
        data: { year: data.year, teamName: data.stats.general.teamName },
        duration: 5,
        theme: 'default'
    });

    const { repos, pipelines, wiki, workItems, pr, general } = data.stats;

    // --- REPOS ---
    if (repos.totalCommits !== undefined || repos.totalCommits !== null || repos.totalCommits > 0) {
        addSlide('repos-commits', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'Total Commits',
            data: {
                value: repos.totalCommits,
                label: 'Commits Pushed',
                subtext: "You've been pretty COMMIT-ted this year!",
                confetti: true
            },
            theme: 'purple'
        }));
    }

    addSlide('repos-top-contributor', () => ({
        id: generateId(),
        type: 'message',
        title: 'Top Contributor',
        data: {
            title: 'Top Contributor 👑',
            mainText: repos.topContributor.displayName,
            subText: `${repos.topContributor.count} commits`,
            confetti: true
        },
        theme: 'purple'
    }));


    if (repos.topContributors && repos.topContributors.length > 0) {
        addSlide('repos-leaderboard', () => ({
            id: generateId(),
            type: 'list',
            title: 'Top Contributors',
            data: {
                title: 'Commit Leaders',
                items: repos.topContributors.map(u => ({
                    label: u.displayName,
                    value: u.count,
                    image: u.imageUrl
                }))
            },
            theme: 'purple'
        }));
    }

    if (repos.busiestDay !== undefined && repos.busiestDay !== null) {
        addSlide('repos-busiest-day', () => ({
            id: generateId(),
            type: 'message',
            title: 'Busiest Day',
            data: {
                title: 'Busiest Day 📅',
                mainText: new Date(repos.busiestDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                subText: `${repos.busiestDay.count} commits on this day!`,
            },
            theme: 'purple'
        }));
    }

    // Skipping complex chart 'repos-commit-time' for now, using message
    // addSlide('repos-commit-time', () => ({
    //     id: generateId(),
    //     type: 'message',
    //     title: 'Commit Time',
    //     data: {
    //         title: 'Night Owl or Early Bird?',
    //         mainText: '10 AM', // Mock logic
    //         subText: 'Most of your commits happen around 10 AM',
    //     },
    //     theme: 'purple'
    // }));


    if (repos.linesAdded && repos.linesAdded > 0) {
        addSlide('repos-lines', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'Lines of Code',
            data: {
                value: repos.linesAdded,
                label: 'Lines Added',
                subtext: `...and ${repos.linesDeleted} lines deleted!`,
            },
            theme: 'purple'
        }));
    }

    if (repos.activeRepo && repos.activeRepo.name && repos.activeRepo.count > 0) {
        addSlide('repos-active-repo', () => ({
            id: generateId(),
            type: 'message',
            title: 'Most Active Repo',
            data: {
                title: 'Most Active Repo 📁',
                mainText: repos.activeRepo.name,
                subText: `${repos.activeRepo.count} commits`,
            },
            theme: 'purple'
        }));
    }

    // --- PIPELINES ---
    if (pipelines.totalRuns && pipelines.totalRuns > 0) {
        addSlide('pipelines-total', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'Total Runs',
            data: {
                value: pipelines.totalRuns,
                label: 'Pipeline Runs',
                subtext: "That's a lot of builds!",
                confetti: true
            },
            theme: 'pink'
        }));
    }

    if (pipelines.busiestDay && pipelines.busiestDay.date && pipelines.busiestDay.count > 0) {
        addSlide('pipelines-busiest-day', () => ({
            id: generateId(),
            type: 'message',
            title: 'Pipeline Traffic',
            data: {
                title: 'Busiest Pipeline Day',
                mainText: new Date(pipelines.busiestDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                subText: `${pipelines.busiestDay.count} runs!`,
            },
            theme: 'pink'
        }));
    }

    if (pipelines.topPipelines && pipelines.topPipelines.length > 0) {
        addSlide('pipelines-top-3', () => ({
            id: generateId(),
            type: 'list',
            title: 'Top Pipelines',
            data: {
                title: 'Most Used Pipelines',
                items: pipelines.topPipelines.map(p => ({
                    label: p.name,
                    value: p.count
                }))
            },
            theme: 'pink'
        }));
    }

    if (pipelines.successRate && pipelines.successRate > 0) {
        addSlide('pipelines-success-rate', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'Success Rate',
            data: {
                value: pipelines.successRate,
                label: '% Success Rate',
                subtext: "Green builds make the dream work!",
            },
            theme: 'pink'
        }));
    }

    if (pipelines.longestRun && pipelines.longestRun.name && pipelines.longestRun.durationMinutes > 0) {
        addSlide('pipelines-longest', () => ({
            id: generateId(),
            type: 'message',
            title: 'Longest Run',
            data: {
                title: 'Marathon Runner 🐢',
                mainText: `${pipelines.longestRun.durationMinutes}m`,
                subText: pipelines.longestRun.name,
            },
            theme: 'pink'
        }));
    }

    if (pipelines.fastestRun && pipelines.fastestRun.name && pipelines.fastestRun.durationMinutes > 0) {
        addSlide('pipelines-fastest', () => ({
            id: generateId(),
            type: 'message',
            title: 'Fastest Run',
            data: {
                title: 'The Flash ⚡',
                mainText: `${pipelines.fastestRun.durationMinutes}m`,
                subText: pipelines.fastestRun.name,
            },
            theme: 'pink'
        }));
    }


    // --- WIKI ---
    // if (wiki.pagesCreated && wiki.pagesCreated > 0) {
    //     addSlide('wiki-created', () => ({
    //         id: generateId(),
    //         type: 'stat-big-number',
    //         title: 'Wiki Pages',
    //         data: {
    //             value: wiki.pagesCreated,
    //             label: 'New Pages',
    //             subtext: "Knowledge is power! 📖",
    //         },
    //         theme: 'cyan'
    //     }));
    // }

    if (wiki.topPages && wiki.topPages.length > 0) {
        addSlide('wiki-most-visited', () => ({
            id: generateId(),
            type: 'list',
            title: 'Popular Pages',
            data: {
                title: 'Most Read Pages',
                items: wiki.topPages.map(p => ({
                    label: p.title,
                    value: p.views
                }))
            },
            theme: 'cyan'
        }));
    }

    // if (wiki.topAuthors && wiki.topAuthors.length > 0) {
    //     addSlide('wiki-top-contributors', () => ({
    //         id: generateId(),
    //         type: 'list',
    //         title: 'Wiki Authors',
    //         data: {
    //             title: 'Top Authors',
    //             items: wiki.topAuthors.map(a => ({
    //                 label: a.displayName,
    //                 value: a.count
    //             }))
    //         },
    //         theme: 'cyan'
    //     }));
    // }

    // --- WORK ITEMS ---
    if (workItems.completed && workItems.completed > 0) {
        addSlide('work-completed', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'Completed Work',
            data: {
                value: workItems.completed,
                label: 'Completed Items',
                subtext: "Getting things done! ✅",
                confetti: true
            },
            theme: 'emerald'
        }));
    }

    if (workItems.bugsSquashed && workItems.bugsSquashed > 0) {
        addSlide('work-bugs', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'Bugs Squashed',
            data: {
                value: workItems.bugsSquashed,
                label: 'Bugs Squashed',
                subtext: "Exterminator mode! 🐛",
            },
            theme: 'emerald'
        }));
    }

    if (workItems.activeSprint && workItems.activeSprint.name && workItems.activeSprint.completedCount > 0) {
        addSlide('work-sprint', () => ({
            id: generateId(),
            type: 'message',
            title: 'Best Sprint',
            data: {
                title: 'Most Productive Sprint 🏃',
                mainText: workItems.activeSprint.name,
                subText: `${workItems.activeSprint.completedCount} items completed`,
            },
            theme: 'emerald'
        }));
    }

    // addSlide('work-active-backlog', () => ({
    //     id: generateId(),
    //     type: 'list',
    //     title: 'Active Discussions',
    //     data: {
    //         title: 'Hot Topics',
    //         items: workItems.activeBacklogItems.map(i => ({
    //             label: i.title,
    //             value: `${i.comments} comments`
    //         }))
    //     },
    //     theme: 'emerald'
    // }));


    // --- PRs ---
    if (pr.merged && pr.merged > 0) {
        addSlide('pr-merged', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'PRs Merged',
            data: {
                value: pr.merged,
                label: 'PRs Merged',
                subtext: "Ship early, ship often! 🚢",
                confetti: true
            },
            theme: 'purple'
        }));
    }

    if (pr.topReviewer && pr.topReviewer.displayName && pr.topReviewer.count > 0) {
        addSlide('pr-champion', () => ({
            id: generateId(),
            type: 'message',
            title: 'Review Champion',
            data: {
                title: 'Code Reviewer #1 🔍',
                mainText: pr.topReviewer.displayName,
                subText: `${pr.topReviewer.count} reviews`,
            },
            theme: 'purple'
        }));
    }

    // addSlide('pr-discussion', () => ({
    //     id: generateId(),
    //     type: 'stat-big-number',
    //     title: 'Discussions',
    //     data: {
    //         value: pr.discussionCount,
    //         label: 'Comments',
    //         subtext: "Great collaboration! 💬",
    //     },
    //     theme: 'purple'
    // }));

    if (pr.fastestMerge && pr.fastestMerge.title && pr.fastestMerge.durationMinutes > 0) {
        addSlide('pr-fastest', () => ({
            id: generateId(),
            type: 'message',
            title: 'Fastest PR',
            data: {
                title: 'Fastest Merge ⚡',
                mainText: `${pr.fastestMerge.durationMinutes}m`,
                subText: pr.fastestMerge.title,
            },
            theme: 'purple'
        }));
    }

    if (pr.longestMerge && pr.longestMerge.title && pr.longestMerge.durationMinutes > 0) {
        addSlide('pr-longest', () => ({
            id: generateId(),
            type: 'message',
            title: 'Longest PR',
            data: {
                title: 'The Saga 📖',
                mainText: `${pr.longestMerge.durationMinutes}m`,
                subText: pr.longestMerge.title,
            },
            theme: 'purple'
        }));
    }


    // --- ACHIEVEMENTS ---
    if (repos.totalCommits + pipelines.totalRuns + workItems.completed > 0) {
        addSlide('achievements-team-stats', () => ({
            id: generateId(),
            type: 'stat-big-number',
            title: 'Team Stats',
            data: {
                value: repos.totalCommits + pipelines.totalRuns + workItems.completed,
                label: 'Total Actions',
                subtext: "What a busy year!",
            },
            theme: 'default'
        }));
    }

    if (general.funFacts && general.funFacts.length > 0) {
        addSlide('achievements-fun-facts', () => ({
            id: generateId(),
            type: 'list',
            title: 'Fun Facts',
            data: {
                title: 'Did You Know? 🤔',
                items: general.funFacts.map(f => ({ label: f })) // ListStory expects items with label
            },
            theme: 'default'
        }));
    }

    // Prediction (mock)
    addSlide('achievements-prediction', () => ({
        id: generateId(),
        type: 'message',
        title: 'Prediction',
        data: {
            title: `${new Date().getFullYear() + 1} AI Prediction 🔮`,
            mainText: predictions.mainText,
            subText: predictions.subText,
        },
        theme: 'default'
    }));

    addSlide('achievements-finale', () => ({
        id: generateId(),
        type: 'message', // Could be outro type but message works
        title: 'Finale',
        data: {
            title: 'Thank You!',
            mainText: 'See you next year!',
            subText: 'Keep on coding!',
            confetti: true
        },
        theme: 'default'
    }));

    return slides;
};
