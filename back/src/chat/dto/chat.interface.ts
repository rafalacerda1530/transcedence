
export interface messageToServer {
    groupName: string;
    username: string;
    message: string;
}

export interface gameInviteToServer {
    groupName: string;
    username: string;
    gameType: string;
}

export interface messageToClient {
    id?: number;
    groupName?: string;
    username: string;
    message: string;
    date: Date;
}

export interface gameInviteClient {
    id?: number;
    groupName?: string;
    username: string;
    gameInvite: boolean;
    date: Date;
}
