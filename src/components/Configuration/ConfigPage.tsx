import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReviewData, StoryConfig } from '../../types';
import { generateMockData } from '../../services/mock-data';

interface ConfigPageProps {
    onGenerate: (data: ReviewData) => void;
}

const AVAILABLE_STORIES: StoryConfig[] = [
    { id: 'repos', category: 'repos', enabled: true, title: 'Code & Commits' },
    { id: 'pipelines', category: 'pipelines', enabled: true, title: 'Pipelines & CI/CD' },
    { id: 'wiki', category: 'wiki', enabled: true, title: 'Wiki & Knowledge' },
    { id: 'workItems', category: 'workItems', enabled: true, title: 'Work Items & Boards' },
    { id: 'pr', category: 'pr', enabled: true, title: 'Pull Requests' },
    { id: 'achievements', category: 'achievements', enabled: true, title: 'Fun Facts & Achievements' },
];

export const ConfigPage: React.FC<ConfigPageProps> = ({ onGenerate }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [stories, setStories] = useState<StoryConfig[]>(AVAILABLE_STORIES);

    const toggleStory = (id: string) => {
        setStories(stories.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ));
    };

    const handleGenerate = async () => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In real app, we would filter data based on selected stories/scope
        const data = generateMockData(year);

        setLoading(false);
        onGenerate(data);
    };

    return (
        <div className="flex-center full-screen flex-col overflow-y-auto custom-scrollbar">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-8 flex-col flex-center w-full max-w-2xl mx-4 my-8"
                style={{ padding: '2.5rem' }}
            >
                <div className="text-center mb-8">
                    <motion.img
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                        src="/images/icon.png"
                        alt="Logo"
                        style={{ width: '80px', height: '80px', marginBottom: '1rem', borderRadius: '16px' }}
                    />
                    <h1 className="text-gradient" style={{ fontSize: '3rem', margin: '0', lineHeight: 1.2 }}>Year in Review</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                        Ready to celebrate your team's {year} achievements?
                    </p>
                </div>

                <div className="w-full mb-8">
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-gray-300">
                        Select Year
                    </label>
                    <div className="flex gap-4">
                        {[year - 1, year].map((y) => (
                            <button
                                key={y}
                                onClick={() => setYear(y)}
                                className={`flex-1 p-4 rounded-xl border transition-all relative overflow-hidden ${year === y
                                    ? 'border-pink-500 bg-pink-500/20 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'
                                    }`}
                                style={{
                                    borderColor: year === y ? 'var(--color-secondary)' : 'rgba(255,255,255,0.1)',
                                    background: year === y ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                                }}
                            >
                                <div className="text-xl font-bold">{y}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full mb-10">
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-gray-300">
                        Include Stories
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {stories.map((story) => (
                            <motion.div
                                key={story.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleStory(story.id)}
                                className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${story.enabled
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-white/10 bg-white/5'
                                    }`}
                                style={{
                                    borderColor: story.enabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                    background: story.enabled ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center'
                                }}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${story.enabled ? 'border-purple-400 bg-purple-400' : 'border-gray-500'
                                    }`}
                                    style={{
                                        borderColor: story.enabled ? 'var(--color-primary)' : '#666',
                                        background: story.enabled ? 'var(--color-primary)' : 'transparent',
                                        width: '20px', height: '20px', borderRadius: '50%', marginRight: '10px'
                                    }}>
                                    {story.enabled && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span className={story.enabled ? 'text-white' : 'text-gray-400'}>
                                    {story.title}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn-primary w-full"
                    style={{ position: 'relative', overflow: 'hidden' }}
                >
                    {loading ? (
                        <span className="flex-center gap-2">
                            Generating Magic... ✨
                        </span>
                    ) : (
                        'Generate My Year! 🚀'
                    )}
                </motion.button>
            </motion.div>
        </div>
    );
};
