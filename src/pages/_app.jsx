import "@/styles/globals.css";
// import type { AppProps } from "next/app";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Suspense } from "react";

// export default function App({ Component, pageProps }: AppProps) {
export default function App({ Component, pageProps }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClerkProvider>
        <Component {...pageProps} />
      </ClerkProvider>
    </Suspense>
  );
}
