import type { ReviewData } from '../models/types';

export const generateMockData = (year: number): ReviewData => {
    return {
        year,
        generatedAt: new Date().toISOString(),
        scope: {
            type: 'project',
            name: 'Fabrikam Fiber',
        },
        stats: {
            repos: {
                totalCommits: 1247,
                topContributor: {
                    displayName: 'Jane Doe',
                    imageUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light',
                    count: 342,
                },
                topContributors: [
                    { displayName: 'Jane Doe', count: 342, imageUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light' },
                    { displayName: 'John Smith', count: 215, imageUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Sunglasses&hairColor=Blonde&facialHairType=BeardMedium&clotheType=Hoodie&eyeType=Wink&eyebrowType=RaisedExcited&mouthType=Laugh&skinColor=Pale' },
                    { displayName: 'Alice Wong', count: 189, imageUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=LongHairBun&accessoriesType=Prescription02&hairColor=Black&facialHairType=Blank&clotheType=ShirtCrewNeck&eyeType=Squint&eyebrowType=Default&mouthType=Smile&skinColor=Yellow' },
                    { displayName: 'Bob Johnson', count: 120, imageUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=Brown&facialHairType=MoustacheFancy&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=DarkBrown' },
                    { displayName: 'Charlie Brown', count: 98, imageUrl: 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairTheCaesar&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=ShirtScoopNeck&eyeType=Surprised&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Light' },
                ],
                busiestDay: { date: `${year}-11-14`, count: 45 },
                commitTimeDistribution: {
                    '09': 15, '10': 120, '11': 140, '14': 130, '15': 160, '16': 110, '22': 5,
                },
                linesAdded: 54321,
                linesDeleted: 32109,
                activeRepo: { name: 'frontend-web', count: 850 },
            },
            pipelines: {
                totalRuns: 4521,
                busiestDay: { date: `${year}-09-21`, count: 120 },
                topPipelines: [
                    { name: 'CI-Main', count: 1540 },
                    { name: 'Release-Prod', count: 420 },
                    { name: 'Nightly-Test', count: 365 },
                ],
                successRate: 92.5,
                longestRun: { name: 'End-to-End Tests', durationMinutes: 45 },
                fastestRun: { name: 'Lint Check', durationMinutes: 2 },
            },
            wiki: {
                pagesCreated: 24,
                topPages: [
                    { title: 'Onboarding Guide', views: 1250 },
                    { title: 'API Documentation', views: 890 },
                    { title: 'Deploy Process', views: 650 },
                ],
                topAuthors: [
                    { displayName: 'Sarah Writer', count: 10 },
                    { displayName: 'Dave Documenter', count: 8 },
                ],
            },
            workItems: {
                completed: 1250,
                bugsSquashed: 342,
                activeSprint: { name: 'Sprint 24', completedCount: 45 },
                activeBacklogItems: [
                    { title: 'Refactor Auth', comments: 156 },
                    { title: 'New Dashboard', comments: 89 },
                ],
            },
            pr: {
                merged: 850,
                topReviewer: { displayName: 'Reviewer Rick', count: 520 },
                discussionCount: 3420,
                fastestMerge: { title: 'Fix typo', durationHours: 0.1 },
                longestMerge: { title: 'Major Refactor', durationHours: 145 },
            },
            general: {
                teamName: 'The Dream Team',
                funFacts: [
                    'Most commits on a Sunday: 12',
                    'Longest commit message: 500 chars',
                    'We deployed on a Friday... and survived!',
                ],
            },
        },
    };
};
