import { Choice, RpsPlayer, RpsRoom } from './rps.types';

export class RpsEngine {
  private rooms: Record<string, RpsRoom> = {};

  private makeCode(): string {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  createRoom(playerName: string, socketId: string): RpsRoom {
    const roomCode = this.makeCode();

    const room: RpsRoom = {
      roomCode,
      players: [
        {
          id: socketId,
          name: playerName,
        },
      ],
      choices: {},
      scores: {
        [playerName]: 0,
      },
    };

    this.rooms[roomCode] = room;

    return room;
  }

  joinRoom(roomCode: string, playerName: string, socketId: string) {
    const room = this.rooms[roomCode];

    if (!room) return null;
    if (room.players.length >= 2) return null;

    room.players.push({
      id: socketId,
      name: playerName,
    });

    room.scores[playerName] = 0;

    return room;
  }

  getRoom(roomCode: string) {
    return this.rooms[roomCode];
  }

  choose(roomCode: string, playerName: string, choice: Choice) {
    const room = this.rooms[roomCode];
    if (!room) return null;

    room.choices[playerName] = choice;

    if (Object.keys(room.choices).length < 2) {
      return room;
    }

    const p1 = room.players[0].name;
    const p2 = room.players[1].name;

    const c1 = room.choices[p1];
    const c2 = room.choices[p2];

    const winner = this.getWinner(p1, c1, p2, c2);

    if (winner !== 'draw') {
      room.scores[winner]++;
      room.roundWinner = winner;

      if (room.scores[winner] >= 3) {
        room.gameWinner = winner;
      }
    } else {
      room.roundWinner = 'draw';
    }

    return room;
  }

  private getWinner(p1: string, c1: Choice, p2: string, c2: Choice): string {
    if (c1 === c2) return 'draw';

    if (
      (c1 === 'rock' && c2 === 'scissors') ||
      (c1 === 'paper' && c2 === 'rock') ||
      (c1 === 'scissors' && c2 === 'paper')
    ) {
      return p1;
    }

    return p2;
  }

  nextRound(roomCode: string) {
    const room = this.rooms[roomCode];
    if (!room) return null;

    room.choices = {};
    room.roundWinner = undefined;

    return room;
  }

  removePlayer(socketId: string) {
    for (const code in this.rooms) {
      const room = this.rooms[code];

      room.players = room.players.filter((p) => p.id !== socketId);

      if (room.players.length === 0) {
        delete this.rooms[code];
        return;
      }
    }
  }
}
