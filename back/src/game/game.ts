import { GameMode } from "./gameMode";
import { HardMode } from "./hardMap";
import { NormalMode } from "./normalMap";
import { StickBallMode } from "./stickBall";

export class Game {
    gameMode: GameMode;

    constructor(id: string, mode: string) {
        switch (mode) {
            case "normal":
                this.gameMode = new NormalMode(id);
                break;
            case "hard":
                this.gameMode = new HardMode(id);
                break;
            case "stick":
                this.gameMode = new StickBallMode(id);
                break;
        }
    }
}
