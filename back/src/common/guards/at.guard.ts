import { AuthGuard } from "@nestjs/passport";

export class AtGuard extends AuthGuard('jwt-access') {
	constructor() {
		super();
	}
}
