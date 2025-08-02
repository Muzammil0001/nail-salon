import NextAuth, {
	DefaultSession
} from "next-auth"

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			/** The user's postal address. */
			roleIds: int[],
			address: string,
			subscription_id: int | null,
			merchant_id?:number| null ,
			languages?:any[]| null,
			partner_id:number| null,
			affiliate_id:number| null
			userType:string,
			access_rights:any,
			language:string,
			id: string,
			username: string,
            roles: string[],
            password_changed: boolean,
            access_rights: string[],
            companies: int[],
            locations: any[],
            navigation: any[],
            selected_location_id: int | null,
            selected_company_id: int | null,
		} & DefaultSession["user"]
	}

	/**
	 * The shape of the user object returned in the OAuth providers' `profile` callback,
	 * or the second parameter of the `session` callback, when using a database.
	 */
	interface User {}
	/**
	 * Usually contains information about the provider being used
	 * and also extends `TokenSet`, which is different tokens returned by OAuth Providers.
	 */
	interface Account {}
	/** The OAuth profile returned from your provider */
	interface Profile {}

	/** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
	interface JWT {
		/** OpenID ID Token */
		idToken ? : string
	}
}
