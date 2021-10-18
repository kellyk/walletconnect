import './App.css';
import React from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";

//  Create WalletConnect Provider
const provider = new WalletConnectProvider({
  infuraId: "5e9fe0e68aae4428bda3d426f33124fa",
  rpc: {},
  qrcode: true,
  qrcodeModalOptions: {
    mobileLinks: [
      "rainbow",
      "metamask",
      "argent",
      "trust",
      "imtoken",
      "pillar",
    ],
  },
});

//  Create Web3 instance
const web3 = new providers.Web3Provider(provider);

function App() {
  const [wallets, setWallets] = React.useState();

  const setupWalletConnect = async () => {
    //  Enable session (triggers QR Code modal)
    await provider.enable();

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts: string[]) => {
      console.log({ accounts });
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId: number) => {
      console.log({ chainId });
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code: number, reason: string) => {
      console.log({code, reason});
    });

    provider.connector.on("display_uri", (err, payload) => {
      const uri = payload.params[0];
      console.log({uri})
      // CustomQRCodeModal.display(uri);
    });
    // console.log('set up wallet', web3.eth)
    // const balance = await web3.eth.getBalance("0x5dfDA382c5328BE2e1d9ac5bed17009d7b7F3571");
    // console.log('balance', balance);
    console.log('list accounts', web3.listAccounts);
    web3.listAccounts().then((accounts) => {
      console.log('accounts', accounts);
    });
  }
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts);

    } catch (error) {
      console.log(error)
    }
  }

  const getWalletList = async () => {
    const walletList = await fetch('https://registry.walletconnect.org/data/wallets.json');
    const list = await walletList.json();
    setWallets(list);
  }

  const renderWallets = () => {
    const ids = Object.keys(wallets);
    return ids.map(id => {
      const wallet = wallets[id];
      const imgSrc = `https://registry.walletconnect.org/logo/sm/${wallet.id}.jpeg`;
      return (
        <div key={id}>
          <img className="logo" src={imgSrc} alt="logo" />
          <span>{wallet.name}</span>
        </div>
      )
      }
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <button onClick={setupWalletConnect}>Connect wallet</button>
          { wallets ? <div className="walletList">{renderWallets()}</div> : null }
        </div>
      </header>
    </div>
  );
}

export default App;
