"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      optInWallets={["Petra"]}
      dappConfig={{
        network: "testnet",           // Shelbynet uses testnet under the hood
        aptosConnect: { 
          dappName: "Linker" 
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}