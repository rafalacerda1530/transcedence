
//TODO:later-- REMOVER ? quando direct estiver pronto
export interface messageToServer {
    groupName?: string;
    username: string;
    message: string;
}

export interface messageToClient {
    id?: number;
    groupName?: string;
    username: string;
    message: string;
    date: Date;
}
