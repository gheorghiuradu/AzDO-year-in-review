import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const StatBigNumberStory: React.FC<{ data: any }> = ({ data }) => {
    const { value, label, subtext } = data;

    // Counter animation
    const spring = useSpring(0, { stiffness: 50, damping: 20 });
    console.log('Animating to value:', value);
    const displayValue = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        // Delay start slightly
        setTimeout(() => {
            spring.set(value);

            if (data.confetti) {
                import('canvas-confetti').then((confetti) => {
                    confetti.default({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#ffffff']
                    });
                });
            }
        }, 300);
    }, [value, spring, data.confetti]);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-4xl">
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl text-purple-200 font-medium uppercase tracking-widest mb-8"
                style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}
            >
                {label}
            </motion.div>

            <motion.div
                className="text-8xl font-black text-white mb-8"
                style={{ fontSize: '8rem', textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
                <motion.span>{displayValue}</motion.span>
            </motion.div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="glass-card p-6 rounded-xl"
                style={{ padding: '2rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px' }}
            >
                <p className="text-xl italic text-white" style={{ fontSize: '1.5rem', fontStyle: 'italic' }}>
                    "{subtext}"
                </p>
            </motion.div>
        </div>
    );
};
