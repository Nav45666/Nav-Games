"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main
      className="min-h-screen text-white flex items-center justify-center px-6 py-10 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/Assets/MainPage-Background.jpg')",
      }}
    >
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <img
            src="/Assets/Navgames.png"
            alt="Nav Games"
            className="w-full max-w-[650px] mx-auto drop-shadow-2xl"
            draggable={false}
          />

          <p className="text-slate-300 mt-4 text-lg drop-shadow-lg">
            Multiplayer browser games made by Nav
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* UNO */}
          <Link
            href="/uno"
            className="group block transition hover:-translate-y-2"
          >
            <img
              src="/Assets/MainPage-Uno.png"
              alt="UNO"
              className="w-full max-w-[420px] mx-auto drop-shadow-2xl transition group-hover:scale-105"
              draggable={false}
            />

            <div className="text-center mt-4 text-cyan-300 font-bold text-lg group-hover:text-cyan-200 transition">
              Play Now →
            </div>
          </Link>

          {/* RPS */}
          <div className="relative group cursor-not-allowed">
            <img
              src="/Assets/MainPage-RPS.png"
              alt="Rock Paper Scissors"
              className="w-full max-w-[420px] mx-auto opacity-95 drop-shadow-2xl"
              draggable={false}
            />

            <img
              src="/Assets/Comingsoon.png"
              alt="Coming Soon"
              className="absolute top-2 right-8 w-32 opacity-0 group-hover:opacity-100 transition"
              draggable={false}
            />

            <div className="text-center mt-4 text-slate-400 font-bold text-lg">
              Locked
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-14 text-sm text-slate-300 drop-shadow-md">
          Version 1 Launch
        </div>
      </div>
    </main>
  );
}
