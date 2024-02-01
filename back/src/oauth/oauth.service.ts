import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OauthService {
    constructor(
        private readonly httpService: HttpService,
        private config: ConfigService,
    ) {}
    private readonly UID = this.config.get('API_INTRA_UID');
    private readonly SECRET = this.config.get('API_INTRA_SECRET');
    private readonly site = 'https://api.intra.42.fr';

    async getAccessToken(code: string) {
        const body = {
            grant_type: 'authorization_code',
            client_id: this.UID,
            client_secret: this.SECRET,
            redirect_uri: 'http://localhost:3000/callBack',
            code: code,
        };

        const accessToken = await this.httpService.axiosRef
            .post(this.site + '/oauth/token', body)
            .then((res) => {
                return res.data.access_token;
            })
            .catch((error) => {
                console.log(error);
                throw new BadRequestException();
            });

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };

        const response2 = await this.httpService.axiosRef
            .get(this.site + '/v2/me', config)
            .then((res) => {
                return res.data;
            })
            .catch((error) => {
                console.log(error);
            });
        return response2;
    }
}
