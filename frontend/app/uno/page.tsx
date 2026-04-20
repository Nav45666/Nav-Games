"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Image from "next/image";

const socket = io(
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
);

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
  const router = useRouter();

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
    setUnoSaved(false);
    setPendingWildIndex(null);
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

  /* ---------------- GAME PAGE ---------------- */

  if (game) {
    const otherPlayers = game.players.filter((p) => p.name !== name);

    return (
      <main className="min-h-screen relative text-slate-100 p-4 overflow-hidden">
        <Image
          src="/Assets/Uno-Background.png"
          alt=""
          fill
          className="object-cover -z-10"
        />

        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex justify-between items-center">
            <button onClick={() => router.push("/")}>
              <Image
                src="/Assets/Leave.png"
                alt="Home"
                width={130}
                height={50}
              />
            </button>

            <h1 className="text-2xl font-bold drop-shadow-lg">UNO Match</h1>

            <button onClick={leaveRoom}>
              <Image
                src="/Assets/Leave.png"
                alt="Leave"
                width={130}
                height={50}
              />
            </button>
          </div>

          <div className="text-center text-white text-lg font-bold">
            Room Code: {currentRoom}
          </div>

          {winner && (
            <div className="text-center space-y-4">
              <div className="text-4xl font-black text-yellow-300 animate-bounce drop-shadow-xl">
                🏆 {winner.name} Wins!
              </div>

              <button
                onClick={() => socket.emit("playAgain", currentRoom)}
                className="bg-cyan-400 px-6 py-3 rounded-xl text-black font-bold"
              >
                Play Again
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {/* Draw */}
            <div className="flex justify-center">
              <button
                onClick={drawCard}
                disabled={!isMyTurn || !!hasPlayableCard}
                className={`transition ${
                  isMyTurn && !hasPlayableCard
                    ? "hover:scale-105 drop-shadow-[0_0_24px_rgba(250,204,21,1)]"
                    : "opacity-70"
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

              <div className="mt-3 text-lg font-bold">
                Active Color:{" "}
                <span className="text-cyan-300">
                  {topCard?.color || "wild"}
                </span>
              </div>
            </div>

            {/* Turn */}
            <div className="text-center md:text-right">
              <div className="text-sm uppercase">Turn</div>

              <div className="text-2xl font-black text-cyan-300">
                {game.players[game.currentPlayerIndex]?.name}
              </div>

              {myPlayer && myPlayer.hand.length <= 2 && !winner && (
                <div className="mt-4 flex flex-col items-center md:items-end">
                  <button
                    onClick={() => {
                      socket.emit("sayUno", {
                        roomCode: currentRoom,
                        playerName: name,
                      });

                      setUnoSaved(true);
                      setTimeout(() => setUnoSaved(false), 2000);
                    }}
                    className="bg-red-500 px-6 py-3 rounded-xl font-bold text-lg"
                  >
                    UNO!
                  </button>

                  {unoSaved && (
                    <div className="mt-2 text-emerald-300 font-bold">
                      UNO Registered!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Players Table */}
          <div className="ml-auto w-full md:w-56 bg-black/50 rounded-xl p-3">
            <h3 className="text-center text-cyan-300 font-bold mb-2">
              Players
            </h3>

            <div className="space-y-2">
              {otherPlayers.map((p, i) => (
                <div key={i} className="bg-black/40 rounded-lg px-3 py-2">
                  <div className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-cyan-300 font-bold">
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
                      className="mt-2 w-full bg-yellow-400 text-black text-sm font-bold py-1 rounded-md"
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
                  className={`transition ${
                    valid
                      ? "hover:-translate-y-2 hover:scale-105"
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

  /* ---------------- LOBBY PAGE ---------------- */

  return (
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      <Image
        src="/Assets/Uno-Background.png"
        alt=""
        fill
        className="object-cover -z-10"
      />

      <div className="bg-black/50 rounded-2xl p-8 w-full max-w-md space-y-4 text-white backdrop-blur-sm">
        <div className="flex justify-center">
          <Image
            src="/Assets/UnoLobby-Logo.png"
            alt="UNO"
            width={260}
            height={90}
          />
        </div>

        <input
          placeholder="Your name"
          className="w-full bg-black/40 border border-white/20 p-3 rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Room code"
          className="w-full bg-black/40 border border-white/20 p-3 rounded-lg"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <button onClick={createRoom} className="w-full">
          <Image
            src="/Assets/CreateRoom.png"
            alt="Create Room"
            width={420}
            height={70}
          />
        </button>

        <button onClick={joinRoom} className="w-full">
          <Image
            src="/Assets/JoinRoom.png"
            alt="Join Room"
            width={420}
            height={70}
          />
        </button>

        {currentRoom && (
          <>
            <div>
              <h2 className="font-bold mb-2 text-center">Players</h2>

              {players.map((player, i) => (
                <div
                  key={i}
                  className="bg-black/40 p-2 rounded mb-2 text-center"
                >
                  {player}
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              className="w-full bg-emerald-400 text-black p-3 rounded-lg font-bold"
            >
              Start Game
            </button>

            <button onClick={leaveRoom} className="w-full">
              <Image
                src="/Assets/Leave.png"
                alt="Leave Room"
                width={420}
                height={70}
              />
            </button>

            <div className="text-center pt-2">
              Room Code:{" "}
              <span className="font-bold tracking-widest text-cyan-300">
                {currentRoom}
              </span>
              <button
                onClick={copyCode}
                className="block mx-auto mt-3 bg-slate-700 px-4 py-2 rounded-lg"
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
