"use client";

import { PrivyClientConfig, PrivyProvider } from "@privy-io/react-auth";
import { sepolia, polygonAmoy, polygon, fuse } from "viem/chains";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "wagmi";

const handleLogin = (user: any) => {
    console.log(`User ${user.id} logged in!`);
};

const wagmiConfig = createConfig({
    chains: [fuse],
    transports: {
        [fuse.id]: http(),
    },
});

const queryClient = new QueryClient();

const privyConfig: PrivyClientConfig = {
    embeddedWallets: {
        createOnLogin: "users-without-wallets",
        noPromptOnSignature: false,
    },
    loginMethods: ["wallet", "email", "google"],
    appearance: {
        showWalletLoginFirst: true,
        theme: "light",
        accentColor: "#676FFF",
        logo: "https://jiffyscan-frontend.vercel.app/images/Frame%2021.svg",
    },
    supportedChains: [
        sepolia,
        polygonAmoy,
        polygon,
        fuse,
        // Add any other supported chains here
    ],
};

export const PrivyProviderA = ({ children }: { children: React.ReactNode }) => {
    return (
        <PrivyProvider
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
            onSuccess={handleLogin}
            config={privyConfig}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
                    {children}
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
};
