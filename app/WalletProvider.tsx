"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

// No need to import petra-plugin-wallet-adapter — Petra is built into the
// modern wallet-adapter-react via optInWallets. This eliminates all the
// peer-dependency conflicts with the old "aptos" v1 package.
export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      optInWallets={["Petra"]}
      dappConfig={{ network: "shelbynet" as any, aptosConnect: { dappName: "Linker" } }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}