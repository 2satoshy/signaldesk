import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'motion/react';
import { ParticleField } from './ParticleField';
import { ScrollText, ScrollSideText } from './ScrollText';
import { PhoneMockup, Message, WhatsappHeader } from './PhoneMockup';
import { LaptopMockup } from './LaptopMockup';
import { TabletMockup } from './TabletMockup';
import { AiOrb } from './AiOrb';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { time: '08:00', calls: 2, bookings: 0 },
  { time: '10:00', calls: 5, bookings: 1 },
  { time: '12:00', calls: 12, bookings: 4 },
  { time: '14:00', calls: 8, bookings: 2 },
  { time: '16:00', calls: 14, bookings: 6 },
];

export function StoryContainer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Opening Text
    const bgOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0.8]);

    const getLayoutVals = () => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const isMobile = w < 768;
        const isTablet = w >= 768 && w < 1024;
        return { isMobile, isTablet, w };
    };

    // Phone Transform
    const phoneY = useTransform(scrollYProgress, v => {
        if (v < 0.03) return 1000;
        if (v < 0.05) return 1000 - ((v - 0.03) / 0.02) * 1000;
        if (v < 0.98) return 0;
        return ((v - 0.98) / 0.02) * 1000;
    });

    const phoneX = useTransform(scrollYProgress, v => {
        const { isMobile, isTablet } = getLayoutVals();
        if (isMobile) {
            if (v < 0.88) return 0;
            if (v < 0.89) return -100 * ((v - 0.88) / 0.01);
            return -100;
        }
        if (isTablet) {
            if (v < 0.48) return 0;
            if (v < 0.54) return -250 * ((v - 0.48) / 0.06);
            if (v < 0.88) return -250;
            if (v < 0.89) return -250 - 50 * ((v - 0.88) / 0.01);
            return -300;
        }
        if (v < 0.48) return 0;
        if (v < 0.54) return -350 * ((v - 0.48) / 0.06);
        if (v < 0.88) return -350;
        if (v < 0.89) return -350 - 100 * ((v - 0.88) / 0.01);
        if (v < 0.92) return -450;
        return -450 - 550 * ((v - 0.92) / 0.01);
    });

    const phoneScale = useTransform(scrollYProgress, v => {
        const { isMobile, isTablet } = getLayoutVals();
        const baseScale = isMobile ? 0.8 : isTablet ? 0.9 : 1;
        const mobileShrink = isMobile ? 0.5 : 0.7;
        if (v < 0.88) return baseScale;
        if (v < 0.89) return baseScale - (baseScale - mobileShrink) * ((v - 0.88) / 0.01);
        return mobileShrink;
    });

    const phoneOpacity = useTransform(scrollYProgress, v => {
        const { isMobile } = getLayoutVals();
        if (isMobile) {
            // Fade out when laptop enters at 0.48
            if (v > 0.44 && v < 0.48) return 1 - ((v - 0.44) / 0.04);
            if (v >= 0.48 && v < 0.86) return 0;
            // Fade back in for scene 8
            if (v >= 0.86 && v < 0.88) return ((v - 0.86) / 0.02);
        }
        if (v < 0.92) return 1;
        if (v < 0.93) return 1 - ((v - 0.92) / 0.01);
        return 0;
    });
    
    // Laptop Transform
    const laptopY = useTransform(scrollYProgress, v => {
        if (v < 0.48) return 1000;
        if (v < 0.54) return 1000 - ((v - 0.48) / 0.06) * 1000;
        if (v < 0.98) return 0;
        return ((v - 0.98) / 0.02) * -1000;
    });

    const laptopX = useTransform(scrollYProgress, v => {
        const { isMobile, isTablet } = getLayoutVals();
        if (isMobile) {
            if (v < 0.88) return 0;
            if (v < 0.89) return 100 * ((v - 0.88) / 0.01);
            if (v < 0.92) return 100;
            return 100 - 1000 * ((v - 0.92) / 0.01);
        }
        const shiftX = isTablet ? 150 : 250;
        if (v < 0.48) return 0;
        if (v < 0.54) return shiftX * ((v - 0.48) / 0.06);
        if (v < 0.88) return shiftX;
        if (v < 0.89) return shiftX - (shiftX * ((v - 0.88) / 0.01)); // goes to 0
        if (v < 0.92) return 0;
        return -1000 * ((v - 0.92) / 0.01);
    });

    const laptopScale = useTransform(scrollYProgress, v => {
        const { isMobile, isTablet } = getLayoutVals();
        const baseScale = isMobile ? 0.45 : isTablet ? 0.6 : 0.8;
        const mainScale = isMobile ? 0.5 : isTablet ? 0.8 : 1.1;
        const finalScale = isMobile ? 0.4 : isTablet ? 0.5 : 0.65;
        
        if (v < 0.48) return baseScale;
        if (v < 0.54) return baseScale + (mainScale - baseScale) * ((v - 0.48) / 0.06);
        if (v < 0.88) return mainScale;
        if (v < 0.89) return mainScale - (mainScale - finalScale) * ((v - 0.88) / 0.01);
        return finalScale;
    });

    const laptopOpacity = useTransform(scrollYProgress, v => {
        const { isMobile } = getLayoutVals();
        if (v < 0.48) return 0;
        if (v < 0.52) return ((v - 0.48) / 0.04);
        
        if (isMobile) {
             if (v > 0.84 && v < 0.88) return 1 - ((v - 0.84) / 0.04);
             if (v >= 0.88) return 0;
        }

        if (v < 0.92) return 1;
        if (v < 0.93) return 1 - ((v - 0.92) / 0.01);
        return 0;
    });

    // Tablet Transform
    const tabletY = useTransform(scrollYProgress, v => {
        if (v < 0.88) return 1000;
        if (v < 0.89) return 1000 - ((v - 0.88) / 0.01) * 1000;
        if (v < 0.92) return 0;
        return ((v - 0.92) / 0.01) * 1000;
    });

    const tabletX = useTransform(scrollYProgress, v => {
        const { isMobile, isTablet } = getLayoutVals();
        if (isMobile) {
            if (v < 0.88) return 1000;
            return 30 * ((v - 0.88) / 0.01); // slightly right shifted
        }
        const shiftX = isTablet ? 300 : 450;
        if (v < 0.88) return 1000;
        if (v < 0.89) return 1000 - (1000 - shiftX) * ((v - 0.88) / 0.01);
        return shiftX;
    });

    const tabletScale = useTransform(scrollYProgress, v => {
        const { isMobile, isTablet } = getLayoutVals();
        const startScale = isMobile ? 0.4 : isTablet ? 0.4 : 0.5;
        const endScale = isMobile ? 0.55 : isTablet ? 0.6 : 0.7;
        
        if (v < 0.88) return startScale;
        if (v < 0.89) return startScale + (endScale - startScale) * ((v - 0.88) / 0.01);
        return endScale;
    });

    const tabletOpacity = useTransform(scrollYProgress, [0.88, 0.89, 0.92, 0.93], [0, 1, 1, 0]);

    // Phone Screen Opacities
    const s1Opacity = useTransform(scrollYProgress, [0, 0.20, 0.21, 0.23], [1, 1, 0, 0]);
    const s2Opacity = useTransform(scrollYProgress, [0, 0.21, 0.23, 0.24, 0.36, 0.37], [0, 0, 0, 1, 1, 0]);
    const s3Opacity = useTransform(scrollYProgress, [0, 0.36, 0.38, 0.39, 0.82, 0.83], [0, 0, 0, 1, 1, 0]);
    const s8PhoneOpacity = useTransform(scrollYProgress, [0, 0.88, 0.89], [0, 0, 1]);
    
    // Laptop screens
    const s4Opacity = useTransform(scrollYProgress, [0, 0.64, 0.65, 0.66], [1, 1, 0, 0]); // Email
    const s5Opacity = useTransform(scrollYProgress, [0, 0.64, 0.65, 0.66, 0.74, 0.75], [0, 0, 0, 1, 1, 0]); // Dashboard
    const s6Opacity = useTransform(scrollYProgress, [0, 0.74, 0.75, 0.76, 0.82, 0.83], [0, 0, 0, 1, 1, 0]); // Morning brief
    const s7Opacity = useTransform(scrollYProgress, [0, 0.82, 0.83, 0.84, 0.88, 0.89], [0, 0, 0, 1, 1, 0]); // Configuration
    const s8LaptopOpacity = useTransform(scrollYProgress, [0, 0.88, 0.89], [0, 0, 1]);

    return (
        <div ref={containerRef} className="relative w-full bg-[#050810] text-slate-200" style={{ height: "1500vh" }}>
            <ParticleField scrollYProgress={scrollYProgress} />
            <AiOrb />

            <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center perspective-1000">
                
                {/* 0% to 4% - Opening */}
                <ScrollText scrollYProgress={scrollYProgress} range={[0, 0, 0.015, 0.02]} className="font-serif">
                    <h2 className="text-4xl italic text-slate-400 tracking-wide z-50">"That was a client."</h2>
                </ScrollText>
                
                <ScrollText scrollYProgress={scrollYProgress} range={[0.012, 0.016, 0.026, 0.03]} className="font-serif">
                    <h2 className="text-2xl md:text-3xl italic text-slate-500 tracking-wide z-50">"They won't call again."</h2>
                </ScrollText>

                <ScrollText scrollYProgress={scrollYProgress} range={[0.028, 0.032, 0.04, 0.05]} className="font-serif">
                    <h1 className="text-5xl md:text-7xl italic font-light text-white tracking-tight z-50">Signal Desk<br/>answers every time.</h1>
                </ScrollText>

                {/* DEVICES CONTAINER */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    
                    {/* PHONE */}
                    <motion.div style={{ y: phoneY, x: phoneX, scale: phoneScale, opacity: phoneOpacity }} className="absolute z-20">
                        <PhoneMockup>
                            {/* Scene 1: WhatsApp Booking */}
                            <motion.div style={{ opacity: s1Opacity }} className="absolute inset-0 flex flex-col bg-[#0A0A0A]">
                                <WhatsappHeader title="Luxe Hair Studio" />
                                <div className="flex-1 p-4 flex flex-col justify-end overflow-hidden pb-8 space-y-4">
                                    <Message text="Hi, do you have anything open Saturday morning? Around 10?" time="22:14" />
                                    <Message text="Hi Aisha! We have 10am open with Lerato this Saturday — 90-minute slot. Want me to confirm?" isOwn time="22:14" />
                                    <Message text="Yes please!" time="22:15" />
                                    <Message text="Done! Booked Saturday 10am with Lerato. Reminder Friday afternoon. See you then. ✅" isOwn time="22:15" />
                                </div>
                            </motion.div>
                            
                            {/* Scene 2: Missed Call Recovery */}
                            <motion.div style={{ opacity: s2Opacity, pointerEvents: 'none' }} className="absolute inset-0 flex flex-col bg-[#0A0A0A]">
                                <div className="absolute top-16 inset-x-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-md">
                                    <h3 className="text-blue-400 text-sm font-medium">Missed Call</h3>
                                    <p className="text-slate-300 text-xs mt-1">Unknown Number • 14:32</p>
                                </div>
                                <div className="flex-1 mt-36 p-4 flex flex-col justify-end pb-8">
                                    <Message text="Hi there! You just tried to reach Momentum Motors — sorry we missed your call. This is Ravi, the dealership assistant. Can I help you right now?" isOwn time="14:32" />
                                    <Message text="Yeah I wanted to ask about the Polo they have listed." time="14:33" />
                                    <Message text="The 2023 Polo Vivo 1.4? Available at R189,900. Want to book a test drive or get full specs?" isOwn time="14:33" />
                                    <Message text="Book the test drive please." time="14:34" />
                                </div>
                            </motion.div>

                            {/* Scene 3: Voice Call */}
                            <motion.div style={{ opacity: s3Opacity, pointerEvents: 'none' }} className="absolute inset-0 flex flex-col bg-[#0A0A0A] items-center justify-center p-6 text-center">
                                <div className="w-20 h-20 bg-blue-600 rounded-full mb-6 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mt-12">
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/></svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-1 text-white">Grace</h3>
                                <p className="text-blue-400 text-xs uppercase tracking-widest mb-8">Active Assistant</p>
                                
                                {/* Pulsing Waveform Simulation */}
                                <div className="flex items-end justify-center gap-1 h-12 mb-8 mx-auto">
                                  <div className="w-1 h-4 bg-blue-500/40 rounded-full"></div>
                                  <div className="w-1 h-8 bg-blue-500/60 rounded-full animate-pulse"></div>
                                  <div className="w-1 h-12 bg-blue-500 rounded-full animate-bounce"></div>
                                  <div className="w-1 h-10 bg-blue-500/80 rounded-full animate-pulse"></div>
                                  <div className="w-1 h-6 bg-blue-500/50 rounded-full"></div>
                                  <div className="w-1 h-4 bg-blue-500/30 rounded-full"></div>
                                </div>

                                {/* Dynamic Transcript */}
                                <div className="text-left w-full space-y-3 px-2">
                                  <div className="text-[11px] text-slate-500 uppercase">Live Transcript</div>
                                  <p className="text-sm italic text-slate-300">"Dr. Naidoo has Thursday 9am available. Shall I secure that for you?"</p>
                                </div>
                            </motion.div>

                            {/* Scene 8: Multi-channel Phone */}
                            <motion.div style={{ opacity: s8PhoneOpacity }} className="absolute inset-0 flex flex-col bg-[#0A0A0A]">
                                <WhatsappHeader title="Marcus" />
                                <div className="flex-1 p-4 flex flex-col justify-end overflow-hidden pb-8 space-y-4">
                                    <Message text="Thanks!" time="10:45" />
                                </div>
                            </motion.div>
                        </PhoneMockup>
                    </motion.div>

                    {/* LAPTOP */}
                    <motion.div style={{ y: laptopY, x: laptopX, scale: laptopScale, opacity: laptopOpacity }} className="absolute z-10 w-[700px] pointer-events-auto">
                        <LaptopMockup>
                             {/* Scene 4: Email */}
                             <motion.div style={{ opacity: s4Opacity }} className="absolute inset-0 bg-[#0A0A0A] flex">
                                <div className="w-48 border-r border-[#151921] p-4 shrink-0">
                                    <div className="w-full h-8 bg-[#151921] rounded mb-4" />
                                    <div className="space-y-2">
                                        {[1,2,3,4].map(i => <div key={i} className="w-full h-12 bg-[#151921] rounded opacity-50" />)}
                                    </div>
                                </div>
                                <div className="flex-1 p-8 flex flex-col text-slate-200">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-full bg-[#151921]" />
                                        <div>
                                            <div className="font-medium text-white">Property Enquiry</div>
                                            <div className="text-xs text-slate-500">Today, 02:17 AM</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-sm text-slate-400 max-w-lg">
                                        <p>Dear James,</p>
                                        <p>I'm interested in the new listing in Sandton. Could you provide full specifications and availability for a viewing this week?</p>
                                        <div className="h-px w-full bg-[#151921] my-6" />
                                        <p className="text-slate-200">Hi there,</p>
                                        <p className="text-slate-200">Thank you for your interest. I've attached the full spec sheet. We have viewing slots open this Thursday at 14:00 or Friday at 10:00.</p>
                                        <p className="text-slate-200 mt-4">Looking forward to connecting — James, Client Relations.</p>
                                    </div>
                                </div>
                             </motion.div>

                             {/* Scene 5: Dashboard */}
                             <motion.div style={{ opacity: s5Opacity }} className="absolute inset-0 bg-[#0A0A0A] p-8 flex flex-col text-slate-200">
                                <div className="flex justify-between items-end mb-8">
                                    <h2 className="text-2xl font-serif font-light italic text-white">Live Pulse</h2>
                                    <div className="flex gap-4">
                                        <div className="px-3 py-1 rounded-full bg-[#151921] border border-slate-800 text-xs">Today</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 mb-8">
                                    {[
                                        { l: 'Calls', v: '14' },
                                        { l: 'Bookings', v: '6' },
                                        { l: 'Recovered', v: '3' },
                                        { l: 'Avg Time', v: '4s' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[#151921]/50 border border-slate-800/50 p-4 rounded-xl">
                                            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2">{stat.l}</div>
                                            <div className="text-2xl font-light text-white">{stat.v}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 bg-[#151921]/20 border border-slate-800/30 rounded-xl p-4 overflow-hidden relative">
                                    <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Volume Overview</h3>
                                    <div className="absolute inset-x-4 top-10 bottom-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="time" hide />
                                                <YAxis hide />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1e293b', borderRadius: '8px', color: '#cbd5e1', fontSize: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="calls" name="Calls" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCalls)" strokeWidth={2} />
                                                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#10b981" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                             </motion.div>

                             {/* Scene 6: Morning Brief */}
                             <motion.div style={{ opacity: s6Opacity }} className="absolute inset-0 bg-[#050810] p-12 text-slate-300 font-serif border-t border-slate-800">
                                <h1 className="text-3xl font-light italic mb-2 text-white">Morning Brief</h1>
                                <p className="text-[10px] text-slate-500 font-sans mb-8 tracking-widest uppercase">07:04 AM • Auto-generated</p>

                                <div className="space-y-6 text-lg max-w-xl font-light">
                                    <p>Good morning. Here's your Tuesday.</p>
                                    <p><strong className="font-medium text-white">Yesterday:</strong> 18 enquiries handled, 7 bookings confirmed, 2 high-value leads flagged.</p>
                                    <p className="bg-blue-500/10 p-4 border border-blue-500/30 rounded-lg text-blue-200 text-sm font-sans leading-relaxed">
                                        <strong className="text-blue-400">Pattern noticed:</strong> Saturdays receive 40% of weekly enquiries. Current availability is only 30% of capacity. Consider opening 2 additional slots.
                                    </p>
                                    <p><strong className="font-medium text-white">Action needed:</strong> One new Google review — 5 stars. I've drafted a thank-you response for your approval.</p>
                                </div>
                             </motion.div>

                             {/* Scene 7: Configuration / Persona */}
                             <motion.div style={{ opacity: s7Opacity }} className="absolute inset-0 bg-[#050810] p-8 flex flex-col font-sans border-t-[4px] border-[#151921] text-slate-200">
                                <h2 className="text-xl font-light text-white mb-6">Persona Configuration</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 block">Agent Name</label>
                                        <div className="bg-[#151921] border border-slate-800 rounded-lg p-3 text-sm flex items-center justify-between">
                                            <span>Zara</span>
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 block">Personality</label>
                                        <div className="bg-[#151921] border border-slate-800/50 rounded-lg p-3 text-sm">
                                            Professional, warm, never rushes. Uses absolute clarity.
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 block">Standard Greeting</label>
                                        <div className="bg-[#151921] border border-slate-800 rounded-lg p-3 text-sm text-slate-400 italic">
                                            "Good morning, thank you for contacting Abrams & Associates, this is Zara — how can I help you today?"
                                        </div>
                                    </div>
                                </div>
                             </motion.div>

                             {/* Scene 8: Multi-channel Laptop */}
                             <motion.div style={{ opacity: s8LaptopOpacity }} className="absolute inset-0 bg-[#0A0A0A] p-6 flex flex-col items-center justify-center">
                                 <div className="w-full max-w-lg bg-[#151921]/50 rounded-xl border border-slate-800 p-6 flex flex-col gap-4 shadow-2xl">
                                     <h3 className="text-sm font-medium flex items-center gap-2 text-white"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live Calls Console</h3>
                                     <div className="bg-slate-800/50 p-4 rounded-lg flex items-center justify-between">
                                         <div>
                                             <div className="text-sm text-white">Dr Naidoo check</div>
                                             <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Caller: Patient • 01:24</div>
                                         </div>
                                         <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                             <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                         </div>
                                     </div>
                                 </div>
                             </motion.div>
                        </LaptopMockup>
                    </motion.div>

                    {/* TABLET */}
                    <motion.div style={{ y: tabletY, x: tabletX, scale: tabletScale, opacity: tabletOpacity }} className="absolute z-15 pointer-events-none">
                        <TabletMockup>
                            <div className="flex flex-col h-full bg-[#050810] text-slate-200">
                                <div className="bg-[#151921] border-b border-slate-800 p-4 flex items-center gap-3">
                                    <div className="w-4 h-4 bg-blue-500 rounded-sm" />
                                    <span className="text-white font-medium text-sm">Inbox</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="bg-[#151921] p-3 rounded shadow-sm border border-slate-800">
                                        <div className="text-xs font-medium text-slate-200 mb-1">Proposal Follow-up</div>
                                        <div className="w-full h-2 bg-slate-700 rounded mt-2" />
                                        <div className="w-2/3 h-2 bg-slate-700 rounded mt-1" />
                                    </div>
                                    <div className="bg-[#151921] p-3 rounded border border-slate-800 opacity-50">
                                        <div className="text-xs font-medium text-slate-200 mb-1">Invoice request</div>
                                        <div className="w-full h-2 bg-slate-700 rounded mt-2" />
                                    </div>
                                </div>
                            </div>
                        </TabletMockup>
                    </motion.div>
                </div>

                {/* TEXT OVERLAYS */}
                {/* Scene 1 Text */}
                <ScrollSideText scrollYProgress={scrollYProgress} range={[0.06, 0.08, 0.18, 0.20]} align="right">
                    <h3 className="text-2xl md:text-3xl font-light italic mb-3 text-white">Bookings while you sleep.</h3>
                    <p className="text-slate-400">Aisha booked at 10pm. The owner found out at 8am.</p>
                </ScrollSideText>

                {/* Scene 2 Text */}
                <ScrollSideText scrollYProgress={scrollYProgress} range={[0.24, 0.26, 0.34, 0.36]} align="right">
                    <h3 className="text-2xl md:text-3xl font-light italic mb-3 text-white">Missed calls recovered.</h3>
                    <p className="text-slate-400">The lead that almost walked. Converted in 4 messages.</p>
                </ScrollSideText>

                {/* Scene 3 Text */}
                <ScrollSideText scrollYProgress={scrollYProgress} range={[0.38, 0.40, 0.46, 0.48]} align="right">
                    <h3 className="text-2xl md:text-3xl font-light italic mb-3 text-white">Answers at 7am.<br/>Answers at midnight.</h3>
                    <p className="text-slate-400">Grace handled it before the first staff member arrived.</p>
                </ScrollSideText>

                {/* Transition Text */}
                <ScrollText scrollYProgress={scrollYProgress} range={[0.49, 0.51, 0.53, 0.54]}>
                    <p className="text-xl italic text-slate-400">Your customers experience Bella. You see everything.</p>
                </ScrollText>

                {/* Scene 4 Text */}
                <ScrollSideText scrollYProgress={scrollYProgress} range={[0.55, 0.57, 0.63, 0.64]} align="left">
                    <h3 className="text-2xl md:text-3xl font-light italic mb-3 text-white">Every enquiry answered.</h3>
                    <p className="text-slate-400">Before your competition wakes up.</p>
                </ScrollSideText>

                {/* Scene 5 Text */}
                <ScrollSideText scrollYProgress={scrollYProgress} range={[0.66, 0.68, 0.73, 0.74]} align="left">
                    <h3 className="text-2xl md:text-3xl font-light italic mb-3 text-white">Full visibility.<br/>Zero effort.</h3>
                </ScrollSideText>

                {/* Scene 6 Text */}
                <ScrollSideText scrollYProgress={scrollYProgress} range={[0.76, 0.78, 0.81, 0.82]} align="left">
                    <h3 className="text-2xl md:text-3xl font-light italic mb-3 text-white">Your morning brief.<br/>Every morning.</h3>
                    <p className="text-slate-400">Not just answering. Thinking.</p>
                </ScrollSideText>

                {/* Scene 7 Text */}
                <ScrollText scrollYProgress={scrollYProgress} range={[0.83, 0.84, 0.87, 0.88]} className="bottom-[10%] top-auto">
                    <h3 className="text-4xl italic font-serif font-light text-white">Your receptionist. Your name. Your voice.</h3>
                </ScrollText>

                {/* Scene 8 Text */}
                <ScrollText scrollYProgress={scrollYProgress} range={[0.885, 0.895, 0.915, 0.92]} className="bottom-[10%] top-auto">
                    <h3 className="text-4xl italic font-serif font-light text-white">One assistant. Every channel. Always on.</h3>
                </ScrollText>

                {/* Scene 9: Industries */}
                <motion.div 
                    style={{ opacity: useTransform(scrollYProgress, [0.92, 0.93, 0.95, 0.96], [0, 1, 1, 0]) }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center font-serif pointer-events-none px-6"
                >
                    <h2 className="text-4xl md:text-6xl mb-8 font-light italic text-white">Built for every<br/>South African business.</h2>
                    <div className="space-y-4 text-lg md:text-xl text-slate-400 font-sans font-medium">
                        <p><span className="text-amber-500 font-bold tracking-wide">23 bookings</span> handled overnight — dealership</p>
                        <p><span className="text-blue-500 font-bold tracking-wide">0 missed calls</span> this week — medical practice</p>
                        <p><span className="text-rose-500 font-bold tracking-wide">4s average</span> response time — salon</p>
                    </div>
                </motion.div>

                {/* Scene 10: Setup */}
                <motion.div 
                    style={{ 
                        opacity: useTransform(scrollYProgress, [0.965, 0.97, 0.985, 0.99], [0, 1, 1, 0]),
                        y: useTransform(scrollYProgress, [0.965, 0.97], [50, 0]) 
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                >
                    <div className="w-full max-w-3xl flex flex-col items-center">
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-12 md:mb-16" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full text-left mb-12 md:mb-16">
                            <div>
                                <div className="text-slate-500 text-sm mb-2 md:mb-4 font-mono uppercase tracking-widest font-bold">01</div>
                                <h3 className="text-xl md:text-2xl font-serif italic text-white/90">We learn your business.</h3>
                            </div>
                            <div>
                                <div className="text-slate-500 text-sm mb-2 md:mb-4 font-mono uppercase tracking-widest font-bold">02</div>
                                <h3 className="text-xl md:text-2xl font-serif italic text-white/90">You meet your receptionist.</h3>
                            </div>
                            <div>
                                <div className="text-slate-500 text-sm mb-2 md:mb-4 font-mono uppercase tracking-widest font-bold">03</div>
                                <h3 className="text-xl md:text-2xl font-serif italic text-blue-400">You go live.</h3>
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-light italic font-serif tracking-tight text-white">Live in 5 days.</h2>
                    </div>
                </motion.div>

                {/* Scene 11: Pricing */}
                <motion.div 
                    style={{ 
                        opacity: useTransform(scrollYProgress, [0.98, 0.99], [0, 1]),
                        pointerEvents: useTransform(scrollYProgress, [0.98, 0.99], ['none', 'auto']) as any
                    }}
                    className="absolute inset-0 flex flex-col items-start md:items-center justify-start md:justify-center text-left md:text-center px-4 md:px-6 bg-[#050810]/95 backdrop-blur-xl overflow-y-auto py-24 md:py-0"
                >
                    <h2 className="text-4xl md:text-5xl font-serif font-light italic mb-10 md:mb-16 text-white text-center w-full">Plans from R1,999<span className="md:hidden block text-2xl mt-2 text-slate-400">per month</span><span className="hidden md:inline"> per month.</span></h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-6xl mb-12 relative z-20">
                        {/* Solo */}
                        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-8 text-left flex flex-col hover:border-slate-700 transition-colors shadow-xl">
                            <h3 className="text-xl font-medium mb-2 text-white">Solo</h3>
                            <div className="text-3xl font-serif mb-6 text-slate-200">R1,999<span className="text-sm font-sans text-slate-500">/mo</span></div>
                            <ul className="space-y-4 text-sm text-slate-400 mb-8 flex-1">
                                <li>• WhatsApp channel only</li>
                                <li>• Basic knowledge base</li>
                                <li>• Business hours handling</li>
                            </ul>
                            <button className="w-full py-3 rounded-full border border-slate-700 text-sm font-bold uppercase tracking-tight hover:bg-slate-800 transition-colors">Get Started</button>
                        </div>
                        
                        {/* Starter */}
                        <div className="bg-[#151921] border-2 border-blue-500/50 rounded-2xl p-8 text-left flex flex-col relative transform scale-105 shadow-[0_20px_50px_rgba(59,130,246,0.15)]">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
                            <h3 className="text-xl font-medium mb-2 text-white">Starter</h3>
                            <div className="text-3xl font-serif mb-6 text-white">R4,900<span className="text-sm font-sans text-slate-400">/mo</span></div>
                            <ul className="space-y-4 text-sm text-slate-300 mb-8 flex-1">
                                <li>• Voice + WhatsApp</li>
                                <li>• Full appointment booking</li>
                                <li>• After-hours handling</li>
                            </ul>
                            <button className="w-full py-3 rounded-full bg-white text-black font-bold uppercase tracking-tight text-sm hover:bg-slate-200 transition-colors">Get Started</button>
                        </div>

                        {/* Growth */}
                        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-8 text-left flex flex-col hover:border-slate-700 transition-colors shadow-xl">
                            <h3 className="text-xl font-medium mb-2 text-white">Growth</h3>
                            <div className="text-3xl font-serif mb-6 text-slate-200">R7,900<span className="text-sm font-sans text-slate-500">/mo</span></div>
                            <ul className="space-y-4 text-sm text-slate-400 mb-8 flex-1">
                                <li>• Full receptionist suite</li>
                                <li>• CRM integration</li>
                                <li>• Proactive follow-ups</li>
                            </ul>
                            <button className="w-full py-3 rounded-full border border-slate-700 text-sm font-bold uppercase tracking-tight hover:bg-slate-800 transition-colors">Get Started</button>
                        </div>

                        {/* Scale */}
                        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-8 text-left flex flex-col hover:border-slate-700 transition-colors shadow-xl">
                            <h3 className="text-xl font-medium mb-2 text-white">Scale</h3>
                            <div className="text-3xl font-serif mb-6 text-slate-200">R12,900<span className="text-sm font-sans text-slate-500">/mo</span></div>
                            <ul className="space-y-4 text-sm text-slate-400 mb-8 flex-1">
                                <li>• Multi-location support</li>
                                <li>• Dedicated account manager</li>
                                <li>• Custom workflows</li>
                            </ul>
                            <button className="w-full py-3 rounded-full border border-slate-700 text-sm font-bold uppercase tracking-tight hover:bg-slate-800 transition-colors">Contact Sales</button>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center justify-center relative z-20">
                        <button className="px-8 py-4 bg-white text-black rounded-full text-sm font-bold uppercase tracking-tight hover:bg-slate-200 transition-colors">Call Thami</button>
                        <button className="px-8 py-4 border border-slate-700 hover:border-slate-500 text-white rounded-full text-sm font-bold uppercase tracking-tight transition-colors">WhatsApp Us</button>
                    </div>
                    <p className="mt-8 text-[10px] uppercase tracking-widest text-slate-500">Setup within 5 days • No lock-in • Cancel anytime</p>
                </motion.div>

            </div>
        </div>
    );
}
