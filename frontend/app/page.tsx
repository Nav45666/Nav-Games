"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-cyan-300 drop-shadow-lg">
            Nav Games
          </h1>

          <p className="text-slate-400 mt-4 text-lg">
            Multiplayer browser games made by Nav
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* UNO */}
          <Link
            href="/uno"
            className="group bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-cyan-400 hover:-translate-y-1 hover:shadow-2xl transition block"
          >
            <div className="text-6xl mb-5">🃏</div>

            <h2 className="text-4xl font-bold text-cyan-300 group-hover:text-cyan-200 transition">
              UNO
            </h2>

            <p className="text-slate-400 mt-3 text-lg">
              Create rooms, invite friends, and play online UNO.
            </p>

            <div className="mt-6 text-sm text-cyan-300 font-semibold">
              Play Now →
            </div>
          </Link>

          {/* RPS */}
          <Link
            href="/rps"
            className="group bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-purple-400 hover:-translate-y-1 hover:shadow-2xl transition block"
          >
            <div className="text-6xl mb-5">✊</div>

            <h2 className="text-4xl font-bold text-purple-300 group-hover:text-purple-200 transition">
              Rock Paper Scissors
            </h2>

            <p className="text-slate-400 mt-3 text-lg">
              Quick online battles against friends.
            </p>

            <div className="mt-6 text-sm text-purple-300 font-semibold">
              Play Now →
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-14 text-sm text-slate-500">
          Version 1 Launch
        </div>
      </div>
    </main>
  );
}
