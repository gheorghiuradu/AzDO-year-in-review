import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { ReviewData, SlideData } from '../../types';
import { generateSlides } from '../../services/slide-generator';

// Placeholder story components - we will expand these later
import { IntroStory } from '../Stories/IntroStory';
import { StatBigNumberStory } from '../Stories/StatBigNumberStory';

interface PresentationPageProps {
    data: ReviewData;
    onExit: () => void;
}



export const PresentationPage: React.FC<PresentationPageProps> = ({ data, onExit }) => {
    const [slides, setSlides] = useState<SlideData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);

    useEffect(() => {
        const generated = generateSlides(data);
        setSlides(generated);
    }, [data]);

    // Timer logic
    useEffect(() => {
        if (slides.length === 0) return;

        if (isPaused) {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
            return;
        }

        const duration = (slides[currentIndex]?.duration || 5) * 1000;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;

            const elapsed = timestamp - startTimeRef.current + pausedTimeRef.current;
            const newProgress = Math.min((elapsed / duration) * 100, 100);

            setProgress(newProgress);

            if (elapsed >= duration) {
                goToNext();
            } else {
                timerRef.current = requestAnimationFrame(animate);
            }
        };

        timerRef.current = requestAnimationFrame(animate);

        return () => {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
        };
    }, [currentIndex, isPaused, slides]);

    const goToNext = () => {
        resetTimer();
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Loop or finish? Let's finish for now.
            onExit();
            // Or show a restart screen?
        }
    };

    const goToPrev = () => {
        resetTimer();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const resetTimer = () => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        startTimeRef.current = 0;
        pausedTimeRef.current = 0;
        setProgress(0);
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === ' ') setIsPaused(prev => !prev);
            if (e.key === 'Escape') onExit();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, slides.length]); // Dependencies needed to ensure goToNext uses fresh state if closure stale? safely use functional updates.

    const currentSlide = slides[currentIndex];

    if (!currentSlide) return <div className="full-screen flex-center">Loading...</div>;

    return (
        <div className="full-screen bg-black relative overflow-hidden"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            {/* Background Gradient based on theme */}
            <div className={`absolute inset-0 transition-colors duration-1000 ${currentSlide.theme === 'purple' ? 'bg-gradient-to-br from-indigo-900 to-purple-900' :
                currentSlide.theme === 'pink' ? 'bg-gradient-to-br from-purple-900 to-pink-900' :
                    currentSlide.theme === 'cyan' ? 'bg-gradient-to-br from-blue-900 to-cyan-900' :
                        'bg-gray-900'
                }`} style={{
                    background: currentSlide.theme === 'purple' ? 'linear-gradient(135deg, #312e81 0%, #581c87 100%)' :
                        currentSlide.theme === 'pink' ? 'linear-gradient(135deg, #581c87 0%, #831843 100%)' :
                            currentSlide.theme === 'cyan' ? 'linear-gradient(135deg, #1e3a8a 0%, #0e7490 100%)' :
                                'linear-gradient(135deg, #111827 0%, #374151 100%)',
                    transition: 'background 1s ease'
                }} />

            {/* Progress Bars */}
            <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 z-50">
                {slides.map((slide, idx) => (
                    <div key={slide.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all ease-linear"
                            style={{
                                width: idx < currentIndex ? '100%' :
                                    idx === currentIndex ? `${progress}%` : '0%',
                                transitionDuration: idx === currentIndex ? '0ms' : '300ms'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Story Content */}
            <div className="absolute inset-0 flex-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full flex-center"
                    >
                        {/* Dynamic Story Component Renderer */}
                        {renderStory(currentSlide)}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Tap Zones */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-40" onClick={(e) => { e.stopPropagation(); goToPrev(); }} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-40" onClick={(e) => { e.stopPropagation(); goToNext(); }} />

            {/* Close Button */}
            <button
                className="absolute top-8 right-4 z-50 text-white/50 hover:text-white"
                onClick={(e) => { e.stopPropagation(); onExit(); }}
            >
                ✕
            </button>
        </div>
    );
};

// Helper component to route to specific story types
const renderStory = (slide: SlideData) => {
    switch (slide.type) {
        case 'intro':
            return <IntroStory data={slide.data} />;
        case 'stat-big-number':
            return <StatBigNumberStory data={slide.data} />;
        // Add more cases as we build them
        default:
            return (
                <div className="text-center p-8">
                    <h2 className="text-4xl font-bold mb-4">{slide.title}</h2>
                    <pre className="text-left bg-black/30 p-4 rounded text-xs overflow-auto max-w-lg">
                        {JSON.stringify(slide.data, null, 2)}
                    </pre>
                </div>
            );
    }
};
