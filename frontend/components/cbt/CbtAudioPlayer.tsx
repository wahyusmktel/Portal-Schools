"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface Props {
  src: string;
  maxPlays?: number;
  label?: string;
}

export function CbtAudioPlayer({ src, maxPlays, label = "Audio Listening" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Normalize audio URL
  const audioUrl = src.startsWith("http")
    ? src
    : src.startsWith("/")
    ? `${API_URL.replace("/api/v1", "")}${src}`
    : `${API_URL.replace("/api/v1", "")}/${src}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlayCount((prev) => prev + 1);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (maxPlays && playCount >= maxPlays && !isPlaying) {
      alert(`Batas maksimal memutar audio (${maxPlays}x) telah tercapai.`);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isPlayDisabled = Boolean(maxPlays && playCount >= maxPlays && !isPlaying);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-lg my-2 shadow-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {label}
        </span>
        {maxPlays && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            Diputar: {playCount}/{maxPlays} kali
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isPlayDisabled}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isPlayDisabled
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : isPlaying
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
          }`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={isPlayDisabled}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
