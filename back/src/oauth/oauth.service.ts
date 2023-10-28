import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class OauthService {
    constructor(private readonly httpService: HttpService) { }
    private readonly UID = 'u-s4t2ud-e4c7b8cd4fb31c268132af823110ef8bdbf90e2df97baf4c1fe0f4a6f93e110b';
    private readonly SECRET = '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';
    private readonly site = 'https://api.intra.42.fr';

    async getAccessToken(code: string) {
        const body = {
            grant_type: 'authorization_code',
            client_id: this.UID,
            client_secret: this.SECRET,
            redirect_uri: 'http://localhost:3000/callBack',
            code: code,
        }

        const accessToken = await this.httpService.axiosRef.post(this.site + '/oauth/token', body).then((res) => {
            return res.data.access_token
        }).catch((error) => {
            console.log(error)
            throw BadRequestException;
        });

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        }

        const response2 = await this.httpService.axiosRef.get(this.site + '/v2/me', config).then((res) => {
            return res.data
        }).catch((error) => {
            console.log(error)
        })
        //console.log(typeof response2['email'])
        return response2;
    }
}
