import React from 'react';
import { motion } from 'motion/react';

interface LaptopProps {
    children: React.ReactNode;
    style?: any;
    className?: string;
}

export function LaptopMockup({ children, style, className = "" }: LaptopProps) {
    return (
        <motion.div 
            style={style}
            className={`relative preserve-3d flex flex-col items-center flex-shrink-0 ${className}`}
        >
            {/* Screen / Lid */}
            <div className="relative w-[700px] h-[440px] bg-[#111] border-[4px] border-[#222] p-1.5 rounded-t-3xl rounded-b-sm shadow-[20px_40px_100px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.05)] overflow-hidden preserve-3d">
                {/* Inner Bezel */}
                <div className="relative w-full h-full bg-black rounded-t-2xl rounded-b-none border-4 border-black flex flex-col antialiased overflow-hidden">
                    {/* Camera */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 z-50">
                        <div className="absolute inset-0.5 rounded-full bg-blue-500/20" />
                    </div>
                    {children}
                </div>
            </div>
            
            {/* Base / Hinge */}
            <div className="relative w-[800px] h-4 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-2xl rounded-t-none -mt-1 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] flex justify-center border-b border-slate-900 border-x border-slate-900 z-20">
                <div className="w-32 h-full bg-slate-800 rounded-b-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
            
            {/* Glass Glare */}
            <div className="absolute top-0 w-[700px] h-[440px] bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none rounded-t-3xl z-10" />
        </motion.div>
    );
}
