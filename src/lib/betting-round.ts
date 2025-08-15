import assert from 'assert'
import ChipRange from './chip-range'
import { SeatIndex } from 'types/seat-index'
import { Chips } from 'types/chips'
import Round, { Action as RoundAction } from './round'
import { SeatArray } from 'types/seat-array'

export enum Action {
    LEAVE,
    MATCH,
    RAISE
}

export class ActionRange {
    canRaise: boolean
    chipRange: ChipRange

    constructor(canRaise: boolean, chipRange: ChipRange = new ChipRange(0, 0) ) {
        this.canRaise = canRaise
        this.chipRange = chipRange
    }
}

export default class BettingRound {
    private readonly _players: SeatArray
    private _round: Round
    private _biggestBet: Chips
    private _minRaise: Chips

    constructor(players: SeatArray, firstToAct: SeatIndex, minRaise: Chips, biggestBet: Chips = 0) {
        this._round = new Round(players.map(player => !!player), firstToAct)
        this._players = players
        this._biggestBet = biggestBet
        this._minRaise = minRaise

        assert(firstToAct < players.length, 'Seat index must be in the valid range')
        assert(players[firstToAct], 'First player to act must exist')
    }

    inProgress(): boolean {
        // Delegate base condition
        if (!this._round.inProgress()) return false

        // Multiway-safe early termination:
        // If from the current player up to (but not including) the last aggressive actor
        // every active player is already all-in AND has matched the biggest bet, then
        // there is no further action possible and the round is effectively complete.
        const active = this._round.activePlayers()
        const start = this._round.playerToAct()
        const end = this._round.lastAggressiveActor()

        let index = start
        // Iterate through remaining turn order until we would return to last aggressor
        // If any player can take action (has chips or hasn't matched), the round continues
        do {
            if (active[index]) {
                const p = this._players[index]
                if (p !== null) {
                    // A player can act if they have chips left AND haven't matched the biggest bet
                    // OR if they have chips left and can raise
                    const canAct = p.stack() > 0 && (p.betSize() < this._biggestBet || p.totalChips() > this._biggestBet)
                    if (canAct) return true
                }
            }
            index = index + 1
            if (index === active.length) index = 0
        } while (index !== end)

        return false
    }

    isContested(): boolean {
        return this._round.isContested();
    }

    playerToAct(): SeatIndex {
        return this._round.playerToAct()
    }

    biggestBet(): Chips {
        return this._biggestBet
    }

    minRaise(): Chips {
        return this._minRaise
    }

    players(): SeatArray {
        return this._round.activePlayers().map((isActive, index) => {
            return isActive ? this._players[index] : null
        })
    }

    activePlayers(): boolean[] {
        return this._round.activePlayers()
    }

    numActivePlayers(): number {
        return this._round.numActivePlayers()
    }

    legalActions(): ActionRange {
        const player = this._players[this._round.playerToAct()]
        assert(player !== null)
        const playerChips = player.totalChips()
        
        // Check if all other active players are all-in
        const otherPlayersAllIn = this._round.activePlayers()
            .map((isActive, index) => ({ isActive, index }))
            .filter(({ isActive, index }) => isActive && index !== this._round.playerToAct())
            .every(({ index }) => {
                const otherPlayer = this._players[index]
                return otherPlayer !== null && otherPlayer.stack() === 0
            })
        
        // RAISE is illegal if all other players are all-in
        const canRaise = !otherPlayersAllIn && playerChips > this._biggestBet
        
        if (canRaise) {
            const minBet = this._biggestBet + this._minRaise
            const raiseRange = new ChipRange(Math.min(minBet, playerChips), playerChips)
            return new ActionRange(canRaise, raiseRange)
        } else {
            return new ActionRange(canRaise)
        }
    }

    actionTaken(action: Action, bet: Chips = 0) {
        const player = this._players[this._round.playerToAct()]
        assert(player !== null)
        if (action === Action.RAISE) {
            assert(this.isRaiseValid(bet))
            player.bet(bet)
            this._minRaise = bet - this._biggestBet
            this._biggestBet = bet
            let actionFlag = RoundAction.AGGRESSIVE
            if (player.stack() === 0) {
                actionFlag |= RoundAction.LEAVE
            }
            this._round.actionTaken(actionFlag)
        } else if (action === Action.MATCH) {
            player.bet(Math.min(this._biggestBet, player.totalChips()))
            let actionFlag = RoundAction.PASSIVE
            if (player.stack() === 0) {
                actionFlag |= RoundAction.LEAVE
            }
            this._round.actionTaken(actionFlag)
        } else {
            assert(action === Action.LEAVE)
            this._round.actionTaken(RoundAction.LEAVE)
        }
    }

    private isRaiseValid(bet: Chips): boolean {
        const player = this._players[this._round.playerToAct()]
        assert(player !== null)
        const playerChips = player.stack() + player.betSize()
        const minBet = this._biggestBet + this._minRaise
        if (playerChips > this._biggestBet && playerChips < minBet) {
            return bet === playerChips
        }
        return bet >= minBet && bet <= playerChips
    }
}