import NextAuth from "next-auth";

import { authOptions } from "@/auth";

// Handler padrão do NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
