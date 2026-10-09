'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SMIT_THEME } from '@/lib/theme-config';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function SplashScreenPage() {
  const router = useRouter();
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // 50ms interval for smooth progress bar animation over 5000ms
    const totalDurationMs = 5000;
    const intervalMs = 50;
    const stepIncrement = (intervalMs / totalDurationMs) * 100;

    const progressTimer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    // 1-second countdown interval
    const countdownTimer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Exact 5-Second Redirect to Website / Portal
    const redirectTimeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (e) {
        router.push('/login');
      }
    }, 5000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(countdownTimer);
      clearTimeout(redirectTimeout);
    };
  }, [router]);

  const handleSkipWait = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (e) {
      router.push('/login');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between text-white overflow-hidden font-sans">
      {/* Real Campus Building Background Photo with Gradient Dark Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 transform transition-transform duration-1000"
        style={{ backgroundImage: "url('/smit-building.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#4a0e17]/90 via-[#701111]/85 to-black/90 z-0 backdrop-blur-[2px]" />

      {/* Background Decorative Rings & Glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-red-500/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Top Header */}
      <div className="z-10 w-full p-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-300 border border-amber-500/40 shadow-xl backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          Official ERP Portal Gateway
        </span>
      </div>

      {/* Main Central Logo Display */}
      <div className="z-10 flex flex-col items-center text-center px-4 py-8 max-w-xl mx-auto">
        {/* Animated Emblem Frame */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-red-600 opacity-50 blur-xl group-hover:opacity-80 transition duration-1000 animate-pulse" />
          <div className="relative flex h-52 w-52 items-center justify-center rounded-3xl bg-white p-4 shadow-2xl ring-4 ring-amber-400/50 transform transition-transform duration-500 hover:scale-105">
            <img
              src="/smit-logo.png"
              alt="Sri Muthukumaran Institute of Technology Logo"
              className="max-h-44 max-w-44 object-contain"
            />
          </div>
        </div>

        {/* Institution Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 text-shadow drop-shadow-md">
          {SMIT_THEME.collegeName}
        </h1>
        <p className="text-xs sm:text-sm text-amber-200/90 font-semibold max-w-md leading-relaxed mb-8 drop-shadow-sm">
          {SMIT_THEME.collegeTagline}
        </p>

        {/* 5-Second Countdown Status Bar */}
        <div className="w-full max-w-md bg-black/60 p-5 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              Loading Portal Assets...
            </span>
            <span className="text-amber-300 font-mono">
              Redirecting in {secondsRemaining}s
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="h-2.5 w-full rounded-full bg-black/70 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-100 ease-linear shadow-md"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <p className="text-[11px] text-slate-300">
              Sri Muthukumaran Staff ERP System
            </p>
            <button
              onClick={handleSkipWait}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-white transition-colors"
            >
              Skip Wait <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="z-10 w-full p-6 text-center text-xs text-slate-300 bg-black/30 backdrop-blur-md">
        © {new Date().getFullYear()} Sri Muthukumaran Institute of Technology • All Rights Reserved.
      </div>
    </div>
  );
}
