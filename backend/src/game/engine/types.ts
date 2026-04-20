export type Color = 'red' | 'blue' | 'green' | 'yellow';

export type ActionCard =
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4';

export type NumberCard =
  | '0' | '1' | '2' | '3' | '4'
  | '5' | '6' | '7' | '8' | '9';

export type CardValue = NumberCard | ActionCard;

export interface Card {
  color?: Color; // wild cards have no color
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  saidUno: boolean;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  discardPile: Card[];

  currentPlayerIndex: number;
  direction: 1 | -1;

  started: boolean;
  winnerId?: string;
}