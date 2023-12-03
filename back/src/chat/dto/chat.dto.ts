import { GroupStatus } from "@prisma/client";
import { IsNotEmpty, IsOptional, MaxLength } from "class-validator";

// type: public private protect
export class CreateGroupDto {
    @IsNotEmpty({ message: "Insert an valid type" })
    type: GroupStatus;
    @IsNotEmpty({ message: "Insert an valid type" })
    @MaxLength(20, { message: "Group name should be in max 20 characters" })
    name: string;
    @IsOptional()
    password?: string;
    @IsNotEmpty({ message: "Insert an valid owner" })
    ownerName: string;
}

export class ChatActionsDto {
    @IsNotEmpty({ message: "Insert an valid user" })
    username: string;
    @IsNotEmpty({ message: "Insert an valid chat name" })
    chatName: string;
}
