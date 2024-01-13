import { IsEmail, IsNotEmpty, IsString, IsOptional  } from 'class-validator';

export class AuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsOptional()
  profileImage: string; // Campo para a imagem de perfil (opcional)
}

export class SigninDto {

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  user: string;

}

export class EditDto {
	@IsOptional()
	userId: number; // Campo para userId (opcional)

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	user: string;

	@IsString()
	@IsOptional()
	profileImage: string; // Campo para a imagem de perfil (opcional)
}