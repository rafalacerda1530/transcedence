export interface GameMode {
	player1: string;
	player1Name: string;
	player2: string;
	player2Name: string;
	score1: number;
    score2: number;
	ready: number;

	update(): void;
	reset(): void;
	createGameDto(): any;
}
