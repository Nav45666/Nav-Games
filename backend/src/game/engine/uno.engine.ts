import { Card, GameState, Player } from './types';
import { createDeck, drawCard } from './deck';
import { canPlayCard } from './rules';

export class UnoEngine {
  private state: GameState;

  constructor(playerNames: string[]) {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      hand: [],
      saidUno: false,
    }));

    this.state = {
      players,
      deck: [],
      discardPile: [],
      currentPlayerIndex: 0,
      direction: 1,
      started: false,
    };
  }

  startGame() {
    const deck = createDeck();

    for (const player of this.state.players) {
      player.hand = [];
      player.saidUno = false;
    }

    for (let i = 0; i < 7; i++) {
      for (const player of this.state.players) {
        const card = drawCard(deck);

        if (card) player.hand.push(card);
      }
    }

    let firstCard: Card | undefined;

    do {
      firstCard = drawCard(deck);
    } while (
      firstCard &&
      ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(firstCard.value)
    );

    this.state.deck = deck;
    this.state.discardPile = firstCard ? [firstCard] : [];
    this.state.currentPlayerIndex = 0;
    this.state.direction = 1;
    this.state.winnerId = undefined;
    this.state.started = true;
  }

  getState(): GameState {
    return this.state;
  }

  getTopCard(): Card | undefined {
    return this.state.discardPile[this.state.discardPile.length - 1];
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  nextTurn() {
    const total = this.state.players.length;

    this.state.currentPlayerIndex =
      (this.state.currentPlayerIndex + this.state.direction + total) % total;
  }

  playCard(playerId: string, cardIndex: number): boolean {
    const player = this.getCurrentPlayer();

    if (player.id !== playerId) return false;

    const selectedCard = player.hand[cardIndex];
    const topCard = this.getTopCard();

    if (!selectedCard || !topCard) return false;

    if (!canPlayCard(selectedCard, topCard)) return false;

    player.hand.splice(cardIndex, 1);

    this.state.discardPile.push(selectedCard);

    if (player.hand.length === 1) {
      player.saidUno = false;
    }

    if (player.hand.length === 0) {
      this.state.winnerId = player.id;
      return true;
    }

    this.applyCardEffect(selectedCard);

    return true;
  }

  sayUno(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);

    if (!player) return false;

    if (player.hand.length !== 1) return false;

    player.saidUno = true;

    return true;
  }

  catchUno(targetName: string): boolean {
    const target = this.state.players.find((p) => p.name === targetName);

    if (!target) return false;

    if (target.hand.length !== 1) return false;

    if (target.saidUno) return false;

    this.drawCardsToPlayer(target, 2);

    target.saidUno = false;

    return true;
  }

  private applyCardEffect(card: Card) {
    switch (card.value) {
      case 'reverse':
        if (this.state.players.length === 2) {
          this.nextTurn();
          this.nextTurn();
        } else {
          this.state.direction *= -1;
          this.nextTurn();
        }
        break;

      case 'skip':
        this.nextTurn();
        this.nextTurn();
        break;

      case 'draw2':
        this.nextTurn();
        this.drawCardsToCurrentPlayer(2);
        this.nextTurn();
        break;

      case 'wild4':
        this.nextTurn();
        this.drawCardsToCurrentPlayer(4);
        this.nextTurn();
        break;

      default:
        this.nextTurn();
        break;
    }
  }

  private drawCardsToCurrentPlayer(count: number) {
    const player = this.getCurrentPlayer();

    this.drawCardsToPlayer(player, count);
  }

  private drawCardsToPlayer(player: Player, count: number) {
    for (let i = 0; i < count; i++) {
      const card = drawCard(this.state.deck);

      if (card) player.hand.push(card);
    }
  }
}
