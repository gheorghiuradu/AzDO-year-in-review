import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export const MessageStory: React.FC<{ data: { title?: string, mainText: string, subText?: string, icon?: string, confetti?: boolean } }> = ({ data }) => {

    useEffect(() => {
        if (data.confetti) {
            import('canvas-confetti').then((confetti) => {
                confetti.default({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 }
                });
            });
        }
    }, [data.confetti]);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-4xl">
            {data.title && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl text-purple-200 font-medium uppercase tracking-widest mb-8"
                    style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}
                >
                    {data.title}
                </motion.div>
            )}

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-6xl font-black text-white mb-8"
                style={{ fontSize: '5rem', textShadow: '0 4px 30px rgba(0,0,0,0.5)', lineHeight: 1.1 }}
            >
                {data.mainText}
            </motion.div>

            {data.subText && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="glass-card p-6 rounded-xl"
                    style={{ padding: '2rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px' }}
                >
                    <p className="text-xl italic text-white" style={{ fontSize: '1.5rem', fontStyle: 'italic' }}>
                        "{data.subText}"
                    </p>
                </motion.div>
            )}
        </div>
    );
};
