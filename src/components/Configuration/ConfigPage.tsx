import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ReviewData, StoryConfig, StoryCategory } from '../../models/types';
import { generateMockData } from '../../services/mock-data';
import { AVAILABLE_STORIES, CATEGORY_LABELS } from '../../models/constants';
import { AdoService } from '../../services/ado-service';

interface ConfigPageProps {
    onGenerate: (data: ReviewData) => void;
}

export const ConfigPage: React.FC<ConfigPageProps> = ({ onGenerate }) => {
    const years: number[] = [];
    for (let i = 0; i < 10; i++) {
        years.push(new Date().getFullYear() - i);
    }
    const [year, setYear] = useState(years[0]);
    const [loading, setLoading] = useState(false);
    const [stories, setStories] = useState<StoryConfig[]>(AVAILABLE_STORIES);
    const adoService = new AdoService();
    let project: { id: string; name: string } | undefined;

    useEffect(() => {
        adoService.initADO().then(() => {
            project = adoService.getProject();
        });
    }, []);

    const toggleStory = (id: string) => {
        setStories(stories.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ));
    };

    const toggleCategory = (category: StoryCategory) => {
        const categoryStories = stories.filter(s => s.category === category);
        const allEnabled = categoryStories.every(s => s.enabled);
        setStories(stories.map(s =>
            s.category === category ? { ...s, enabled: !allEnabled } : s
        ));
    };

    const handleGenerate = async () => {
        setLoading(true);
        //const data = generateMockData(year);
        const data = await adoService.getReviewData(year);
        console.log('Fetched review data:', data);
        // Attach config
        const finalData = {
            ...data,
            config: {
                enabledStoryIds: stories.filter(s => s.enabled).map(s => s.id)
            }
        };

        setLoading(false);
        onGenerate(finalData);
    };

    // Group stories by category
    const groupedStories = stories.reduce((acc, story) => {
        if (!acc[story.category]) acc[story.category] = [];
        acc[story.category].push(story);
        return acc;
    }, {} as Record<StoryCategory, StoryConfig[]>);

    const categories = Object.keys(groupedStories) as StoryCategory[];

    return (
        <div className="pt-150 flex-center full-screen flex-col overflow-y-auto custom-scrollbar bg-black/80">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card flex-col flex-center w-full max-w-4xl mx-4 my-8"
                style={{ padding: '2.5rem' }}
            >
                <div className="text-center mb-8">
                    <div className="flex-center">
                        <motion.img
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                            src="icon.png"
                            alt="Logo"
                            style={{ width: '80px', height: '80px', marginBottom: '1rem', borderRadius: '16px', }}
                        />
                    </div>
                    <h1 className="text-gradient" style={{ fontSize: '3rem', margin: '0', lineHeight: 1.2 }}>Year in Review</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                        Customize your team's {year} celebration!
                    </p>
                </div>

                <div className="w-full mb-8 max-w-xs mx-auto">
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-gray-300 text-center">
                        Select Year
                    </label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full p-3 rounded-xl border bg-white/10 text-white border-white/20 focus:border-purple-500 focus:outline-none text-xl text-center cursor-pointer hover:bg-white/20 transition-colors appearance-none"
                    >
                        {years.map((y) => (
                            <option key={y} value={y} className="text-black">{y}</option>
                        ))}
                    </select>
                </div>

                <div className="w-full mb-10">
                    <label className="block text-sm font-bold mb-4 uppercase tracking-wider text-gray-300 text-center">
                        Select Stories
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map((category) => (
                            <div key={category} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                                    <h3 className="font-bold text-lg text-purple-200">{CATEGORY_LABELS[category]}</h3>
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="text-xs text-purple-400 hover:text-purple-300 uppercase tracking-wider"
                                    >
                                        Toggle All
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {groupedStories[category].map((story) => (
                                        <div
                                            key={story.id}
                                            onClick={() => toggleStory(story.id)}
                                            className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${story.enabled
                                                ? 'bg-purple-500/20 text-white'
                                                : 'text-gray-500 hover:bg-white/5'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${story.enabled ? 'border-purple-400 bg-purple-400' : 'border-gray-600'}`}>
                                                {story.enabled && <span className="text-white text-[10px]">✓</span>}
                                            </div>
                                            <span className="text-sm">{story.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn-primary w-full max-w-sm mx-auto shadow-lg shadow-purple-500/30"
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
