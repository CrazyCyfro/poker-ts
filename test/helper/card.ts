import Card, { CardRank, CardSuit } from '../../src/lib/card'

export function makeCards(description: string): Card[] {
    const parts = description.split(/\s+/)
    return parts.map(part => {
        const rank = part[0]
        const suite = part[1]

        const cardRank = CardRank[rank.replace(/(\d)/, '_$1').toUpperCase()]
        const cardSuite: CardSuit = (() => {
            switch (suite.toUpperCase()) {
                case 'S':
                    return CardSuit.SPADES
                case 'H':
                    return CardSuit.HEARTS
                case 'C':
                    return CardSuit.CLUBS
                case 'D':
                    return CardSuit.DIAMONDS
                default:
                    throw new Error('Invalid suite')
            }
        })()

        return new Card(cardRank, cardSuite)
    })
}

export function shuffleForThreePlayersWithTwoWinners(array: Card[]) {
    const cards = makeCards(
        '2c 2c' + // First player
        ' Kc 2c' + // Second player
        ' Kc 2c' + // Third player
        ' Ac Ac Ac Ac As' // Community cards
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersWithFullHouseWinner(array: Card[]) {
    const cards = makeCards(
        '4s 4c' + // First player
        ' Kc 5h' + // Second player
        ' Ac Ks 4d 2c 2s' // Community cards
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersDraw(array: Card[]) {
    const cards = makeCards(
        'Td 9h' + // First player
        ' Th 3c' + // Second player
        ' Qh Qc As Tc 5h' // Community cards
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersBoardRoyalFlush(array: Card[]) {
    const cards = makeCards(
        '2c 3d' + // First player
        ' 4c 5d' + // Second player
        ' As Ks Qs Js Ts' // Community cards (royal flush on board)
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersBoardStraightFlush(array: Card[]) {
    const cards = makeCards(
        '2c 3d' + // First player
        ' 4c 5d' + // Second player
        ' 9s 8s 7s 6s 5s' // Community cards (straight flush on board)
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersBoardQuads(array: Card[]) {
    const cards = makeCards(
        '2c 3d' + // First player
        ' 4c 5d' + // Second player
        ' Ah As Ad Ac Kh' // Community cards (four of a kind on board)
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersBoardFullHouse(array: Card[]) {
    const cards = makeCards(
        '2c 3d' + // First player
        ' 4c 5d' + // Second player
        ' Ah Ad Ac Kh Kd' // Community cards (full house on board)
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersBoardFlush(array: Card[]) {
    const cards = makeCards(
        '2c 3d' + // First player
        ' 4c 5d' + // Second player
        ' As Ks 9s 7s 2s' // Community cards (flush on board)
    )
    cards.forEach((card, index) => array[51 - index] = card)
}

export function shuffleForTwoPlayersBoardStraight(array: Card[]) {
    const cards = makeCards(
        '2c 3d' + // First player
        ' 4c 5d' + // Second player
        ' 6h 7d 8s 9c Th' // Community cards (straight on board)
    )
    cards.forEach((card, index) => array[51 - index] = card)
}