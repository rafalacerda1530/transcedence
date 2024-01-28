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

export class StickBallMode implements GameMode {
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
	ballSticking: boolean = false;
	stickTime: number = 0;
	stickOffsetY: number = 0;

	private static readonly INITIAL_PADDLE_Y = 45;
	private static readonly INITIAL_BALL_X = 50;
	private static readonly INITIAL_BALL_Y = 49.5;
	private static readonly INITIAL_BALL_SPEED = 0.25;
	private static readonly BALL_SPEED_LIMIT_X = 1.2;
	private static readonly BALL_SPEED_LIMIT_Y = 0.8;
	private static readonly BALL_SPEED_INCREASE_FACTOR = 0.1;
	private static readonly PADDLE_SPEED_FACTOR = 0.02;
	private static readonly BALL_MIN_X = 22;
	private static readonly BALL_MAX_X = 77.8;

	constructor(id: string) {
		this.id = id;
		this.player1 = "";
		this.player1Name = "";
		this.player2 = "";
		this.player2Name = "";
		this.paddle1Y = StickBallMode.INITIAL_PADDLE_Y;
		this.paddle2Y = StickBallMode.INITIAL_PADDLE_Y;
		this.paddle1SpeedY = 0;
		this.paddle2SpeedY = 0;
		this.ballX = StickBallMode.INITIAL_BALL_X;
		this.ballY = StickBallMode.INITIAL_BALL_Y;
		this.score1 = 0;
		this.score2 = 0;
		this.ready = 0;
		if (Math.random() < 0.5)
			this.ballSpeedX = StickBallMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedX = -StickBallMode.INITIAL_BALL_SPEED;
		if (Math.random() < 0.5)
			this.ballSpeedY = StickBallMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedY = -StickBallMode.INITIAL_BALL_SPEED;
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

	releaseBall(id: string) {
		if (id === this.player2 && this.ballX > 70) {
			this.ballSticking = false;
			this.stickTime = 0;
		}
		if (id === this.player1 && this.ballX < 30) {
			this.ballSticking = false;
			this.stickTime = 0;
		}
	}

	update() {
		const ballSpeedXNegative = this.ballSpeedX < 0;
		const ballSpeedYNegative = this.ballSpeedY < 0;
		const ballUnderSpeedLimit = this.ballSpeedY > -StickBallMode.BALL_SPEED_LIMIT_Y && this.ballSpeedY < StickBallMode.BALL_SPEED_LIMIT_Y;

		this.ballX += this.ballSpeedX;
		this.ballY += this.ballSpeedY;

		const ballHitPaddle1 = this.ballX <= 23.8 && this.ballX >= 22.4 && this.ballY >= (this.paddle1Y - 1) && this.ballY <= this.paddle1Y + 10;
		const ballHitPaddle2 = this.ballX <= 76.8 && this.ballX >= 75.6 && this.ballY >= (this.paddle2Y - 1) && this.ballY <= this.paddle2Y + 10;

		if (this.ballSticking) {
			this.stickTime += 1 / 60;
			if (this.stickTime >= 2) {
				this.ballSticking = false;
				this.stickTime = 0;
				return;
			}
			if (this.ballX > 70) {
				this.ballX = 75.6;
				this.ballY = this.paddle2Y + this.stickOffsetY;
				if (this.paddle2SpeedY <= 0 && this.ballSpeedY > 0) this.ballSpeedY = -0.1;
				if (this.paddle2SpeedY > 0 && this.ballSpeedY < 0) this.ballSpeedY = 0.1;
				if (ballUnderSpeedLimit) this.ballSpeedY += (this.paddle2SpeedY * StickBallMode.PADDLE_SPEED_FACTOR);
				else this.ballSpeedY < 0 ? this.ballSpeedY = -StickBallMode.BALL_SPEED_LIMIT_Y : this.ballSpeedY = StickBallMode.BALL_SPEED_LIMIT_Y;
				return;
			}
			this.ballX = 23.8;
			this.ballY = this.paddle1Y + this.stickOffsetY;
			if (this.paddle1SpeedY < 0 && this.ballSpeedY > 0) this.ballSpeedY = -0.1;
			if (this.paddle1SpeedY > 0 && this.ballSpeedY < 0) this.ballSpeedY = 0.1;
			if (ballUnderSpeedLimit) this.ballSpeedY += (this.paddle1SpeedY * StickBallMode.PADDLE_SPEED_FACTOR);
			else this.ballSpeedY < 0 ? this.ballSpeedY = -StickBallMode.BALL_SPEED_LIMIT_Y : this.ballSpeedY = StickBallMode.BALL_SPEED_LIMIT_Y;
			return;
		}

		if (ballSpeedXNegative) {
			if (ballHitPaddle1) {
				this.ballSpeedX = this.ballSpeedX > -StickBallMode.BALL_SPEED_LIMIT_X ? - (this.ballSpeedX + this.ballSpeedX * StickBallMode.BALL_SPEED_INCREASE_FACTOR) : StickBallMode.BALL_SPEED_LIMIT_X;
				this.ballX = 23.8;
				this.ballSpeedY = 0;
				this.ballSticking = true;
				this.stickOffsetY = this.ballY - this.paddle1Y;
			} else if (this.ballX < StickBallMode.BALL_MIN_X) {
				this.score2++;
				this.reset();
			}
		} else {
			if (ballHitPaddle2) {
				this.ballSpeedX = this.ballSpeedX < StickBallMode.BALL_SPEED_LIMIT_X ? - (this.ballSpeedX + this.ballSpeedX * StickBallMode.BALL_SPEED_INCREASE_FACTOR) : -StickBallMode.BALL_SPEED_LIMIT_X;
				this.ballX = 75.6;
				this.ballSpeedY = 0;
				this.ballSticking = true;
				this.stickOffsetY = this.ballY - this.paddle2Y;

			} else if (this.ballX > StickBallMode.BALL_MAX_X) {
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
	}

	reset() {
		this.paddle1Y = StickBallMode.INITIAL_PADDLE_Y;
		this.paddle2Y = StickBallMode.INITIAL_PADDLE_Y;
		this.ballX = StickBallMode.INITIAL_BALL_X;
		this.ballY = StickBallMode.INITIAL_BALL_Y;
		if (this.ballSpeedX > 0)
			this.ballSpeedX = StickBallMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedX = -StickBallMode.INITIAL_BALL_SPEED;
		if (Math.random() < 0.5)
			this.ballSpeedY = -StickBallMode.INITIAL_BALL_SPEED;
		else
			this.ballSpeedY = StickBallMode.INITIAL_BALL_SPEED;
	}
}
