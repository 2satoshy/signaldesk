import React from 'react';
import { motion, useTransform, MotionValue } from 'motion/react';
import { cn } from '../lib/utils';

interface ScrollTextProps {
    scrollYProgress: MotionValue<number>;
    range: [number, number, number, number]; // [fade-in start, fade-in end, fade-out start, fade-out end]
    children: React.ReactNode;
    className?: string;
}

export function ScrollText({ scrollYProgress, range, children, className }: ScrollTextProps) {
    // If the first two values are 0, we assume it starts fully visible
    const startsVisible = range[0] === 0 && range[1] === 0;
    
    // We adjust the range to ensure monotonic strictly increasing for useTransform WAAPI safely if needed
    // But since useTransform with WAAPI prefers unique offsets, we can just tweak the arrays
    const safeRange = startsVisible ? [0, range[2], range[3]] : range;
    const outputOpacity = startsVisible ? [1, 1, 0] : [0, 1, 1, 0];
    const outputY = startsVisible ? [0, 0, -40] : [40, 0, 0, -40];

    const opacity = useTransform(scrollYProgress, safeRange, outputOpacity);
    const y = useTransform(scrollYProgress, safeRange, outputY);

    return (
        <motion.div style={{ opacity, y }} className={cn("absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6", className)}>
            {children}
        </motion.div>
    );
}

export function ScrollSideText({ scrollYProgress, range, children, align = "right", className }: ScrollTextProps & { align?: "left" | "right" }) {
    const opacity = useTransform(scrollYProgress, range, [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, range, [40, 0, 0, -40]);
    
    return (
        <motion.div 
            style={{ opacity, y }} 
            className={cn(
                "absolute pointer-events-none flex flex-col justify-center", 
                // Context for mobile vs desktop: On mobile, center text usually near bottom/top vs sides
                "top-[60%] md:top-1/2 -translate-y-1/2 w-[80%] md:w-1/4",
                align === "right" 
                    ? "left-[10%] md:left-auto md:right-[10%] items-center md:items-start text-center md:text-left" 
                    : "left-[10%] items-center md:items-end text-center md:text-right",
                className
            )}
        >
            {children}
        </motion.div>
    );
}
