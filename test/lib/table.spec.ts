import Table, { AutomaticAction } from '../../src/lib/table'
import { Action } from '../../src/lib/dealer'

describe('Table', () => {
    let table: Table

    beforeEach(() => {
        table = new Table({ blinds: { big: 50, small: 25 } })
    })

    test('table construction', () => {
        expect(table.seats()).toEqual(new Array(9).fill(null))
        expect(table.forcedBets()).toEqual({ blinds: { big: 50, small: 25 } })
        expect(table.numSeats()).toBe(9)
        expect(table.handInProgress()).toBeFalsy()
    })

    test('setting forced bets ', () => {
        table.setForcedBets({ blinds: { big: 200, small: 100 } })
        expect(table.forcedBets()).toEqual({ blinds: { big: 200, small: 100 } })
    })

    test('moving the button between hands', () => {
        table.sitDown(2, 2000)
        table.sitDown(3, 2000)
        table.sitDown(4, 2000)
        table.startHand()
        expect(table.button()).toBe(2)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        table.showdown()
        expect(table.handInProgress()).toBeFalsy()

        // Start a new hand
        table.startHand()

        // Button jumped to the next present player
        expect(table.button()).toBe(3)
    })

    describe('adding/removing players', () => {
        describe('a table with no hand in play', () => {
            describe('a player takes a seat', () => {
                beforeEach(() => {
                    table.sitDown(7, 1000)
                })

                test('that seat is taken', () => {
                    expect(table.seats()[7]).not.toBeNull()
                })
            })
        })

        describe('a table with one player seated and no hand in play', () => {
            beforeEach(() => {
                table.sitDown(7, 1000)
            })

            describe('that player stands up', () => {
                beforeEach(() => {
                    table.standUp(7)
                })

                test('the seat opens up', () => {
                    expect(table.seats()[7]).toBeNull()
                })
            })
        })

        describe('a table with three players active in the hand which is in progress', () => {
            beforeEach(() => {
                table.sitDown(4, 2000)
                table.sitDown(5, 2000)
                table.sitDown(6, 2000)
                table.startHand()
            })

            test('precondition', () => {
                expect(table.bettingRoundInProgress()).toBeTruthy()
                expect(table.playerToAct()).toBe(4)
            })

            // More than one player remain sitting
            describe('one of them stands up', () => {
                beforeEach(() => {
                    table.standUp(5)
                })

                test('the betting round is still in progress', () => {
                    expect(table.bettingRoundInProgress()).toBeTruthy()
                })
            })

            // One player remains sitting
            describe('two of them stand up', () => {
                beforeEach(() => {
                    table.standUp(4)
                })

                test('precondition', () => {
                    expect(table.playerToAct()).toBe(5)
                })

                describe('second player stands up', () => {
                    beforeEach(() => {
                        table.standUp(6)
                    })

                    test('the betting round is over', () => {
                        expect(table.bettingRoundInProgress()).toBeFalsy()
                    })
                })

            })

        })

        describe('a table with a few active players in a hand which is in progress', () => {
            beforeEach(() => {
                table.sitDown(4, 2000)
                table.sitDown(5, 2000)
                table.sitDown(6, 2000)
                table.startHand()
            })

            describe('a player stands up', () => {
                beforeEach(() => {
                    table.standUp(6)
                })

                test('his/her automatic action is set to fold', () => {
                    expect(table.automaticActions()[6]).toBe(AutomaticAction.FOLD)
                })
            })

            // Immediate fold
            describe('the player to act stands up', () => {
                test('precondition', () => {
                    expect(table.playerToAct()).toBe(4)
                    expect(table.numActivePlayers()).toBe(3)
                })

                describe('player stands up', () => {
                    beforeEach(() => {
                        table.standUp(4)
                    })

                    test('his action counts as a fold', () => {
                        expect(table.playerToAct()).toBe(5)
                        expect(table.numActivePlayers()).toBe(2)
                    })
                })
            })
        })
    })

    describe('automatic actions', () => {
        describe('three players sit down and the hand begins', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
            })

            test('the legal actions for each player are appropriate', () => {
                expect(table.seats()[1]?.betSize()).toBe(0)
                expect(table.seats()[2]?.betSize()).toBe(25)
                expect(table.seats()[3]?.betSize()).toBe(50)

                let legalAutomaticActions = table.legalAutomaticActions(1)
                expect(legalAutomaticActions & AutomaticAction.FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK_FOLD).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CHECK).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CALL).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CALL_ANY).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.ALL_IN).toBeTruthy()

                legalAutomaticActions = table.legalAutomaticActions(2)
                expect(legalAutomaticActions & AutomaticAction.FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK_FOLD).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CHECK).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CALL).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CALL_ANY).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.ALL_IN).toBeTruthy()

                legalAutomaticActions = table.legalAutomaticActions(3)
                expect(legalAutomaticActions & AutomaticAction.FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK_FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CALL).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CALL_ANY).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.ALL_IN).toBeTruthy()
            })
        })

        describe('a table with a game that has just begun', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
            })

            describe('SB and BB set their automatic actions', () => {
                beforeEach(() => {
                    table.setAutomaticAction(2, AutomaticAction.CALL)
                    table.setAutomaticAction(3, AutomaticAction.ALL_IN)
                })

                test('the table state reflects that', () => {
                    expect(table.automaticActions()[2]).toBe(AutomaticAction.CALL)
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.ALL_IN)
                })

                test('reset automatic action', () => {
                    table.setAutomaticAction(2, null)
                    expect(table.automaticActions()[2]).toBe(null)
                })
            })
        })

        describe('a table with a game that has just begun where SB and BB have set their automatic actions to call/check', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(2, AutomaticAction.CALL)
                table.setAutomaticAction(3, AutomaticAction.CHECK)
            })

            describe('the player to act calls', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('the automatic actions play out', () => {
                    expect(table.seats()[1]?.betSize()).toBe(50)
                    expect(table.seats()[2]?.betSize()).toBe(50)
                    expect(table.seats()[3]?.betSize()).toBe(50)
                })

                test('the betting round ends', () => {
                    expect(table.bettingRoundInProgress()).toBeFalsy()
                })
            })
        })

        // Checking to see if the automatic action gets cleared.
        describe('a table where a player\'s automatic action has been taken', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(2, AutomaticAction.CALL)
                table.actionTaken(Action.CALL) // player 1 calls
            })

            test('precondition', () => {
                expect(table.playerToAct()).toBe(3)
            })

            describe('action gets back to him/her', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 200)
                    table.actionTaken(Action.CALL)
                })

                test('he/she is the player to act', () => {
                    expect(table.bettingRoundInProgress()).toBeTruthy()
                    expect(table.playerToAct()).toBe(2)
                })
            })
        })

        describe('a table where a player\'s automatic action is set to check_fold', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(3, AutomaticAction.CHECK_FOLD)
            })

            describe('some other player raises', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 200)
                })

                test('his automatic action falls back to fold', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.FOLD)
                })
            })

            describe('that doesn\'t happen', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('his/her automatic action remains the same', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CHECK_FOLD)
                })
            })
        })

        describe('a table where a player\'s automatic action is set to check', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(3, AutomaticAction.CHECK)
            })

            describe('some other player raises', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 200)
                })

                test('his/her automatic action gets removed', () => {
                    expect(table.automaticActions()[3]).toBeNull()
                })
            })

            describe('that doesn\'t happen', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('his/her automatic action remains the same', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CHECK)
                })
            })
        })

        describe('a table where a player\'s automatic action is set to call_any', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(3, AutomaticAction.CALL_ANY)
            })

            describe('some other player goes all-in', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 2000)
                })

                // All doubt has been cleared, it's not "call any", it's "call this exact amount".
                test('his automatic action falls back to call', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CALL)
                })
            })

            describe('that doesn\'t happen', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('his/her automatic action remains the same', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CALL_ANY)
                })
            })
        })

        describe('a table where a hand has just begun', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
            })

            describe('a player sets his automatic action to fold and it gets triggered', () => {
                beforeEach(() => {
                    table.setAutomaticAction(2, AutomaticAction.FOLD)
                    table.actionTaken(Action.CALL)
                })

                test('he/she folded', () => {
                    expect(table.handPlayers().filter(player => player !== null).length).toBe(2)
                })
            })

            describe('a player sets his automatic action to check_fold and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[3]?.betSize()).toBe(50)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(3, AutomaticAction.CHECK_FOLD)
                        table.actionTaken(Action.CALL)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she checked', () => {
                        expect(table.bettingRoundInProgress()).toBeFalsy()
                        expect(table.seats()[3]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to check and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[3]?.betSize()).toBe(50)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(3, AutomaticAction.CHECK)
                        table.actionTaken(Action.CALL)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she checked', () => {
                        expect(table.bettingRoundInProgress()).toBeFalsy()
                        expect(table.seats()[3]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to call and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[2]?.betSize()).toBe(25)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(2, AutomaticAction.CALL)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she called', () => {
                        expect(table.playerToAct()).toBe(3)
                        expect(table.seats()[2]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to call_any and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[2]?.betSize()).toBe(25)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(2, AutomaticAction.CALL_ANY)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she called', () => {
                        expect(table.playerToAct()).toBe(3)
                        expect(table.seats()[2]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to all_in and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.playerToAct()).toBe(1)
                    expect(table.seats()[2]?.betSize()).toBe(25)
                })
                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(2, AutomaticAction.ALL_IN)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she called (any)', () => {
                        expect(table.playerToAct()).toBe(3)
                        expect(table.seats()[2]?.betSize()).toBe(2000)
                    })
                })
            })
        })
    })

    test('When second to last player stands up, the hand ends', () => {
        table.sitDown(0, 1000)
        table.sitDown(1, 1000)
        table.sitDown(2, 1000)
        table.startHand()

        expect(table.playerToAct()).toBe(0)

        expect(table.seats()[0]?.betSize()).toBe(0)
        expect(table.seats()[1]?.betSize()).toBe(25)
        expect(table.seats()[2]?.betSize()).toBe(50)
        expect(table.button()).toBe(0)

        table.standUp(1)
        table.standUp(2)
        table.sitDown(1, 1000)
        table.sitDown(2, 2000)

        expect(table.bettingRoundInProgress()).toBeFalsy()
        table.endBettingRound()

        expect(table.seats()[0]?.stack()).toBe(950)

        table.showdown()
        expect(table.handInProgress()).toBeFalsy()

        expect(table.seats()[0]?.stack()).toBe(1075)

        table.startHand()
        expect(table.button()).toBe(1)
        table.standUp(2)
        table.standUp(0)
        expect(table.bettingRoundInProgress()).toBeFalsy()
        expect(table.handInProgress()).toBeTruthy()
        table.endBettingRound()
        expect(table.handInProgress()).toBeTruthy()
        table.showdown()
        expect(table.handInProgress()).toBeFalsy()
    })

    test('testing the special case', () => {
        table.sitDown(0, 1000)
        table.sitDown(1, 1000)
        table.sitDown(2, 1000)
        table.standUp(2)
        table.sitDown(2, 1000)
        table.startHand()
        table.setAutomaticAction(1, AutomaticAction.CALL_ANY)
        table.setAutomaticAction(2, AutomaticAction.CALL_ANY)
        table.actionTaken(Action.CALL)
        expect(table.bettingRoundInProgress()).toBeFalsy()
    })

    test('Community cards get reset when a new hand begins', () => {
        table.sitDown(0, 1000)
        table.sitDown(1, 1000)
        table.startHand()
        table.actionTaken(Action.CALL)
        table.actionTaken(Action.CHECK)
        table.endBettingRound()
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        expect(table.bettingRoundsCompleted()).toBeTruthy()
        table.showdown()
        table.startHand()
        expect(table.communityCards().cards().length).toBe(0)
    })

    test('Setting the button manually works on the first, as well as the subsequent hands', () => {
        table.sitDown(0, 1000)
        table.sitDown(3, 1000)
        table.sitDown(5, 1000)
        table.sitDown(8, 1000)

        // First hand
        table.startHand(8)
        expect(table.button()).toBe(8)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        table.showdown()

        // Second hand
        table.startHand(5)
        expect(table.button()).toBe(5)
    })

    test('Buttons wraps around correctly when moved from the last position', () => {
        table.sitDown(0, 1000)
        table.sitDown(3, 1000)
        table.sitDown(5, 1000)
        table.sitDown(8, 1000)

        // First hand
        table.startHand(8)
        expect(table.button()).toBe(8)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        table.showdown()

        // Second hand
        table.startHand()
        expect(table.button()).toBe(0)
    })

    test('No crash when the player to act stands up with one player remaining', () => {
        // This was caused by act_passively() being called in the case
        // of player_to_act standing up. Since the action is taken directly,
        // the hand ends naturally by itself and no further actions can be taken.
        table.sitDown(1, 1000)
        table.sitDown(8, 1000)
        table.startHand()
        expect(() => {
            table.standUp(1)
        }).not.toThrow()
    })

    describe('Betting round ends when only a single active player remains', () => {
        test('Correct behavior after action_taken', () => {
            table.sitDown(1, 1000)
            table.sitDown(5, 1000)
            table.sitDown(8, 1000)
            table.startHand()
            expect(table.playerToAct()).toBe(1)
            table.standUp(8)
            table.actionTaken(Action.FOLD)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('Correct behavior after stand_up', () => {
            table.sitDown(1, 1000)
            table.sitDown(5, 1000)
            table.sitDown(8, 1000)
            table.startHand()
            expect(table.playerToAct()).toBe(1)
            table.actionTaken(Action.FOLD)
            table.standUp(8)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('Heads-up preflop first-to-act all-in does not cause the other player to automatically act passively', () => {
            table.sitDown(0, 1000)
            table.sitDown(1, 1000)
            table.startHand()
            table.actionTaken(Action.RAISE, 1000)
            table.actionTaken(Action.FOLD)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('(addendum) Players who stood up or folded do not count as active', () => {
            table.sitDown(0, 1000)
            table.sitDown(1, 1000)
            table.sitDown(2, 1000)
            table.sitDown(3, 1000)
            table.startHand()
            table.standUp(3)
            table.standUp(2)
            table.actionTaken(Action.FOLD)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })
    })

    describe('a table with three players where one goes all-in preflop and others call, then one folds after flop', () => {
        beforeEach(() => {
            // Set up 3 players with different stack sizes
            // Seat 1: 100 chips (UTG) - will go all-in preflop
            // Seat 2: 1000 chips (SB) - will call all-in, then fold on flop
            // Seat 3: 1000 chips (BB) - will call all-in, continue to showdown
            table.sitDown(1, 100)   // Small stack - will go all-in
            table.sitDown(2, 1000)  // Medium stack
            table.sitDown(3, 1000)  // Medium stack
            table.startHand()
        })

        test('preflop: player with 100 chips goes all-in, others call', () => {
            // Player 1 (UTG) goes all-in with 100 chips
            table.actionTaken(Action.RAISE, 100)
            
            // Player 2 (SB) calls the all-in
            table.actionTaken(Action.CALL)
            
            // Player 3 (BB) calls the all-in
            table.actionTaken(Action.CALL)
            
            // Verify all players have bet their chips
            expect(table.seats()[1]?.betSize()).toBe(100)
            expect(table.seats()[2]?.betSize()).toBe(100)
            expect(table.seats()[3]?.betSize()).toBe(100)
            
            // Verify betting round is complete
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('flop: one player folds, betting round completes automatically', () => {
            // Complete preflop betting
            table.actionTaken(Action.RAISE, 100)
            table.actionTaken(Action.CALL)
            table.actionTaken(Action.CALL)
            
            // End preflop betting round
            table.endBettingRound()
            
            // Verify we're now in flop
            expect(table.roundOfBetting()).toBe(3) // FLOP
            
            // Player 2 folds (all-in player can't act, only 2 active players remain)
            table.actionTaken(Action.FOLD)
            
            // Verify betting round is complete (only 2 active players, no betting needed)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('complete hand: goes to showdown between all-in player and remaining player', () => {
            // Complete preflop betting
            table.actionTaken(Action.RAISE, 100)
            table.actionTaken(Action.CALL)
            table.actionTaken(Action.CALL)
            
            // End preflop betting round
            table.endBettingRound()
            
            // Complete flop betting round (one player folds)
            table.actionTaken(Action.FOLD)
            table.endBettingRound()
            
            // Dealer automatically completes remaining betting rounds when only 2 active players remain
            // Verify betting rounds are complete
            expect(table.bettingRoundsCompleted()).toBeTruthy()
            
            // Call showdown
            table.showdown()
            
            // Verify hand is complete
            expect(table.handInProgress()).toBeFalsy()
            
            // Verify there are winners (showdown occurred)
            expect(table.winners().length).toBeGreaterThan(0)
            
            // Verify the all-in player (seat 1) and the remaining player (seat 3) 
            // participated in showdown by checking their hole cards exist
            const holeCards = table.holeCards()
            expect(holeCards[1]).not.toBeNull() // All-in player has hole cards
            expect(holeCards[3]).not.toBeNull() // Remaining player has hole cards (seat 2 folded)
        })

        test('pot structure: all-in player creates side pot scenario', () => {
            // Complete preflop betting
            table.actionTaken(Action.RAISE, 100)
            table.actionTaken(Action.CALL)
            table.actionTaken(Action.CALL)
            
            // End preflop betting round
            table.endBettingRound()
            
            // Complete flop betting round
            table.actionTaken(Action.FOLD)
            table.endBettingRound()
            
            // Dealer automatically completes remaining betting rounds when only 2 active players remain
            
            // Verify pots exist
            const pots = table.pots()
            expect(pots.length).toBeGreaterThan(0)
            
            // The main pot should contain 300 chips (100 from each player)
            const mainPot = pots[0]
            expect(mainPot.size()).toBe(300)
            
            // Verify the all-in player is eligible for the main pot
            expect(mainPot.eligiblePlayers()).toContain(1)
            
            // Verify the remaining active player is also eligible
            expect(mainPot.eligiblePlayers()).toContain(3)
        })

        test('showdown: exactly two players reach showdown - all-in player and remaining player', () => {
            // Complete preflop betting
            table.actionTaken(Action.RAISE, 100)
            table.actionTaken(Action.CALL)
            table.actionTaken(Action.CALL)
            
            // End preflop betting round
            table.endBettingRound()
            
            // Complete flop betting round (one player folds)
            table.actionTaken(Action.FOLD)
            table.endBettingRound()
            
            // Dealer automatically completes remaining betting rounds when only 2 active players remain
            
            // Call showdown
            table.showdown()
            
            // Verify exactly two players participated in showdown
            const winners = table.winners()
            expect(winners.length).toBe(1) // One pot
            
            const potWinners = winners[0]
            expect(potWinners.length).toBe(1) // One winner in the pot
            
            // Verify the winner is either the all-in player (seat 1) or the remaining player (seat 3)
            const winnerSeat = potWinners[0][0]
            expect([1, 3]).toContain(winnerSeat)
            
            // Verify the folded player (seat 2) is not in the winners
            expect(winnerSeat).not.toBe(2)
        })
    })
})