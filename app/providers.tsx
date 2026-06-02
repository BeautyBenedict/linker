"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShelbyClientProvider } from "@shelby-protocol/react";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { useMemo } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const shelbyClient = useMemo(
    () =>
      new ShelbyClient({
        network: Network.SHELBYNET,
        apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY!,
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect
        dappConfig={{ network: "shelbynet" as any }}
        optInWallets={["Petra"]}
      >
        <ShelbyClientProvider client={shelbyClient}>
          {children}
        </ShelbyClientProvider>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}