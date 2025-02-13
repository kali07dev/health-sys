import { SessionProvider } from "next-auth/react";

import { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps & { pageProps: { session: any } }) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
          {/*  app components */}
      <Component {...pageProps} />
      </QueryClientProvider>    
    </SessionProvider>
  );
}

export default MyApp;