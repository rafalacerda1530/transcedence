
export interface UserMessage {
    login: string;
}

export interface messageToServer {
    user: string;
    message: string;
}

export interface messageToClient {
    id: Number;
    user: UserMessage;
    message: string;
    date: Date;
}
