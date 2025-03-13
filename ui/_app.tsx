import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth"; // Import Session type
import { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps & { pageProps: { session: Session | null } }) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {/* App components */}
        <Component {...pageProps} />
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default MyApp;