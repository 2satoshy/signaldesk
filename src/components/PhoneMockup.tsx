import React from 'react';
import { motion, MotionValue, useTransform } from 'motion/react';

interface PhoneProps {
    children: React.ReactNode;
    style?: any;
    className?: string;
}

export function PhoneMockup({ children, style, className = "" }: PhoneProps) {
    return (
        <motion.div 
            style={style}
            className={`relative w-[300px] h-[600px] rounded-[3rem] bg-[#111] border-[8px] border-[#222] shadow-[20px_40px_100px_rgba(0,0,0,0.8),-10px_-10px_30px_rgba(255,255,255,0.05)] overflow-hidden preserve-3d flex-shrink-0 ${className}`}
        >
            {/* Inner screen area */}
            <div className="relative w-full h-full rounded-[2.2rem] bg-black overflow-hidden flex flex-col font-sans">
                {/* notch */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                    <div className="w-12 h-1.5 rounded-full bg-slate-800/50" />
               </div>
               
               <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col text-slate-200">
                  {children}
               </div>
            </div>
            
            {/* Glass Glare effect over entire phone */}
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" style={{ zIndex: 100 }} />
        </motion.div>
    );
}

// Conversation components helper
export function WhatsappHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#111] border-b border-slate-800 pt-8" style={{ zIndex: 10 }}>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0" />
            <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">{title}</div>
                <div className="text-xs text-slate-500">online</div>
            </div>
        </div>
    )
}

export function Message({ text, isOwn, time = '' }: { text: string, isOwn?: boolean, time?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-20px" }}
            className={`flex flex-col max-w-[80%] ${isOwn ? 'self-end items-end' : 'self-start items-start'} mb-3`}
        >
            <div className={`px-4 py-2 rounded-2xl text-[13px] leading-relaxed ${isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#1A1A1A] text-slate-200 border border-slate-800 rounded-bl-sm'}`}>
                {text}
            </div>
            {time && <span className="text-[10px] text-slate-500 mt-1">{time}</span>}
        </motion.div>
    );
}
