export declare const auth: import('better-auth').Auth<{
  database: (
    options: import('better-auth').BetterAuthOptions
  ) => import('better-auth').DBAdapter<import('better-auth').BetterAuthOptions>;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  socialProviders: {
    google: {
      clientId: string;
      clientSecret: string;
      redirectURI: string | undefined;
    };
  };
  session: {
    expiresIn: number;
    updateAge: number;
    cookieCache: {
      enabled: true;
      maxAge: number;
    };
  };
}>;
export type Auth = typeof auth;
//# sourceMappingURL=auth.d.ts.map
