import React from 'react';
import { motion } from 'framer-motion';

export const IntroStory: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mb-8"
            >
                <img src="icon.png" alt="Logo" className="w-32 h-32 rounded-3xl shadow-2xl" style={{ width: '120px', height: '120px', borderRadius: '24px' }} />
            </motion.div>

            <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
                style={{ fontSize: '4rem', marginBottom: '1rem' }}
            >
                {data.year}
            </motion.h1>

            <motion.h2
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl text-white font-light"
                style={{ fontSize: '2.5rem' }}
            >
                Year in Review
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-xl text-purple-200"
                style={{ marginTop: '2rem', fontSize: '1.5rem', color: '#E9D5FF' }}
            >
                {data.teamName}
            </motion.p>
        </div>
    );
};
