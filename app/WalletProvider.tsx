"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

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
        network: Network.TESTNET,        // ← This is the correct way
        aptosConnect: { 
          dappName: "Linker" 
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}