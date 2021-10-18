import './App.css';
import React from "react";
import WalletConnect from "@walletconnect/client";
import { registry } from './registry';
import {
  isMobile,
  formatIOSMobile,
  formatMobileRegistry,
} from "@walletconnect/browser-utils";

let connector = new WalletConnect({
  bridge: "https://bridge.walletconnect.org", // Replace with custom
});

function App() {
  const [uri, setUri] = React.useState([]);
  const [links, setLinks] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);

  const init = () => {
    const uri = connector.uri;
    setUri(uri);
    createLinks();
  }
  const createWalletConnectSession = async () => {
    if (!connector.connected) {
      await connector.createSession();
      init();
    } else {
      init();
    }

    connector.on("connect", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log('connect payload', payload)

      const { accounts, /* chainId */ } = payload.params[0];
      setAccounts(accounts);
    });

    connector.on("session_update", (error, payload) => {
      if (error) {
        throw error;
      }

      setAccounts(payload.params[0].accounts);
    });

    connector.on("disconnect", (error, payload) => {
      if (error) {
        throw error;
      }
      // Delete connector
      connector = null;
    });
  }

  const createLinks = () => {
    const mobile = isMobile();
    const platform = mobile ? "mobile" : "desktop";
    const formattedLinks = formatMobileRegistry(registry, platform);
    setLinks(formattedLinks);
  }

  return (
    <div className="app">
      <div className="container">
        <div className="demo connect">
          {!accounts.length ? (
              <button onClick={createWalletConnectSession}>Start WalletConnect Session</button>
            ) : (
              <p>Connected to: {accounts[0]}</p>
            )
          }
        </div>
        <div className="demo uris">
          {
            links.length ? (
              <div>
                <p>URI List</p>
                <ul>
                  {links.map(link=><li key={link.name}><a href={formatIOSMobile(uri, link)} target="_blank" rel="noopener noreferrer">{link.name}</a></li>)}
                </ul>
              </div>): null
          }
        </div>
      </div>
    </div>
  );
}

export default App;
