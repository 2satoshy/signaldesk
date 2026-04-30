import React, { useEffect, useRef } from 'react';
import { useScroll, useTransform, useMotionValueEvent, MotionValue } from 'motion/react';

interface ParticleFieldProps {
  scrollYProgress: MotionValue<number>;
}

export function ParticleField({ scrollYProgress }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: any[] = [];
    const count = 150;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.5,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            baseAlpha: Math.random() * 0.5 + 0.1,
            colorIndex: Math.floor(Math.random() * 6), // Support for industry colors later
        });
    }

    let animationId: number;
    // We will tint based on industry colors if scroll > 0.92, we can just grab brightness from scroll
    let brightnessMultiplier = 1;
    let industryTintIdx = -1; // -1 means white

    const render = () => {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const alpha = p.baseAlpha * brightnessMultiplier;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            
            if (industryTintIdx === -1) {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            } else {
                // Tints based on colorIndex matching industry
                const colors = [
                    'rgba(245, 158, 11,', // amber
                    'rgba(59, 130, 246,', // blue
                    'rgba(244, 63, 94,',  // rose
                    'rgba(99, 102, 241,', // indigo
                    'rgba(234, 88, 12,',  // terracotta
                    'rgba(16, 185, 129,'  // mint
                ];
                // Make all particles one color when highlighted, or random
                const c = colors[industryTintIdx];
                ctx.fillStyle = `${c} ${alpha * 2})`;
            }
            
            ctx.fill();
        });

        animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Subscribe to scroll value to drive brightness and color tint
    const unsubscribe = scrollYProgress.on('change', (val) => {
        if (val < 0.9) {
            brightnessMultiplier = 1;
            industryTintIdx = -1;
        } else if (val >= 0.9 && val < 0.96) {
            brightnessMultiplier = 2; // max brightness
            // Based on sub-scroll map to 0-5
            const sub = (val - 0.9) / 0.06; // 0 to 1
            const idx = Math.min(5, Math.floor(sub * 6));
            industryTintIdx = idx;
        } else {
            brightnessMultiplier = 3;
            industryTintIdx = -1;
        }
    });

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
        unsubscribe();
    };

  }, [scrollYProgress]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}
