export class GameDto {
    id: string;
    player1: string;
    player1Name: string;
    player2: string;
    player2Name: string;
    paddle1Y: number;
    paddle2Y: number;
	paddle1SpeedY: number;
    paddle2SpeedY: number;
    ballX: number;
    ballY: number;
    ballSpeedX: number;
    ballSpeedY: number;
    score1: number;
    score2: number;
    ready: number;


    constructor(id: string) {
        this.id = id;
        this.player1 = "";
        this.player1Name = "";
        this.player2 = "";
        this.player2Name = "";
        this.paddle1Y = 45;
        this.paddle2Y = 45;
		this.paddle1SpeedY = 0;
		this.paddle2SpeedY = 0;
        this.ballX = 50;
        this.ballY = 49;
        this.score1 = 0;
        this.score2 = 0;
        this.ready = 0;
        if (Math.random() < 0.5)
            this.ballSpeedX = 0.25;
        else
            this.ballSpeedX = -0.25;
        if (Math.random() < 0.5)
            this.ballSpeedY = 0.25;
        else
            this.ballSpeedY = -0.25;
    }

    update() {
        if (this.ballSpeedX < 0) {
            if (this.ballX < 24 && this.ballX > 23 && this.ballY >= this.paddle1Y && this.ballY < this.paddle1Y + 10){
                this.ballSpeedX = - (this.ballSpeedX + this.ballSpeedX * 0.1);
				this.ballSpeedY += (this.paddle1SpeedY * 0.2)
				this.ballX = 24;
            }
            if (this.ballX < 20) {
                    this.score2++;
                    this.reset();
            }
        }
        else {
            if (this.ballX > 75 && this.ballX < 76 && this.ballY >= this.paddle2Y && this.ballY < this.paddle2Y + 10){
				this.ballSpeedX = - (this.ballSpeedX + this.ballSpeedX * 0.1);
				this.ballSpeedY += (this.paddle2SpeedY * 0.5)
				this.ballX = 75;
			}
            if (this.ballX > 78) {
                this.score1++;
                this.reset();
            }
        }

        if (this.ballSpeedY < 0) {
            if (this.ballY < 24){
				this.ballSpeedY = -this.ballSpeedY;
				this.ballY = 24;
			}
        }
        else {
            if (this.ballY > 74){
				this.ballSpeedY = -this.ballSpeedY;
				this.ballY = 74;
			}
        }
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;
    }

    reset() {
        this.paddle1Y = 45;
        this.paddle2Y = 45;
        this.ballX = 50;
        this.ballY = 49;
        if (Math.random() < 0.5)
            this.ballSpeedY = 0.25;
        else
            this.ballSpeedY = -0.25;
        if (this.ballSpeedX < 0)
            this.ballSpeedX = -0.25;
        else
            this.ballSpeedX = 0.25;
    }
}
