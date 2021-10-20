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

console.log(connector)

const urlParams = new URLSearchParams(window.location.search);
const client = urlParams.get('client');
const isAndroid = client && client.toLowerCase() === 'android';

function postAndroidMessage(parent, msg) {
  if (window.TFA && !window.TFA.postMessage(msg)) {
    parent.postMessage(msg);
  }
}

function postMessage (msg) {
  if (isAndroid) {
    postAndroidMessage(msg)
  } else {
    window.webkit.messageHandlers.MessageHandler.postMessage(msg);
  }
}

/**
 * To do:
 * 1. Make this run on pageload, with no UI components
 * 2. [DONE] Take a url param for Android vs iOS
 * 3. getWallet method --
 * 4. [DONE?] signMessage method
 * 5. Perform and relay sign message request
 * 6. Android should only return one link
 * 7. How to deal with open connection? Does not trigger an event
 */

function App() {
  const [uri, setUri] = React.useState([]);
  const [links, setLinks] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);

  const createWalletConnectSession = async () => {
    if (connector.connected) {
      await connector.killSession();
      await connector.createSession();
    } else {
      await connector.createSession();
      const uri = connector.uri;
      setUri(uri);
      createLinks();
      getiOSLinks(uri);
    }

    connector.on("connect", (error, payload) => {
      if (error) {
        throw error;
      }
      console.log('connected')

      const { accounts } = payload.params[0];
      setAccounts(accounts);
      postMessage({
        type: 'SessionConnected',
        account: accounts[0]
      })
    });

    connector.on("session_update", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log('update')

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

  const signMessage = (msg) => {
    if (!connector) {
      throw new Error(`connector hasn't been created yet`);
    }

    connector
      .signPersonalMessage([msg, connector.accounts[0]])
      .then(async result => {
        // Returns message signature
        await connector.killSession();

        const msg = {
          type: 'Signature',
          signature: result
        };
        postMessage(msg);
        console.log('posted message', msg);
      })
      .catch(error => {
        // Error returned when rejected
        console.error(error); // eslint-disable-line
      });
  }

  const createLinks = () => {
    const formattedLinks = formatMobileRegistry(registry, isMobile() ? 'mobile': 'desktop');
    setLinks(formattedLinks);
  }

  const getiOSLinks = (url) => {
    const formattedLinks = formatMobileRegistry(registry, 'mobile');
    const iosLinks = formattedLinks.map(link => formatIOSMobile(url, link));
    console.log({iosLinks});
    return iosLinks;
  }

  const getAndroidLinks = () => {
     // Only 1 link? See note from Ethan
  }

  return (
    <div className="app">
      <div className="container">
        <div className="demo connect">
          {!accounts.length ? (
              <button onClick={createWalletConnectSession}>Start WalletConnect Session</button>
            ) : (<div>
              <p>Connected to: {accounts[0]}</p>
              <button onClick={signMessage}>Sign personal Message</button>
            </div>)
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
