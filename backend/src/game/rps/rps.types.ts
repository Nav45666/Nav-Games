export type Choice = 'rock' | 'paper' | 'scissors';

export type RpsPlayer = {
  id: string;
  name: string;
};

export type RpsRoom = {
  roomCode: string;
  players: RpsPlayer[];
  choices: Record<string, Choice>;
  scores: Record<string, number>;
  roundWinner?: string;
  gameWinner?: string;
};
