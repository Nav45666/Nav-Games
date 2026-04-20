"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:3001");

type Card = {
  color?: string;
  value: string;
};

type Player = {
  id: string;
  name: string;
  hand: Card[];
};

type GameState = {
  players: Player[];
  discardPile: Card[];
  currentPlayerIndex: number;
  winnerId?: string;
};

const valueMap: Record<string, string> = {
  "0": "Zero",
  "1": "One",
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  skip: "Skip",
  reverse: "Reverse",
  draw2: "PlusTwo",
  wild: "Wild",
  wild4: "PlusFour",
};

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const getCardImage = (card: Card) => {
  if (card.value === "wild") return "/Uno_Cards/Wild.png";
  if (card.value === "wild4") return "/Uno_Cards/PlusFour.png";

  const color = capitalize(card.color || "");
  const value = valueMap[card.value];

  return `/Uno_Cards/${color}-${value}.png`;
};

export default function Home() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [currentRoom, setCurrentRoom] = useState("");
  const [game, setGame] = useState<GameState | null>(null);
  const [pendingWildIndex, setPendingWildIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [unoSaved, setUnoSaved] = useState(false);

  useEffect(() => {
    socket.on("roomCreated", (data) => {
      setCurrentRoom(data.roomCode);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
    });

    socket.on("playersUpdated", (data) => {
      setPlayers(data);
    });

    socket.on("gameStarted", (data) => {
      setGame(data);
      setPendingWildIndex(null);
    });

    socket.on("returnToLobby", (msg) => {
      setGame(null);
      alert(msg);
    });

    socket.on("errorMessage", (msg) => {
      alert(msg);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("playersUpdated");
      socket.off("gameStarted");
      socket.off("returnToLobby");
      socket.off("errorMessage");
    };
  }, []);

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setGame(null);
    setCurrentRoom("");
    setPlayers([]);
    setCopied(false);
  };

  const copyCode = async () => {
    if (!currentRoom) return;

    await navigator.clipboard.writeText(currentRoom);
    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
  };

  const createRoom = () => {
    if (!name.trim()) return alert("Enter your name");
    socket.emit("createRoom", name.trim());
  };

  const joinRoom = () => {
    if (!name.trim()) return alert("Enter your name");
    if (!roomCode.trim()) return alert("Enter room code");

    const code = roomCode.trim().toUpperCase();

    socket.emit("joinRoom", {
      roomCode: code,
      name: name.trim(),
    });

    setCurrentRoom(code);
  };

  const startGame = () => {
    if (!currentRoom) return;
    socket.emit("startGame", currentRoom);
  };

  const myPlayer = game?.players.find((p) => p.name === name);
  const winner = game?.players.find((p) => p.id === game?.winnerId);
  const topCard = game?.discardPile[game.discardPile.length - 1];

  const isMyTurn =
    game && !winner && game.players[game.currentPlayerIndex]?.name === name;

  const hasPlayableCard =
    isMyTurn &&
    myPlayer?.hand.some(
      (card) =>
        card.value === "wild" ||
        card.value === "wild4" ||
        card.color === topCard?.color ||
        card.value === topCard?.value,
    );

  const playCard = (cardIndex: number) => {
    if (!currentRoom || !game || game.winnerId) return;

    const card = myPlayer?.hand[cardIndex];
    if (!card) return;

    if (card.value === "wild" || card.value === "wild4") {
      setPendingWildIndex(cardIndex);
      return;
    }

    socket.emit("playCard", {
      roomCode: currentRoom,
      playerName: name,
      cardIndex,
    });
  };

  const chooseWildColor = (color: string) => {
    if (pendingWildIndex === null) return;

    socket.emit("playCard", {
      roomCode: currentRoom,
      playerName: name,
      cardIndex: pendingWildIndex,
      chosenColor: color,
    });

    setPendingWildIndex(null);
  };

  const drawCard = () => {
    if (!currentRoom || !game || game.winnerId || hasPlayableCard) return;

    socket.emit("drawCard", {
      roomCode: currentRoom,
      playerName: name,
    });
  };

  /* GAME PAGE */

  if (game) {
    const otherPlayers = game.players.filter((p) => p.name !== name);

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100 p-4">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex justify-between items-center">
            <button
              onClick={leaveRoom}
              className="bg-slate-700 px-4 py-2 rounded-xl hover:bg-slate-600"
            >
              ← Lobby
            </button>

            <h1 className="text-2xl font-bold">UNO Match</h1>

            <button
              onClick={leaveRoom}
              className="bg-red-500 px-4 py-2 rounded-xl hover:bg-red-400"
            >
              Leave
            </button>
          </div>

          <div className="text-center text-slate-400">
            Room Code:{" "}
            <span className="font-bold text-cyan-300 tracking-widest">
              {currentRoom}
            </span>
          </div>

          {winner && (
            <>
              {/* Confetti */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-sm animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: [
                        "#22d3ee",
                        "#facc15",
                        "#ef4444",
                        "#22c55e",
                        "#a855f7",
                      ][i % 5],
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: `${1.2 + Math.random()}s`,
                    }}
                  />
                ))}
              </div>

              <div className="text-center space-y-4">
                <div className="inline-block px-8 py-4 rounded-3xl bg-yellow-400 text-slate-900 text-2xl font-black shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-pulse">
                  🏆 {winner.name} Wins!
                </div>

                <button
                  onClick={() => socket.emit("playAgain", currentRoom)}
                  className="bg-cyan-500 text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-cyan-400 transition hover:scale-105"
                >
                  Play Again
                </button>
              </div>
            </>
          )}

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {/* Draw */}
            <div className="flex justify-center">
              <button
                onClick={drawCard}
                disabled={!isMyTurn || !!hasPlayableCard}
                className={`p-0 bg-transparent border-0 outline-none transition ${
                  isMyTurn && !hasPlayableCard
                    ? "hover:scale-105 drop-shadow-[0_0_28px_rgba(250,204,21,1)] animate-pulse"
                    : "opacity-60"
                }`}
              >
                <img
                  src="/Uno_Cards/Back.png"
                  alt="Draw"
                  className="w-28 h-40 object-contain"
                />
              </button>
            </div>

            {/* Center */}
            <div className="text-center">
              <img
                src={topCard ? getCardImage(topCard) : ""}
                alt="Top Card"
                className="w-32 h-44 mx-auto object-contain"
              />

              <div className="mt-3 text-sm">
                Active Color:
                <span className="ml-2 text-cyan-300 font-bold">
                  {topCard?.color || "wild"}
                </span>
              </div>
            </div>

            {/* Turn */}
            <div className="text-center md:text-right">
              <div className="text-sm text-slate-400 uppercase tracking-widest">
                Current Turn
              </div>

              <div className="mt-2 text-2xl font-black text-cyan-300">
                {game.players[game.currentPlayerIndex]?.name}
              </div>

              <div className="mt-3">
                {winner ? (
                  <span className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-xl font-bold">
                    Game Over
                  </span>
                ) : isMyTurn ? (
                  <span className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-bold animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                    YOUR TURN
                  </span>
                ) : (
                  <span className="bg-slate-700 px-4 py-2 rounded-xl font-semibold">
                    Waiting...
                  </span>
                )}
              </div>
              {myPlayer && myPlayer.hand.length <= 2 && !winner && (
                <div className="mt-4 w-25 flex flex-col items-center">
                  <button
                    onClick={() => {
                      socket.emit("sayUno", {
                        roomCode: currentRoom,
                        playerName: name,
                      });

                      setUnoSaved(true);

                      setTimeout(() => setUnoSaved(false), 2000);
                    }}
                    className="w-25 bg-red-500 px-6 py-3 rounded-xl font-bold text-lg hover:bg-red-400 transition"
                  >
                    UNO!
                  </button>

                  {unoSaved && (
                    <div className="mt-2 text-emerald-400 font-semibold text-sm text-center whitespace-nowrap">
                      UNO Registered!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Players Table */}
          <div className="mt-5 ml-auto w-56 bg-slate-800/90 border border-slate-700 rounded-xl p-3 shadow-xl">
            <h3 className="text-sm font-bold text-cyan-300 text-center mb-2">
              Players
            </h3>

            <div className="space-y-2 text-sm">
              {otherPlayers.map((p, i) => (
                <div key={i} className="bg-slate-700/80 rounded-lg px-3 py-2">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                    <span className="truncate">{p.name}</span>

                    <span className="font-bold text-cyan-300 min-w-[24px] text-right">
                      {p.hand.length}
                    </span>
                  </div>

                  {p.hand.length === 1 && (
                    <button
                      onClick={() =>
                        socket.emit("catchUno", {
                          roomCode: currentRoom,
                          targetName: p.name,
                        })
                      }
                      className="mt-2 w-full bg-yellow-500 text-black text-[11px] font-bold py-1 rounded-md hover:bg-yellow-400"
                    >
                      UNO CAUGHT!
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hand */}
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto pb-4">
            {myPlayer?.hand.map((card, i) => {
              const valid =
                isMyTurn &&
                (card.value === "wild" ||
                  card.value === "wild4" ||
                  card.color === topCard?.color ||
                  card.value === topCard?.value);

              return (
                <button
                  key={i}
                  disabled={!valid}
                  onClick={() => playCard(i)}
                  className={`p-0 bg-transparent border-0 outline-none transition duration-150 ${
                    valid
                      ? "hover:-translate-y-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]"
                      : "opacity-70"
                  }`}
                >
                  <img
                    src={getCardImage(card)}
                    alt=""
                    className="w-24 h-36 object-contain"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Wild Picker */}
        {pendingWildIndex !== null && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
            <div className="bg-slate-800 p-6 rounded-2xl w-80">
              <h2 className="text-xl font-bold text-center mb-4">
                Choose Color
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {["red", "blue", "green", "yellow"].map((color) => (
                  <button
                    key={color}
                    onClick={() => chooseWildColor(color)}
                    className="bg-slate-700 py-3 rounded-xl capitalize"
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* LOBBY PAGE */

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md space-y-4 text-slate-100">
        <h1 className="text-3xl font-bold text-cyan-300 text-center">
          Nav's UNO
        </h1>

        <input
          placeholder="Your name"
          className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Room code"
          className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <button
          onClick={createRoom}
          className="w-full bg-cyan-500 text-slate-950 p-3 rounded-lg font-semibold"
        >
          Create Room
        </button>

        <button
          onClick={joinRoom}
          className="w-full bg-indigo-500 p-3 rounded-lg font-semibold"
        >
          Join Room
        </button>

        {currentRoom && (
          <>
            <div>
              <h2 className="font-semibold mb-2">Players</h2>

              {players.map((player, i) => (
                <div
                  key={i}
                  className="bg-slate-800 border border-slate-700 p-2 rounded mb-2"
                >
                  {player}
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              className="w-full bg-emerald-500 text-slate-950 p-3 rounded-lg font-semibold"
            >
              Start Game
            </button>

            <button
              onClick={leaveRoom}
              className="w-full bg-red-500 p-3 rounded-lg font-semibold"
            >
              Leave Room
            </button>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-sm text-slate-400 mb-1">Room Code</div>

              <div className="text-xl font-bold text-cyan-300 tracking-widest">
                {currentRoom}
              </div>

              <button
                onClick={copyCode}
                className="mt-3 bg-slate-700 px-4 py-2 rounded-lg"
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
