
export interface messageToServer {
    user: string;
    message: string;
}

export interface messageToClient {
    id?: number;
    chat?: string;
    user: string;
    message: string;
    date: Date;
}
