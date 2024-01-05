export class Game {
    id: string;
    player1: string;
    player1Name: string;
    player2: string;
    player2Name: string;
    paddle1Y: number;
    paddle2Y: number;
    ballX: number;
    ballY: number;
    score1: number;
    score2: number;


    constructor(id: string) {
        this.id = id;
        this.player1 = "";
        this.player1Name = "";
        this.player2 = "";
        this.player2Name = "";
        this.paddle1Y = 0;
        this.paddle2Y = 0;
        this.ballX = 0;
        this.ballY = 0;
        this.score1 = 0;
        this.score2 = 0;
    }

    movePaddle(player: string, direction: string) {
        if (player == this.player1) {
            if (direction == "moveUp") {
                this.paddle1Y -= 10;
            } else {
                this.paddle1Y += 10;
            }
        }
        else if (player == this.player2) {
            if (direction == "moveUp") {
                this.paddle2Y -= 10;
            } else {
                this.paddle2Y += 10;
            }
        }
    }

    update() {
        return (this);
    }

    reset() {
        this.paddle1Y = 0;
        this.paddle2Y = 0;
        this.ballX = 0;
        this.ballY = 0;
    }
}
