import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Mic, MicOff, Loader2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export function AiOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<{ id: string; role: 'system' | 'user' | 'agent'; text: string }[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: "Hi, I'm Bella. I can answer questions about Signal Desk or schedule a guided demo for you. Connect voice to start talking.",
    },
  ]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const cleanupAudio = () => {
    if (scriptProcessorRef.current && audioContextRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;
    streamRef.current = null;
    scriptProcessorRef.current = null;
    playbackContextRef.current = null;
  };

  const disconnectVoice = () => {
    setIsConnecting(false);
    setIsConnected(false);
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => {
            if (s.close) s.close();
        }).catch(console.error);
        sessionRef.current = null;
    }
    cleanupAudio();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'system', text: 'Voice chat disconnected.' },
    ]);
  };

  const connectVoice = async () => {
    try {
      setIsConnecting(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const playbackCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      playbackContextRef.current = playbackCtx;
      nextStartTimeRef.current = playbackCtx.currentTime;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

        const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            "You are Bella, a helpful, enthusiastic, and professional voice customer service agent for Signal Desk. Signal Desk provides AI receptionists for businesses in South Africa. You can explain features, pricing, and schedule appointments/guided demos for the user. Speak naturally and conversationally. Do not output markdown, just natural text.",
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'scheduleAppointment',
                  description: 'Schedule a guided demo or callback appointment for the user',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING, description: 'The requested time or date' },
                      name: { type: Type.STRING, description: "User's name" },
                    },
                    required: ['time', 'name'],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsConnected(true);
            setMessages((prev) => [
              ...prev,
              { id: Date.now().toString(), role: 'system', text: 'Voice connected. Speak to Bella.' },
            ]);

            processor.onaudioprocess = (e) => {
              if (audioCtx.state === 'suspended') return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
              }
              const bytes = new Uint8Array(pcm16.buffer);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
              const base64Data = btoa(binary);

              sessionPromise.then((s) => {
                try {
                  s.sendRealtimeInput({
                    audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' },
                  });
                } catch (err) {
                  // Ignores send errors if closed
                }
              });
            };
            source.connect(processor);
            processor.connect(audioCtx.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            // Log audio playing if needed, handle playback
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && playbackContextRef.current) {
              try {
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const int16Array = new Int16Array(bytes.buffer);
                const float32Array = new Float32Array(int16Array.length);
                for (let i = 0; i < int16Array.length; i++) {
                  float32Array[i] = int16Array[i] / 32768.0;
                }

                const pbCtx = playbackContextRef.current;
                const audioBuffer = pbCtx.createBuffer(1, float32Array.length, 24000);
                audioBuffer.getChannelData(0).set(float32Array);

                const src = pbCtx.createBufferSource();
                src.buffer = audioBuffer;
                src.connect(pbCtx.destination);

                if (nextStartTimeRef.current < pbCtx.currentTime) {
                  nextStartTimeRef.current = pbCtx.currentTime + 0.05;
                }
                src.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
              } catch (e) {
                console.error("Audio playback error:", e);
              }
            }

            // Handle Transcripts
            if (message.serverContent?.modelTurn?.parts) {
               message.serverContent.modelTurn.parts.forEach(p => {
                 if (p.text) {
                    setMessages(prev => [...prev, { id: Math.random().toString(), role: 'agent', text: p.text || '' }]);
                 }
               });
            }
            if (message.serverContent?.inputTranscription?.text) {
               setMessages(prev => [...prev, { id: Math.random().toString(), role: 'user', text: message.serverContent?.inputTranscription?.text || '' }]);
            }

            if (message.serverContent?.interrupted) {
               if (playbackContextRef.current) {
                   nextStartTimeRef.current = playbackContextRef.current.currentTime;
               }
            }

            if (message.toolCall) {
              message.toolCall.functionCalls.forEach((fc) => {
                if (fc.name === 'scheduleAppointment') {
                  const appointmentDetails = `Scheduled demo for ${fc.args?.name || 'Guest'} at ${fc.args?.time}`;
                  setMessages((prev) => [
                    ...prev,
                    { id: Date.now().toString(), role: 'system', text: appointmentDetails },
                  ]);

                  sessionPromise.then((s) =>
                    s.sendToolResponse({
                      functionResponses: [
                        {
                          id: fc.id,
                          name: fc.name,
                          response: { success: true },
                        },
                      ],
                    })
                  );
                }
              });
            }
          },
          onerror: (err) => {
            console.error('Live API Error: ', err);
            disconnectVoice();
          },
          onclose: () => {
             disconnectVoice();
          },
        },
      });

      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error('Microphone access denied or error: ', err);
      setIsConnecting(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'system', text: 'Microphone access denied or failed.' },
      ]);
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 left-6 sm:left-auto sm:w-80 bg-[#151921] border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-4 font-sans"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-sm font-bold tracking-tight text-white uppercase">Live Agent</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 h-48 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg text-sm max-w-[85%] ${
                    m.role === 'agent'
                      ? 'bg-slate-800/40 text-slate-300 self-start'
                      : m.role === 'user'
                      ? 'bg-blue-600 border border-blue-500 text-white self-end'
                      : 'bg-transparent text-slate-500 self-center text-center text-[11px] uppercase tracking-widest'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="pt-2">
              {!isConnected ? (
                <button
                  onClick={connectVoice}
                  disabled={isConnecting}
                  className="w-full relative overflow-hidden bg-white text-black py-4 rounded-full text-sm font-bold uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Connecting...
                    </>
                  ) : (
                    <>
                      <Mic size={16} /> Start Voice Chat
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={disconnectVoice}
                  className="w-full relative overflow-hidden bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-full text-sm font-bold uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                >
                  <MicOff size={16} /> End Call
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#050810] backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.15)] z-50 overflow-hidden group border border-blue-500/20"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-[-50%] ${isConnected ? 'bg-[conic-gradient(from_0deg,transparent_0_340deg,#3b82f6_360deg)] opacity-40' : 'bg-[conic-gradient(from_0deg,transparent_0_340deg,#334155_360deg)] opacity-20'}`}
        />
        <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-blue-900 via-slate-900 to-[#0A0A0A] z-10 flex items-center justify-center overflow-hidden">
          <div className={`absolute w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.2)_0%,transparent_50%)] ${isConnected ? 'animate-pulse' : 'opacity-0'}`} />
          <Bot className="text-white relative z-20" size={24} />
        </div>
      </motion.button>
    </>
  );
}

