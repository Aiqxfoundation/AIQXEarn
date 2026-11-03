import React, {
  FC,
  ReactNode,
  useMemo,
  useCallback,
  useState,
  createContext,
  useContext,
} from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-unsafe-burner';
import { WalletError, WalletNotReadyError, WalletConnectionError } from '@solana/wallet-adapter-base';
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletNoticeContextValue {
  notice: string | null;
  clearNotice: () => void;
  showNotice: (msg: string) => void;
}

const WalletNoticeContext = createContext<WalletNoticeContextValue>({
  notice: null,
  clearNotice: () => {},
  showNotice: () => {},
});

export const useWalletNotice = () => useContext(WalletNoticeContext);

interface Props {
  children: ReactNode;
  rpcUrl?: string;
}

export const WalletProvider: FC<Props> = ({
  children,
  rpcUrl = 'https://api.devnet.solana.com',
}) => {
  const endpoint = useMemo(() => rpcUrl, [rpcUrl]);
  const [notice, setNotice] = useState<string | null>(null);

  const clearNotice = useCallback(() => setNotice(null), []);
  const showNotice = useCallback((msg: string) => setNotice(msg), []);

  // Supported Wallets: Phantom, Solflare, and Sandbox / Burner Wallet for extension-less previews
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new UnsafeBurnerWalletAdapter(),
    ],
    []
  );

  // Error handling to prevent uncaught exceptions on missing extensions or denied local network access
  const onError = useCallback((error: WalletError, adapter?: any) => {
    const adapterName = adapter?.name || 'Wallet';
    console.warn(`[AIQX Wallet] Handled ${error.name} from ${adapterName}:`, error.message);

    if (error.name === 'WalletNotReadyError' || error instanceof WalletNotReadyError) {
      setNotice(
        `${adapterName} extension was not detected. Please install ${adapterName} from their official website, or select the "Burner Wallet" option to test immediately in this preview.`
      );
      return;
    }

    if (error.name === 'WalletConnectionError' || error instanceof WalletConnectionError) {
      if (error.message.includes('Local Network Access') || error.message.includes('permission denied')) {
        setNotice(
          'Local Network Access was restricted by the browser environment. Use the "Burner Wallet" option to connect and test without local network dependencies.'
        );
      } else {
        setNotice(`${adapterName} connection request was cancelled or declined.`);
      }
      return;
    }

    // Default notification for other wallet errors
    setNotice(error.message || 'An error occurred while connecting to the wallet.');
  }, []);

  return (
    <WalletNoticeContext.Provider value={{ notice, clearNotice, showNotice }}>
      <ConnectionProvider endpoint={endpoint}>
        <SolanaWalletProvider
          wallets={wallets}
          autoConnect={false}
          onError={onError}
        >
          <WalletModalProvider>{children}</WalletModalProvider>
        </SolanaWalletProvider>
      </ConnectionProvider>
    </WalletNoticeContext.Provider>
  );
};
