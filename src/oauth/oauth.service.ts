import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { access } from 'fs';

@Injectable()
export class OauthService {
    constructor(private readonly httpService: HttpService) { }
    private readonly UID = 'u-s4t2ud-e4c7b8cd4fb31c268132af823110ef8bdbf90e2df97baf4c1fe0f4a6f93e110b';
    private readonly SECRET = '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';
    private readonly site = 'https://api.intra.42.fr';

    async getAccessToken(code: string) {
        const body = {
            grant_type: 'client_credentials',
            client_id: this.UID,
            client_secret: this.SECRET,
            redirect_uri: 'https://google.com.br',
            code: code,
        }
        const accessToken = await this.httpService.axiosRef.post(this.site+'/oauth/token', body).then((res)=>{
            //console.log(res.data)
            return res.data.access_token
    }).catch((error)=>{
            console.log(error)
    });
    console.log(accessToken)
    const config = {headers: {
        Authorization: `Bearer ${accessToken}`,
      }}
    //const response2 = await this.httpService.axiosRef(this.site+'/v2/me', config).then((res)=>{
    //    //console.log(res.data)
    //    return res.data
    //}).catch((error)=>{
    //    console.log(error)
    //})
              
        
        //console.log(response2)
        return accessToken;
    }
}
