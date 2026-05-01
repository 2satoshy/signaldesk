/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { StoryContainer } from "./components/StoryContainer";
import { LiveWorkspace } from "./components/LiveWorkspace";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"intro" | "app">("intro");

  return (
    <div className="bg-[#050810] min-h-screen text-white font-sans selection:bg-blue-500/30">
      {/* TABS HEADER */}
      <div className="fixed top-0 left-0 w-full z-[100] flex justify-center py-4 bg-gradient-to-b from-[#050810] to-[#050810]/0 pointer-events-none">
        <div className="bg-[#0A0A0A]/80 backdrop-blur-md border border-slate-800 rounded-full p-1 flex gap-1 pointer-events-auto shadow-2xl">
          <button
            onClick={() => setActiveTab("intro")}
            className={`px-6 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${activeTab === "intro" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "text-slate-400 hover:text-slate-200"}`}
          >
            Intro
          </button>
          <button
            onClick={() => setActiveTab("app")}
            className={`px-6 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${activeTab === "app" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "text-slate-400 hover:text-slate-200"}`}
          >
            App
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "intro" ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StoryContainer />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-full relative overflow-hidden bg-black"
          >
            <LiveWorkspace />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
