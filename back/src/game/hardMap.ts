import { GameMode } from "./gameMode";

interface GameDto {
	player1Name: string;
	player2Name: string;
	paddle1Y: number;
	paddle2Y: number;
	ballX: number;
	ballY: number;
	score1: number;
	score2: number;
}

export class HardMode implements GameMode {
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

	private static readonly INITIAL_PADDLE_Y = 45;
	private static readonly INITIAL_BALL_X = 50;
	private static readonly INITIAL_BALL_Y = 49.5;
	private static readonly INITIAL_BALL_SPEED = 0.25;
	private static readonly BALL_SPEED_LIMIT_X = 1.2;
	private static readonly BALL_SPEED_LIMIT_Y = 0.8;
	private static readonly BALL_SPEED_INCREASE_FACTOR = 0.1;
	private static readonly PADDLE_SPEED_FACTOR = 0.4;
	private static readonly BALL_MIN_X = 22;
	private static readonly BALL_MAX_X = 77.8;

	constructor(id: string) {
		this.id = id;
		this.player1 = "";
		this.player1Name = "";
		this.player2 = "";
		this.player2Name = "";
		this.paddle1Y = HardMode.INITIAL_PADDLE_Y;
		this.paddle2Y = HardMode.INITIAL_PADDLE_Y;
		this.paddle1SpeedY = 0;
		this.paddle2SpeedY = 0;
		this.ballX = HardMode.INITIAL_BALL_X;
		this.ballY = HardMode.INITIAL_BALL_Y;
		this.score1 = 0;
		this.score2 = 0;
		this.ready = 0;
		if (Math.random() < 0.5)
			this.ballSpeedX = HardMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedX = -HardMode.INITIAL_BALL_SPEED;
		if (Math.random() < 0.5)
			this.ballSpeedY = HardMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedY = -HardMode.INITIAL_BALL_SPEED;
	}

	createGameDto(): GameDto {
		return {
			player1Name: this.player1Name,
			player2Name: this.player2Name,
			paddle1Y: this.paddle1Y,
			paddle2Y: this.paddle2Y,
			ballX: this.ballX,
			ballY: this.ballY,
			score1: this.score1,
			score2: this.score2,
		};
	}

	update() {
		const ballSpeedXNegative = this.ballSpeedX < 0;
		const ballSpeedYNegative = this.ballSpeedY < 0;
		const ballHitPaddle1 = this.ballX <= 23.8 && this.ballX >= 22.4 && this.ballY >= (this.paddle1Y - 1) && this.ballY <= this.paddle1Y + 10;
		const ballHitPaddle2 = this.ballX <= 76.8 && this.ballX >= 75.6 && this.ballY >= (this.paddle2Y - 1) && this.ballY <= this.paddle2Y + 10;
		const ballUnderSpeedLimit = this.ballSpeedY >= -HardMode.BALL_SPEED_LIMIT_Y && this.ballSpeedY <= HardMode.BALL_SPEED_LIMIT_Y;

		if (ballSpeedXNegative) {
			if (ballHitPaddle1) {
				this.ballSpeedX = this.ballSpeedX > -HardMode.BALL_SPEED_LIMIT_X ? - (this.ballSpeedX + this.ballSpeedX * HardMode.BALL_SPEED_INCREASE_FACTOR) : HardMode.BALL_SPEED_LIMIT_X;
				if (ballUnderSpeedLimit) this.ballSpeedY += (this.paddle1SpeedY * HardMode.PADDLE_SPEED_FACTOR);
                else this.ballSpeedY < 0 ? this.ballSpeedY = -HardMode.BALL_SPEED_LIMIT_Y : this.ballSpeedY = HardMode.BALL_SPEED_LIMIT_Y;
				this.ballX = 23.8;
			} else if (this.ballX < HardMode.BALL_MIN_X) {
				this.score2++;
				this.reset();
			}
		} else {
			if (ballHitPaddle2) {
				this.ballSpeedX = this.ballSpeedX < HardMode.BALL_SPEED_LIMIT_X ? - (this.ballSpeedX + this.ballSpeedX * HardMode.BALL_SPEED_INCREASE_FACTOR) : -HardMode.BALL_SPEED_LIMIT_X;
				if (ballUnderSpeedLimit) this.ballSpeedY += (this.paddle2SpeedY * HardMode.PADDLE_SPEED_FACTOR);
                else this.ballSpeedY < 0 ? this.ballSpeedY = -HardMode.BALL_SPEED_LIMIT_Y : this.ballSpeedY = HardMode.BALL_SPEED_LIMIT_Y;
				this.ballX = 75.6;
			} else if (this.ballX > HardMode.BALL_MAX_X) {
				this.score1++;
				this.reset();
			}
		}

		if (ballSpeedYNegative) {
			if (this.ballY <= 24) {
				this.ballSpeedY = -this.ballSpeedY;
				this.ballY = 24;
			}
		} else if (this.ballY >= 73.8) {
			this.ballSpeedY = -this.ballSpeedY;
			this.ballY = 73.8;
		}

		this.ballX += this.ballSpeedX;
		this.ballY += this.ballSpeedY;
	}

	reset() {
		this.paddle1Y = HardMode.INITIAL_PADDLE_Y;
		this.paddle2Y = HardMode.INITIAL_PADDLE_Y;
		this.ballX = HardMode.INITIAL_BALL_X;
		this.ballY = HardMode.INITIAL_BALL_Y;
		if (Math.random() < 0.5)
			this.ballSpeedX = HardMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedX = -HardMode.INITIAL_BALL_SPEED;
		if (this.ballSpeedX < 0)
			this.ballSpeedY = -HardMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedY = HardMode.INITIAL_BALL_SPEED;
	}
}
