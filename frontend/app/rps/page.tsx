"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
);

type GameState = {
  roomCode: string;
  players: { name: string }[];
  choices: Record<string, string>;
  scores: Record<string, number>;
  roundWinner?: string;
  gameWinner?: string;
};

export default function RPSPage() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [players, setPlayers] = useState<{ name: string }[]>([]);
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    socket.on("rpsRoomCreated", (data) => {
      setCurrentRoom(data.roomCode);
      setPlayers(data.players);
      setGame(data);
    });

    socket.on("rpsPlayersUpdated", (data) => {
      setPlayers(data.players);
      setGame(data);
    });

    socket.on("rpsGameState", (data) => {
      setPlayers(data.players);
      setGame(data);
    });

    socket.on("errorMessage", (msg) => {
      alert(msg);
    });

    return () => {
      socket.off("rpsRoomCreated");
      socket.off("rpsPlayersUpdated");
      socket.off("rpsGameState");
      socket.off("errorMessage");
    };
  }, []);

  const createRoom = () => {
    if (!name.trim()) return alert("Enter your name");
    socket.emit("createRpsRoom", name.trim());
  };

  const joinRoom = () => {
    if (!name.trim()) return alert("Enter your name");
    if (!roomCode.trim()) return alert("Enter room code");

    socket.emit("joinRpsRoom", {
      roomCode: roomCode.toUpperCase(),
      name: name.trim(),
    });

    setCurrentRoom(roomCode.toUpperCase());
  };

  const choose = (choice: string) => {
    socket.emit("rpsChoose", {
      roomCode: currentRoom,
      playerName: name,
      choice,
    });
  };

  const nextRound = () => {
    socket.emit("rpsPlayAgain", currentRoom);
  };

  /* ---------------- GAME PAGE ---------------- */

  if (game && players.length === 2) {
    const opponent = players.find((p) => p.name !== name);

    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-slate-900 rounded-3xl p-8 border border-slate-800 space-y-6">
          <h1 className="text-4xl font-black text-center text-purple-300">
            Rock Paper Scissors
          </h1>

          <div className="text-center text-slate-400">
            Room:{" "}
            <span className="text-cyan-300 font-bold">{game.roomCode}</span>
          </div>

          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-2xl p-4 text-center">
              <div className="font-bold">{name}</div>
              <div className="text-3xl mt-2 text-cyan-300">
                {game.scores[name] || 0}
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 text-center">
              <div className="font-bold">{opponent?.name}</div>
              <div className="text-3xl mt-2 text-cyan-300">
                {game.scores[opponent?.name || ""] || 0}
              </div>
            </div>
          </div>

          {/* Choice Buttons */}
          {!game.roundWinner && !game.gameWinner && (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => choose("rock")}
                className="bg-slate-800 hover:bg-purple-500 rounded-2xl p-5 transition font-bold"
              >
                ✊<div className="mt-2">Rock</div>
              </button>

              <button
                onClick={() => choose("paper")}
                className="bg-slate-800 hover:bg-purple-500 rounded-2xl p-5 transition font-bold"
              >
                ✋<div className="mt-2">Paper</div>
              </button>

              <button
                onClick={() => choose("scissors")}
                className="bg-slate-800 hover:bg-purple-500 rounded-2xl p-5 transition font-bold"
              >
                ✌️
                <div className="mt-2">Scissors</div>
              </button>
            </div>
          )}

          {/* Result */}
          {game.roundWinner && !game.gameWinner && (
            <div className="text-center space-y-4">
              <div className="text-2xl font-black text-yellow-300">
                {game.roundWinner === "draw"
                  ? "Draw!"
                  : `${game.roundWinner} wins this round!`}
              </div>

              <button
                onClick={nextRound}
                className="bg-cyan-400 text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
              >
                Next Round
              </button>
            </div>
          )}

          {/* Final Winner */}
          {game.gameWinner && (
            <div className="text-center space-y-4">
              <div className="text-3xl font-black text-green-400">
                🏆 {game.gameWinner} Wins the Match!
              </div>

              <button
                onClick={nextRound}
                className="bg-cyan-400 text-black px-6 py-3 rounded-xl font-bold"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ---------------- LOBBY PAGE ---------------- */

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 space-y-4">
        <h1 className="text-4xl font-black text-center text-purple-300">
          Rock Paper Scissors
        </h1>

        <input
          placeholder="Your name"
          className="w-full bg-slate-800 p-3 rounded-xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Room Code"
          className="w-full bg-slate-800 p-3 rounded-xl"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <button
          onClick={createRoom}
          className="w-full bg-cyan-400 text-black p-3 rounded-xl font-bold"
        >
          Create Room
        </button>

        <button
          onClick={joinRoom}
          className="w-full bg-purple-500 p-3 rounded-xl font-bold"
        >
          Join Room
        </button>

        {currentRoom && (
          <div className="text-center pt-4 text-slate-400">
            Waiting for opponent...
            <div className="text-cyan-300 font-bold mt-2 text-xl">
              {currentRoom}
            </div>
            <div className="mt-3 space-y-1">
              {players.map((p, i) => (
                <div key={i}>{p.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
