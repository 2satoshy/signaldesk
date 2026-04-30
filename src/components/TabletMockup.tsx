import React from 'react';
import { motion, MotionValue, useTransform } from 'motion/react';

interface TabletProps {
    children: React.ReactNode;
    style?: any;
    className?: string;
}

export function TabletMockup({ children, style, className = "" }: TabletProps) {
    return (
        <motion.div 
            style={style}
            className={`relative w-[400px] h-[550px] rounded-[2.5rem] bg-[#111] border-[8px] border-[#222] shadow-[20px_40px_100px_rgba(0,0,0,0.8),-10px_-10px_30px_rgba(255,255,255,0.05)] overflow-hidden preserve-3d flex-shrink-0 ${className}`}
        >
            <div className="relative w-full h-full rounded-[2rem] bg-black overflow-hidden flex flex-col font-sans">
                {/* Camera */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 z-50">
                    <div className="absolute inset-0.5 rounded-full bg-blue-500/20" />
                </div>
                {children}
            </div>
            {/* Glare effect */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/10 via-white/0 to-white/5 pointer-events-none" style={{ zIndex: 100 }} />
        </motion.div>
    );
}
