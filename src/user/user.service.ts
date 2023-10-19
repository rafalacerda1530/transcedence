import { Body, Injectable } from '@nestjs/common';
import { checkPrime } from 'crypto';

@Injectable()
export class UserService {
    user: any[] = [ { email: 'rafa@tesdte.com', user: 'rafa', senha: 'teste' },  { email: 'mateus@tesdte.com', user: 'matheus', senha: 'teste' }, { email: 'luiz@tesdte.com', user: 'luiz', senha: 'teste' }];
    createAccount(body: any){
        const emailProcurado = body['email'];
        const emailJaExiste = this.user.some((pessoa) => pessoa['email'] === emailProcurado);

        const userProcurado = body['user'];
        const userExiste = this.user.some((pessoa) => pessoa['user'] === userProcurado);
        
        if (emailJaExiste || userExiste){
            return 'Não foi possível cadastrar, usuário já existe'
        }
        this.user.push(body)
        console.log('usuário inserido')
        console.log(this.user)
    }

    login(body: any){
        const usuarioProcurado = body['user'];
        const usuarioCadastrado = this.user.some((pessoa) => pessoa['user'] === usuarioProcurado);

        const senhaProcurada = body['senha'];
        const senhaCadastrada = this.user.some((pessoa) => pessoa['senha'] === senhaProcurada);
        
        if (usuarioCadastrado && senhaCadastrada){
            return 'Logado'
        }
        console.log('Usuário nmão cadastrado')
    }
}
