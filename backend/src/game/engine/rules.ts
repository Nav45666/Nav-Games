import { Card } from './types';

export function canPlayCard(
  playedCard: Card,
  topCard: Card
): boolean {
  // Wild cards can always be played
  if (playedCard.value === 'wild' || playedCard.value === 'wild4') {
    return true;
  }

  // Match by color
  if (playedCard.color && playedCard.color === topCard.color) {
    return true;
  }

  // Match by value
  if (playedCard.value === topCard.value) {
    return true;
  }

  return false;
}