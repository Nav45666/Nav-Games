import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { UnoEngine } from './engine/uno.engine';

type Room = {
  players: string[];
  game: UnoEngine | null;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  private rooms: Record<string, Room> = {};

  private clientRooms: Record<string, string> = {};

  private clientNames: Record<string, string> = {};

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  handleDisconnect(client: Socket) {
    this.removeClient(client);
  }

  private removeClient(client: Socket) {
    const roomCode = this.clientRooms[client.id];

    const name = this.clientNames[client.id];

    if (!roomCode || !name) return;

    const room = this.rooms[roomCode];

    if (!room) return;

    room.players = room.players.filter((player) => player !== name);

    delete this.clientRooms[client.id];

    delete this.clientNames[client.id];

    if (room.players.length === 0) {
      delete this.rooms[roomCode];
      return;
    }

    if (room.game) {
      room.game = null;

      this.server.to(roomCode).emit('returnToLobby', 'A player left the game.');
    }

    this.server.to(roomCode).emit('playersUpdated', room.players);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket()
    client: Socket,
  ) {
    this.removeClient(client);
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody()
    name: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    const code = this.generateRoomCode();

    this.rooms[code] = {
      players: [name],
      game: null,
    };

    client.join(code);

    this.clientRooms[client.id] = code;

    this.clientNames[client.id] = name;

    client.emit('roomCreated', {
      roomCode: code,
      players: this.rooms[code].players,
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody()
    data: {
      roomCode: string;
      name: string;
    },
    @ConnectedSocket()
    client: Socket,
  ) {
    const room = this.rooms[data.roomCode];

    if (!room) {
      client.emit('errorMessage', 'Room not found');
      return;
    }

    if (room.players.includes(data.name)) {
      client.emit('errorMessage', 'Name already taken');
      return;
    }

    room.players.push(data.name);

    client.join(data.roomCode);

    this.clientRooms[client.id] = data.roomCode;

    this.clientNames[client.id] = data.name;

    this.server.to(data.roomCode).emit('playersUpdated', room.players);
  }

  @SubscribeMessage('startGame')
  handleStartGame(
    @MessageBody()
    roomCode: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    const room = this.rooms[roomCode];

    if (!room) {
      client.emit('errorMessage', 'Room not found');
      return;
    }

    if (room.players.length < 2) {
      client.emit('errorMessage', 'Need at least 2 players');
      return;
    }

    room.game = new UnoEngine(room.players);

    room.game.startGame();

    this.server.to(roomCode).emit('gameStarted', room.game.getState());
  }

  @SubscribeMessage('playCard')
  handlePlayCard(
    @MessageBody()
    data: {
      roomCode: string;
      playerName: string;
      cardIndex: number;
      chosenColor?: 'red' | 'blue' | 'green' | 'yellow';
    },
  ) {
    const room = this.rooms[data.roomCode];

    if (!room || !room.game) return;

    const state = room.game.getState();

    const player = state.players.find((p) => p.name === data.playerName);

    if (!player) return;

    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.name !== data.playerName) {
      this.server.to(data.roomCode).emit('errorMessage', 'Not your turn');
      return;
    }

    const selectedCard = player.hand[data.cardIndex];

    if (!selectedCard) return;

    if (selectedCard.value === 'wild' || selectedCard.value === 'wild4') {
      if (!data.chosenColor) {
        this.server.to(data.roomCode).emit('errorMessage', 'Choose a color');
        return;
      }

      selectedCard.color = data.chosenColor;
    }

    const success = room.game.playCard(player.id, data.cardIndex);

    if (!success) {
      this.server.to(data.roomCode).emit('errorMessage', 'Invalid move');
      return;
    }

    this.server.to(data.roomCode).emit('gameStarted', room.game.getState());
  }

  @SubscribeMessage('drawCard')
  handleDrawCard(
    @MessageBody()
    data: {
      roomCode: string;
      playerName: string;
    },
  ) {
    const room = this.rooms[data.roomCode];

    if (!room || !room.game) return;

    const state = room.game.getState();

    const player = state.players.find((p) => p.name === data.playerName);

    if (!player) return;

    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.name !== data.playerName) {
      this.server.to(data.roomCode).emit('errorMessage', 'Not your turn');
      return;
    }

    const topCard = state.discardPile[state.discardPile.length - 1];

    const hasPlayableCard = player.hand.some(
      (card) =>
        card.value === 'wild' ||
        card.value === 'wild4' ||
        card.color === topCard?.color ||
        card.value === topCard?.value,
    );

    if (hasPlayableCard) {
      this.server
        .to(data.roomCode)
        .emit('errorMessage', 'You already have a playable card');
      return;
    }

    const drawnCard = state.deck.pop();

    if (drawnCard) {
      player.hand.push(drawnCard);
    }

    this.server.to(data.roomCode).emit('gameStarted', room.game.getState());
  }

  @SubscribeMessage('sayUno')
  handleSayUno(@MessageBody() data: any) {
    const room = this.rooms[data.roomCode];
    if (!room?.game) return;

    const player = room.game
      .getState()
      .players.find((p) => p.name === data.playerName);

    if (!player) return;

    room.game.sayUno(player.id);

    this.server.to(data.roomCode).emit('gameStarted', room.game.getState());
  }

  @SubscribeMessage('playAgain')
  handlePlayAgain(
    @MessageBody()
    roomCode: string,
  ) {
    const room = this.rooms[roomCode];

    if (!room) return;

    if (room.players.length < 2) return;

    room.game = new UnoEngine(room.players);

    room.game.startGame();

    this.server.to(roomCode).emit('gameStarted', room.game.getState());
  }
  @SubscribeMessage('catchUno')
  handleCatchUno(@MessageBody() data: any) {
    const room = this.rooms[data.roomCode];
    if (!room?.game) return;

    const success = room.game.catchUno(data.targetName);

    if (!success) {
      this.server.to(data.roomCode).emit('errorMessage', 'Cannot catch UNO');
      return;
    }

    this.server.to(data.roomCode).emit('gameStarted', room.game.getState());
  }
}
