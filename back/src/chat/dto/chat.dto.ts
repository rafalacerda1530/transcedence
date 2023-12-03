import { GroupStatus } from "@prisma/client";
import { IsNotEmpty, IsOptional, MaxLength } from "class-validator";

// type: public private protect
export class CreateGroupDto {
    @IsNotEmpty({ message: "Insert an valid type" })
    type: GroupStatus;
    @IsNotEmpty({ message: "Insert an valid type" })
    @MaxLength(20, { message: "Group name should be in max 20 characters" })
    groupName: string;
    @IsOptional()
    password?: string;
    @IsNotEmpty({ message: "Insert an valid owner" })
    ownerUsername: string;
}

export class GroupActionsDto {
    @IsNotEmpty({ message: "Insert an valid user" })
    username: string;
    @IsNotEmpty({ message: "Insert an valid chat name" })
    groupName: string;
}
