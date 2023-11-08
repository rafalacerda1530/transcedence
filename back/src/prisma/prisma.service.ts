import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ConfigService } from '@nestjs/config';


@Injectable()
export class PrismaService extends PrismaClient{
    findUnique(arg0: {}) {
        throw new Error("Method not implemented.");
    }
    constructor(config: ConfigService){
        super({
            datasources: {
                db: {
                    url: config.get('DATABASE_URL')
                }
            }
        })
    }
}
