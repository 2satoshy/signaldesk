import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Loader2,
  Calendar,
  CalendarCheck,
  Receipt,
  FileText,
  Mail,
  MessageSquare,
  X,
  CheckCircle2,
} from "lucide-react";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export function LiveWorkspace() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<
    { id: string; role: "system" | "user" | "agent" | "action"; text: string }[]
  >([
    {
      id: "welcome",
      role: "agent",
      text: "Hi, I'm Bella. I can answer questions about Signal Desk or schedule a guided demo for you. Click 'Talk' to begin.",
    },
  ]);

  const [activePanel, setActivePanel] = useState<
    "calendar" | "bookings" | "invoices" | "emails" | "messages" | null
  >(null);
  const [emailTab, setEmailTab] = useState<"inbox" | "sent" | "drafts">(
    "inbox",
  );
  const [sentEmails, setSentEmails] = useState<
    { recipient: string; subject: string; body: string; time: string }[]
  >([]);

  const [bookings, setBookings] = useState([
    {
      name: "Sarah Mitchell",
      time: "Tomorrow, 10:00 AM",
      status: "Confirmed",
    },
    {
      name: "David Lee",
      time: "Thursday, 2:30 PM",
      status: "Pending",
    },
    {
      name: "Emma Watson",
      time: "Friday, 11:00 AM",
      status: "Confirmed",
    },
  ]);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");

  // Audio refs
  const bookingsRef = useRef(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Analysers and visualizer refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const targetScaleRef = useRef<number>(1);
  const currentScaleRef = useRef<number>(1);

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
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    audioContextRef.current = null;
    streamRef.current = null;
    scriptProcessorRef.current = null;
    playbackContextRef.current = null;
  };

  const disconnectVoice = () => {
    setIsConnecting(false);
    setIsConnected(false);
    setIsSpeaking(false);
    if (sessionRef.current) {
      sessionRef.current
        .then((s: any) => {
          if (s.close) s.close();
        })
        .catch(console.error);
      sessionRef.current = null;
    }
    cleanupAudio();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "system",
        text: "Voice chat disconnected.",
      },
    ]);
  };

  const connectVoice = async () => {
    try {
      setIsConnecting(true);
      setMessages([]);
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const playbackCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({ sampleRate: 24000 });
      playbackContextRef.current = playbackCtx;
      nextStartTimeRef.current = playbackCtx.currentTime;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const playbackAnalyser = playbackCtx.createAnalyser();
      playbackAnalyser.fftSize = 256;
      playbackAnalyser.smoothingTimeConstant = 0.5;
      playbackAnalyserRef.current = playbackAnalyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser); // connect mic source to analyser

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      // Start Visualizer Loop
      targetScaleRef.current = 1;
      currentScaleRef.current = 1;

      const updateVisualizer = () => {
        let level = 0;
        if (playbackAnalyserRef.current) {
          const array = new Uint8Array(
            playbackAnalyserRef.current.frequencyBinCount,
          );
          playbackAnalyserRef.current.getByteFrequencyData(array);
          const sum = array.reduce((a, b) => a + b, 0);
          level = sum / array.length;
        }

        // Base Idle breathing
        const time = Date.now() / 1000;
        const idleScale = 1 + Math.sin(time * 2) * 0.02;

        if (level > 2) {
          // Speak pulsating
          targetScaleRef.current = 1 + (level / 128) * 0.2;
        } else {
          targetScaleRef.current = idleScale;
        }

        // Smooth tweening
        currentScaleRef.current +=
          (targetScaleRef.current - currentScaleRef.current) * 0.2;

        if (orbRef.current) {
          orbRef.current.style.transform = `scale(${currentScaleRef.current})`;
        }
        if (glowRef.current) {
          glowRef.current.style.opacity = `${0.3 + (level / 255) * 0.7}`;
        }

        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };

      if (animationFrameRef.current !== null)
        cancelAnimationFrame(animationFrameRef.current);
      updateVisualizer();

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            "You are Bella, an AI receptionist for Signal Desk. You can explain features, pricing, schedule appointments, check/manage calendar (cancel or reschedule), send emails, and make calls for the user. When asked to cancel or reschedule an appointment, use the manageCalendar tool with exact event titles. Speak naturally and conversationally. Do not output markdown, just natural text.",
          tools: [
            {
              functionDeclarations: [
                {
                  name: "scheduleAppointment",
                  description:
                    "Schedule a guided demo or callback appointment for the user",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      time: {
                        type: Type.STRING,
                        description: "The requested time or date",
                      },
                      name: { type: Type.STRING, description: "User's name" },
                    },
                    required: ["time", "name"],
                  },
                },
                {
                  name: "sendEmail",
                  description: "Send an email to a user or contact",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      recipient: {
                        type: Type.STRING,
                        description: "Email address of the recipient",
                      },
                      subject: {
                        type: Type.STRING,
                        description: "Subject of the email",
                      },
                      body: {
                        type: Type.STRING,
                        description: "Body text of the email",
                      },
                    },
                    required: ["recipient", "subject", "body"],
                  },
                },
                {
                  name: "makeCall",
                  description: "Initiate a phone call to a number",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      phoneNumber: {
                        type: Type.STRING,
                        description: "Phone number to call",
                      },
                      purpose: {
                        type: Type.STRING,
                        description: "Purpose of the call",
                      },
                    },
                    required: ["phoneNumber"],
                  },
                },
                {
                  name: "checkCalendar",
                  description: "Check calendar availability for a given date",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      date: {
                        type: Type.STRING,
                        description: "Date to check availability",
                      },
                    },
                    required: ["date"],
                  },
                },
                {
                  name: "manageCalendar",
                  description:
                    "Manage a specific calendar event (update, reschedule, or cancel)",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "update, reschedule, or cancel",
                      },
                      eventTitle: {
                        type: Type.STRING,
                        description: "Title of the event",
                      },
                      newTime: {
                        type: Type.STRING,
                        description: "The new time if rescheduling",
                      },
                    },
                    required: ["action", "eventTitle"],
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
              {
                id: Date.now().toString(),
                role: "system",
                text: "Voice connected. Speak to Bella.",
              },
            ]);

            processor.onaudioprocess = (e) => {
              if (audioCtx.state === "suspended") return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(
                  -32768,
                  Math.min(32767, inputData[i] * 32768),
                );
              }
              const bytes = new Uint8Array(pcm16.buffer);
              let binary = "";
              for (let i = 0; i < bytes.length; i++)
                binary += String.fromCharCode(bytes[i]);
              const base64Data = btoa(binary);

              sessionPromise.then((s) => {
                try {
                  s.sendRealtimeInput({
                    audio: {
                      data: base64Data,
                      mimeType: "audio/pcm;rate=16000",
                    },
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
            const base64Audio =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
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
                const audioBuffer = pbCtx.createBuffer(
                  1,
                  float32Array.length,
                  24000,
                );
                audioBuffer.getChannelData(0).set(float32Array);

                const src = pbCtx.createBufferSource();
                src.buffer = audioBuffer;
                if (playbackAnalyserRef.current) {
                  src.connect(playbackAnalyserRef.current);
                  playbackAnalyserRef.current.connect(pbCtx.destination);
                } else {
                  src.connect(pbCtx.destination);
                }

                if (nextStartTimeRef.current < pbCtx.currentTime) {
                  nextStartTimeRef.current = pbCtx.currentTime + 0.05;
                }
                src.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
              } catch (e) {
                console.error("Audio playback error:", e);
              }
            }

            if (message.serverContent?.modelTurn) {
              setIsSpeaking(true);
            }
            if (message.serverContent?.turnComplete) {
              setIsSpeaking(false);
            }

            if (message.serverContent?.modelTurn?.parts) {
              message.serverContent.modelTurn.parts.forEach((p) => {
                if (p.text) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      role: "agent",
                      text: p.text || "",
                    },
                  ]);
                }
              });
            }
            if (message.serverContent?.inputTranscription?.text) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Math.random().toString(),
                  role: "user",
                  text: message.serverContent?.inputTranscription?.text || "",
                },
              ]);
            }

            if (message.serverContent?.interrupted) {
              if (playbackContextRef.current) {
                nextStartTimeRef.current =
                  playbackContextRef.current.currentTime;
              }
            }

            if (message.toolCall) {
              message.toolCall.functionCalls.forEach((fc) => {
                let systemMessage = "";
                if (fc.name === "scheduleAppointment") {
                  const name = fc.args?.name as string || "Guest";
                  const time = fc.args?.time as string || "TBD";
                  setBookings(prev => [...prev, { name, time, status: "Pending" }]);
                  systemMessage = `Scheduled demo for ${name} at ${time}`;
                } else if (fc.name === "sendEmail") {
                  systemMessage = `Sent email to ${fc.args?.recipient} with subject "${fc.args?.subject}"`;
                  setSentEmails((prev) => [
                    {
                      recipient: (fc.args?.recipient as string) || "",
                      subject: (fc.args?.subject as string) || "",
                      body: (fc.args?.body as string) || "",
                      time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    },
                    ...prev,
                  ]);
                } else if (fc.name === "makeCall") {
                  systemMessage = `Initiating call to ${fc.args?.phoneNumber}...`;
                } else if (fc.name === "checkCalendar") {
                  systemMessage = `Checked calendar for ${fc.args?.date}. Found 3 available slots: 9am, 11am, 3pm.`;
                } else if (fc.name === "manageCalendar") {
                  const action = fc.args?.action as string;
                  const eventTitle = fc.args?.eventTitle as string || "";
                  const newTime = fc.args?.newTime as string;
                  const safeTitle = eventTitle.trim().toLowerCase();
                  
                  if (!safeTitle) {
                     systemMessage = `Failed to ${action} appointment: missing event title.`;
                  } else {
                     const currentBookings = bookingsRef.current;
                     const targetIndex = currentBookings.findIndex((b: any) => b.name.toLowerCase().includes(safeTitle));
                     const exists = targetIndex !== -1;
                     
                     if (!exists) {
                       systemMessage = `Failed to find any calendar event matching "${eventTitle}". Calendar remains unchanged.`;
                     } else {
                       const exactName = currentBookings[targetIndex].name;
                       if (action === 'cancel') {
                          setBookings(prev => prev.filter(b => !b.name.toLowerCase().includes(safeTitle)));
                          systemMessage = `Appointment for "${exactName}" has been successfully cancelled.`;
                       } else if (action === 'reschedule' || action === 'update') {
                          setBookings(prev => prev.map(b => b.name.toLowerCase().includes(safeTitle) ? { ...b, time: newTime || b.time } : b));
                          systemMessage = `Appointment for "${exactName}" has been successfully rescheduled to ${newTime}.`;
                       } else {
                          systemMessage = `Appointment for "${exactName}" has been ${action}d.`;
                       }
                     }
                  }
                }

                if (systemMessage) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString() + Math.random(),
                      role: "action",
                      text: systemMessage,
                    },
                  ]);
                }

                sessionPromise.then((s) =>
                  s.sendToolResponse({
                    functionResponses: [
                      {
                        id: fc.id,
                        name: fc.name,
                        response: {
                          success: true,
                          result:
                            systemMessage || "Action completed successfully",
                        },
                      },
                    ],
                  }),
                );
              });
            }
          },
          onerror: (err) => {
            console.error("Live API Error: ", err);
            disconnectVoice();
          },
          onclose: () => {
            disconnectVoice();
          },
        },
      });

      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error("Microphone access denied or error: ", err);
      setIsConnecting(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "system",
          text: "Microphone access denied or failed.",
        },
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pt-20 pb-10 overflow-hidden font-sans"
      style={{ backgroundColor: "#1a1924" }}
    >
      {/* Noise overlay to match the image's textured background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Very subtle center glow */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3b4b6b]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Central Orb */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-20 w-full mb-12">
        {/* Floating Container */}
        <motion.div
          animate={{
            y: isSpeaking ? [0, -5, 0] : [0, -2, 0],
          }}
          transition={{
            duration: isSpeaking ? 1.5 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative flex items-center justify-center"
        >
          {/* Audio Reactive Orb Node */}
          <div
            ref={orbRef}
            className={`relative w-56 h-56 md:w-72 md:h-72 rounded-full flex items-center justify-center transition-all duration-75`}
            style={{
              background: isConnected
                ? "radial-gradient(circle at 35% 15%, rgba(180, 200, 255, 0.9) 0%, rgba(60, 80, 160, 0.8) 15%, rgba(10, 15, 30, 0.9) 50%, #000 100%)"
                : "radial-gradient(circle at 35% 15%, rgba(200, 200, 200, 0.9) 0%, rgba(50, 50, 60, 0.8) 15%, rgba(10, 10, 15, 0.9) 50%, #000 100%)",
              boxShadow:
                "inset -15px -15px 30px rgba(0,0,0,0.8), inset 10px 10px 20px rgba(255,255,255,0.2)",
            }}
          >
            {/* Audio Reactive Outer Glow */}
            <div
              ref={glowRef}
              className="absolute inset-0 rounded-full blur-[40px] pointer-events-none transition-opacity duration-75"
              style={{
                background: isConnected
                  ? "rgba(59,130,246,0.8)"
                  : "rgba(255,255,255,0.1)",
                opacity: isConnected ? 0.3 : 0.1,
                transform: "scale(1.2)",
              }}
            />

            {/* Secondary Glare for realism */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 60% 30%, rgba(255,255,255,0.15) 0%, transparent 20%)",
              }}
            />

            {/* Inner Glow when speaking */}
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute inset-x-8 top-[30%] bottom-[30%] rounded-[100%] bg-blue-300/40 blur-2xl mix-blend-screen pointer-events-none"
              />
            )}
          </div>
        </motion.div>

        {/* Talk Button container (rounded translucent squircle) */}
        <div className="mt-12 bg-[#2c2f38]/30 border border-[#4a4c54]/50 rounded-[1.5rem] p-3 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {!isConnected ? (
            <button
              onClick={connectVoice}
              disabled={isConnecting}
              className="w-16 h-16 rounded-full bg-gradient-to-b from-[#7cbbed] to-[#4585d4] border border-[#4585d4]/50 flex items-center justify-center text-white font-medium tracking-wider text-[11px] hover:scale-105 transition-all shadow-[inset_0_-8px_15px_rgba(0,0,0,0.2),_inset_0_4px_10px_rgba(255,255,255,0.6),_0_0_20px_rgba(124,187,237,0.4)] disabled:opacity-50 disabled:scale-100 relative overflow-hidden"
            >
              {/* Glossy overlay on button top */}
              <div className="absolute inset-x-[15%] top-[5%] h-[40%] bg-white/40 rounded-full blur-[1px]"></div>
              <span className="relative z-10 drop-shadow-md text-white/90">
                {isConnecting ? "..." : "TALK"}
              </span>
            </button>
          ) : (
            <button
              onClick={disconnectVoice}
              className="w-16 h-16 rounded-full bg-gradient-to-b from-red-400 to-red-600 flex items-center justify-center text-white font-medium tracking-wider text-[11px] hover:scale-105 transition-all shadow-[inset_0_-8px_15px_rgba(0,0,0,0.2),_inset_0_4px_10px_rgba(255,255,255,0.6)] relative overflow-hidden"
            >
              <div className="absolute inset-x-[15%] top-[5%] h-[40%] bg-white/40 rounded-full blur-[1px]"></div>
              <span className="relative z-10 drop-shadow-md text-white/90">
                STOP
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 5 App Icons Dock */}
      <div
        className="flex justify-center flex-wrap gap-5 w-full px-6 relative z-30 pb-16"
        style={{ maxWidth: "400px" }}
      >
        <button
          onClick={() => setActivePanel("calendar")}
          className="w-[3.5rem] h-[3.5rem] md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center transition-all bg-gradient-to-b from-[#ff5a5f] to-[#e01934] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_6px_rgba(0,0,0,0.3),0_10px_20px_rgba(224,25,52,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:scale-95 active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-1px_4px_rgba(0,0,0,0.3),0_4px_10px_rgba(224,25,52,0.4),0_1px_3px_rgba(0,0,0,0.5)] border border-[#ff7b7f]/50 bg-blend-overlay hover:brightness-110"
        >
          <Calendar className="text-white drop-shadow-md" size={30} fill="rgba(0,0,0,0.1)" />
        </button>
        <button
          onClick={() => setActivePanel("bookings")}
          className="w-[3.5rem] h-[3.5rem] md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center transition-all bg-gradient-to-b from-[#4285f4] to-[#2b5ba8] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_6px_rgba(0,0,0,0.3),0_10px_20px_rgba(43,91,168,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:scale-95 active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-1px_4px_rgba(0,0,0,0.3),0_4px_10px_rgba(43,91,168,0.4),0_1px_3px_rgba(0,0,0,0.5)] border border-[#6b9df5]/50 bg-blend-overlay hover:brightness-110"
        >
          <CalendarCheck className="text-white drop-shadow-md" size={30} fill="rgba(0,0,0,0.1)" />
        </button>
        <button
          onClick={() => setActivePanel("invoices")}
          className="w-[3.5rem] h-[3.5rem] md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center transition-all bg-gradient-to-b from-[#34a853] to-[#1e7a37] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_6px_rgba(0,0,0,0.3),0_10px_20px_rgba(30,122,55,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:scale-95 active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-1px_4px_rgba(0,0,0,0.3),0_4px_10px_rgba(30,122,55,0.4),0_1px_3px_rgba(0,0,0,0.5)] border border-[#5abf73]/50 bg-blend-overlay hover:brightness-110"
        >
          <Receipt className="text-white drop-shadow-md" size={30} fill="rgba(0,0,0,0.1)" />
        </button>
        <button
          onClick={() => setActivePanel("emails")}
          className="w-[3.5rem] h-[3.5rem] md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center transition-all bg-gradient-to-b from-[#fabb05] to-[#c79100] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_6px_rgba(0,0,0,0.3),0_10px_20px_rgba(199,145,0,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:scale-95 active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-1px_4px_rgba(0,0,0,0.3),0_4px_10px_rgba(199,145,0,0.4),0_1px_3px_rgba(0,0,0,0.5)] border border-[#fccf4b]/50 bg-blend-overlay hover:brightness-110"
        >
          <Mail className="text-white drop-shadow-md" size={30} fill="rgba(0,0,0,0.1)" />
        </button>
        <button
          onClick={() => setActivePanel("messages")}
          className="w-[3.5rem] h-[3.5rem] md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center transition-all bg-gradient-to-b from-[#ab47bc] to-[#7b1fa2] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_6px_rgba(0,0,0,0.3),0_10px_20px_rgba(123,31,162,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:scale-95 active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-1px_4px_rgba(0,0,0,0.3),0_4px_10px_rgba(123,31,162,0.4),0_1px_3px_rgba(0,0,0,0.5)] border border-[#ba68c8]/50 bg-blend-overlay hover:brightness-110"
        >
          <MessageSquare className="text-white drop-shadow-md" size={30} fill="rgba(0,0,0,0.1)" />
        </button>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 top-24 bg-[#0A0A0A] border-t border-slate-800 rounded-t-3xl z-50 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-800/50 bg-[#0f1219]">
              <h2 className="text-xl font-bold text-white capitalize">
                {activePanel}
              </h2>
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#050810]">
              {activePanel === "calendar" && (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Your monthly overview and calendar events. Talk to Bella to check availability.
                  </p>
                  
                  <div className="bg-[#151921] p-6 rounded-xl border border-slate-800 space-y-4">
                    <h3 className="font-semibold text-slate-200">Create New Event</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Event Title</label>
                        <input
                          type="text"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="e.g. Product Demo"
                          className="w-full bg-[#0b0c10] border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                          <input
                            type="text"
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            placeholder="e.g. Tomorrow"
                            className="w-full bg-[#0b0c10] border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Time</label>
                          <input
                            type="text"
                            value={newEventTime}
                            onChange={(e) => setNewEventTime(e.target.value)}
                            placeholder="e.g. 10:00 AM"
                            className="w-full bg-[#0b0c10] border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (newEventTitle && (newEventDate || newEventTime)) {
                            const timeString = [newEventDate, newEventTime].filter(Boolean).join(", ");
                            setBookings(prev => [...prev, { name: newEventTitle, time: timeString || "TBD", status: "Confirmed" }]);
                            setNewEventTitle("");
                            setNewEventDate("");
                            setNewEventTime("");
                          }
                        }}
                        disabled={!newEventTitle || (!newEventDate && !newEventTime)}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2 rounded-lg text-sm font-medium transition-colors mt-2"
                      >
                        Add to Calendar
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#151921] p-8 rounded-xl border border-slate-800 text-center text-slate-500">
                    Calendar sync enabled. Ask about your availability.
                  </div>
                </div>
              )}
              {activePanel === "bookings" && (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Manage your upcoming client appointments and guided demos.
                  </p>
                  {bookings.length > 0 ? bookings.map((b, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-[#151921] p-4 rounded-xl border border-slate-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-900/30 text-blue-400 flex items-center justify-center rounded-full">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-200">
                            {b.name}
                          </h4>
                          <p className="text-xs text-slate-500">{b.time}</p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs border ${b.status === "Confirmed" ? "border-green-500/20 text-green-400 bg-green-500/10" : "border-yellow-500/20 text-yellow-400 bg-yellow-500/10"}`}
                      >
                        {b.status}
                      </div>
                    </div>
                  )) : <div className="text-center py-8 text-slate-500 text-sm">No upcoming appointments.</div>}
                </div>
              )}
              {activePanel === "invoices" && (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Recent client billing and outstanding invoices.
                  </p>
                  {[
                    {
                      id: "INV-2041",
                      target: "TechCorp LLC",
                      amount: "$4,500",
                      status: "Paid",
                    },
                    {
                      id: "INV-2042",
                      target: "Design Studios",
                      amount: "$1,200",
                      status: "Overdue",
                    },
                  ].map((inv, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-[#151921] p-4 rounded-xl border border-slate-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-900/30 text-emerald-400 flex items-center justify-center rounded-full">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-200">
                            {inv.target}
                          </h4>
                          <p className="text-xs text-slate-500">{inv.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {inv.amount}
                        </div>
                        <div
                          className={`text-xs ${inv.status === "Paid" ? "text-green-500" : "text-red-500"}`}
                        >
                          {inv.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activePanel === "emails" && (
                <div className="space-y-4">
                  <div className="flex gap-4 mb-6">
                    <div
                      onClick={() => setEmailTab("inbox")}
                      className={`px-4 py-2 ${emailTab === "inbox" ? "bg-blue-600 text-white border-blue-600" : "bg-[#151921] text-slate-400 border-slate-800"} rounded-lg text-sm border cursor-pointer hover:bg-blue-500 hover:text-white transition-colors`}
                    >
                      Inbox
                    </div>
                    <div
                      onClick={() => setEmailTab("sent")}
                      className={`px-4 py-2 ${emailTab === "sent" ? "bg-blue-600 text-white border-blue-600" : "bg-[#151921] text-slate-400 border-slate-800"} rounded-lg text-sm border cursor-pointer hover:bg-blue-500 hover:text-white transition-colors`}
                    >
                      Sent {sentEmails.length > 0 && `(${sentEmails.length})`}
                    </div>
                    <div
                      onClick={() => setEmailTab("drafts")}
                      className={`px-4 py-2 ${emailTab === "drafts" ? "bg-blue-600 text-white border-blue-600" : "bg-[#151921] text-slate-400 border-slate-800"} rounded-lg text-sm border cursor-pointer hover:bg-blue-500 hover:text-white transition-colors`}
                    >
                      Drafts
                    </div>
                  </div>

                  {emailTab === "inbox" &&
                    [
                      {
                        sender: "info@signaldesk.co",
                        subject: "Your weekly AI summary",
                        preview:
                          "Here is what your receptionists handled this week...",
                        time: "10:45 AM",
                        read: false,
                      },
                      {
                        sender: "billing@stripe.com",
                        subject: "Invoice #49202 Pa...",
                        preview: "Your payment was successfully processed.",
                        time: "Yesterday",
                        read: true,
                      },
                      {
                        sender: "alex.s@acme.inc",
                        subject: "Partnership inquiry",
                        preview:
                          "We are very interested in integrating with your API.",
                        time: "Oct 12",
                        read: true,
                      },
                    ].map((e, i) => (
                      <div
                        key={i}
                        className={`flex gap-4 p-4 rounded-xl border ${e.read ? "bg-[#151921]/50 border-slate-800/50" : "bg-[#151921] border-slate-700"}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                          <Mail size={16} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between mb-1">
                            <span
                              className={`font-medium ${!e.read ? "text-white" : "text-slate-300"}`}
                            >
                              {e.sender}
                            </span>
                            <span className="text-xs text-slate-500">
                              {e.time}
                            </span>
                          </div>
                          <div
                            className={`text-sm mb-1 ${!e.read ? "text-blue-100 font-medium" : "text-slate-400"}`}
                          >
                            {e.subject}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {e.preview}
                          </p>
                        </div>
                      </div>
                    ))}

                  {emailTab === "sent" &&
                    (sentEmails.length > 0 ? (
                      sentEmails.map((e, i) => (
                        <div
                          key={i}
                          className={`flex gap-4 p-4 rounded-xl border bg-[#151921]/50 border-slate-800/50`}
                        >
                          <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between mb-1">
                              <span className={`font-medium text-slate-300`}>
                                To: {e.recipient}
                              </span>
                              <span className="text-xs text-slate-500">
                                {e.time}
                              </span>
                            </div>
                            <div className={`text-sm mb-1 text-slate-400`}>
                              {e.subject}
                            </div>
                            <p className="text-xs text-slate-500">{e.body}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No sent emails yet. Talk to Bella to send one.
                      </div>
                    ))}

                  {emailTab === "drafts" && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No drafts.
                    </div>
                  )}
                </div>
              )}
              {activePanel === "messages" && (
                <div className="flex h-full bg-[#151921] rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="w-1/3 border-r border-slate-800 overflow-y-auto">
                    <div className="p-4 border-b border-slate-800 bg-[#0f1219]">
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-[#151921] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {[
                      {
                        name: "Dr. Patel (SMS)",
                        snippet: "Can you reschedule?",
                        time: "9:00 AM",
                      },
                      {
                        name: "Luxe Hair (WhatsApp)",
                        snippet: "Confirming booking at 2.",
                        time: "Yesterday",
                      },
                      {
                        name: "Jared (iMessage)",
                        snippet: "Thanks for the info.",
                        time: "Monday",
                      },
                    ].map((m, i) => (
                      <div
                        key={i}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 ${i === 1 ? "bg-slate-800/30" : ""}`}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-slate-200 text-sm">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {m.time}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {m.snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#0f1219]">
                      <h3 className="font-medium text-white">
                        Luxe Hair (WhatsApp)
                      </h3>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                      <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-none self-start max-w-[80%] text-sm">
                        Can you check if my 2PM appointment tomorrow is
                        confirmed?
                      </div>
                      <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[80%] text-sm">
                        Yes! We have you down for 2PM tomorrow. See you then!
                      </div>
                      <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-none self-start max-w-[80%] text-sm">
                        Confirming booking at 2.
                      </div>
                    </div>
                    <div className="p-4 bg-[#0f1219] border-t border-slate-800">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 bg-[#151921] border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                        <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-500">
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
