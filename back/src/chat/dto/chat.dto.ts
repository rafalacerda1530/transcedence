import { GroupStatus } from "@prisma/client";
import { IsNotEmpty, IsNumber, IsOptional, MaxLength } from "class-validator";

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

export class SetAdm {
    @IsNotEmpty({ message: "Insert a valid user" })
    admUsername: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    targetUsername: string;
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

export class KickUser {
    @IsNotEmpty({ message: "Insert a valid user" })
    admUsername: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    targetUsername: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
}

export class BanUser {
    @IsNotEmpty({ message: "Insert a valid user" })
    admUsername: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    targetUsername: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
    @IsOptional()
    @IsNumber()
    banDuration?: number
}

export class MuteUser {
    @IsNotEmpty({ message: "Insert a valid user" })
    admUsername: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    targetUsername: string;
    @IsNotEmpty({ message: "Insert a valid chat name" })
    groupName: string;
    @IsOptional()
    @IsNumber()
    muteDuration?: number
}

export class BlockUser {
    @IsNotEmpty({ message: "Insert a valid user" })
    userUsername: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    targetUsername: string;
}

export class CreateDmGroup {
    @IsNotEmpty({ message: "Insert a valid user" })
    userA: string;
    @IsNotEmpty({ message: "Insert a valid user" })
    userB: string;
    @IsNotEmpty({ message: "Insert a valid type" })
    @MaxLength(20, { message: "Group name should be in max 20 characters" })
    groupName: string;
    @IsNotEmpty({ message: "Insert a valid type" })
    type: GroupStatus;
}

export class DeleteDmGroup {
    @IsNotEmpty({ message: "Insert a valid group name" })
    groupName: string;
}

export class GetMembers {
    @IsNotEmpty({ message: "Insert a valid group name" })
    groupName: string;
    @IsNotEmpty({ message: "Insert a valid type" })
    type: GroupStatus;
}

export class JoinGroupDto {
    @IsNotEmpty({ message: "Insert a valid group name" })
    groupName: string;
    @IsNotEmpty({ message: "Insert a valid type" })
    user: string
    type: GroupStatus;
}
