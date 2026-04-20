import { Card, Color } from './types';

const colors: Color[] = ['red', 'blue', 'green', 'yellow'];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of colors) {
    // One zero card
    deck.push({ color, value: '0' });

    // Two of each 1–9
    for (let i = 1; i <= 9; i++) {
      deck.push({ color, value: i.toString() as any });
      deck.push({ color, value: i.toString() as any });
    }

    // Two action cards each
    const actions = ['skip', 'reverse', 'draw2'] as const;

    for (const action of actions) {
      deck.push({ color, value: action });
      deck.push({ color, value: action });
    }
  }

  // 4 Wild + 4 Wild Draw Four
  for (let i = 0; i < 4; i++) {
    deck.push({ value: 'wild' });
    deck.push({ value: 'wild4' });
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function drawCard(deck: Card[]): Card | undefined {
  return deck.pop();
}