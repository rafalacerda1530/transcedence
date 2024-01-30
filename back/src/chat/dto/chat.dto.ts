import { GroupStatus } from "@prisma/client";
import { IsNotEmpty, IsOptional, MaxLength } from "class-validator";

// type: public private protect
export class CreateGroupDto {
    @IsNotEmpty({ message: "Insert a valid type" })
    type: GroupStatus;
    @IsNotEmpty({ message: "Insert a valid type" })
    @MaxLength(20, { message: "Group name should be in max 20 characters" })
    groupName: string;
    @IsOptional()
    password?: string;
    @IsNotEmpty({ message: "Insert a valid owner" })
    ownerUsername: string;
}

export class GroupActionsDto {
    @IsNotEmpty({ message: "Insert a valid user" })
    username: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
    @IsOptional()
    password?: string;
}

export class InviteToGroupDto {
    @IsNotEmpty({ message: "Insert a valid user" })
    admUsername: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    invitedUsername: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
}

// TODO colocar nomes mais abrasivos
export class SetAdm {
    @IsNotEmpty({ message: "Insert a valid user" })
    admUsername: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    userToBeAdm: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
}

export class PassowordChannel {
    @IsNotEmpty({ message: "Insert a valid user" })
    ownerUsername: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
    @IsOptional()
    password?: string;

}

export class SetOnlyInvite {
    @IsNotEmpty({ message: "Insert a valid user" })
    ownerUsername: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
}
