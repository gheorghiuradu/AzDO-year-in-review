import React from 'react';
import { motion } from 'framer-motion';

interface ListItem {
    label: string;
    sublabel?: string;
    value?: string | number;
    image?: string;
}

export const ListStory: React.FC<{ data: { items: ListItem[], title?: string } }> = ({ data }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl p-4">
            {data.title && (
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl text-white font-bold mb-8 uppercase tracking-wider text-center"
                >
                    {data.title}
                </motion.h2>
            )}

            <div className="w-full space-y-4">
                {data.items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="glass-card p-4 flex items-center gap-4 rounded-xl"
                        style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                    >
                        {index < 3 && (
                            <div className="text-2xl font-bold w-8 text-center" style={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#b45309' }}>
                                #{index + 1}
                            </div>
                        )}

                        {item.image && (
                            <img src={item.image} alt={item.label} className="w-10 h-10 rounded-full bg-gray-700" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="text-white font-bold truncate">{item.label}</div>
                            {item.sublabel && <div className="text-white/60 text-sm truncate">{item.sublabel}</div>}
                        </div>

                        {item.value && (
                            <div className="text-purple-300 font-mono font-bold">
                                {item.value}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
