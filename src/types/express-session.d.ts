import 'express-session';

//Not sure why this is needed but you probably shouldn't touch it
declare module 'express-session' {
	interface SessionData {
		user?: { username: string };
		csrfToken?: string;
	}
} 