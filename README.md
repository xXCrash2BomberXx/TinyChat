# TinyChat

> [!NOTE]
> Although this project is usable in the ways described below, this is *not* complete and progress can be seen [here](#features) as well as planned improvements for the future.

TinyChat works through the usage of [PeerJS](https://peerjs.com/).
When you open a TinyChat web page, a User ID will be shown in the top right bar.
This User ID is how people can contact you, but this will change every time you refresh the page.
TinyChat aims to give end-to-end encrypted communication through RSA-OAEP and AES-CBC encryption.
Each conversation will have a unique AES-256 key with that key being shared using your RSA public key to allow the peer to produce a key that only the sender knows prior to encryption and that only you can decrypt as it will be encrypted with your RSA public key.

> [!IMPORTANT]
> Although the messages themselves are encrypted, many other metadata items are not.
> Further explanation of how this is done can be seen [here](#mermaid-diagram).
>
> What the attacker *cannot* read:
>
> - The message body
> - The time the message was sent
> - The message ID being replied to (should the message be a reply)
> - The effect being applied to the message (confetti, spotlight, etc.)
>
> What the attacker *can* read:
>
> - The User ID that sent the message
> - The message ID (This is a randomly generated GUID)
> - The message event type (message, delivery receipt, typing indicator, message edit, etc.)

> [!WARNING]
> The largest vulnerability to this web application is the initial AES keyshare.
> On slower network connections, an attack can theoretically read the public RSA key and send a malicious AES key with a fake signature.
> This attack would be undetectable as it classifies as a "Man in the Middle Attack".
> Although this would be quite difficult to achieve in general usage, it is theoretically possible and worth consideration.

## Features

- [x] ~~Sending Messages~~
  - [x] ~~Backend~~
    - [x] ~~Create Conversation Groups with Client ID~~
    - [x] ~~Create Conversations~~
    - [x] ~~Create Messages~~
    - [x] ~~Send Messages~~
    - [x] ~~Receive Messages~~
  - [x] ~~Frontend~~
    - [x] ~~Create Conversation UI~~
    - [x] ~~Create Message UI~~
    - [x] ~~View Message History~~
- [x] ~~Themes (Light/Dark)~~
  - [x] ~~Frontend~~
    - [x] ~~Light Theme~~
    - [x] ~~Dark Theme~~
- [x] ~~Delivery Receipts~~
  - [x] ~~Backend~~
    - [x] ~~Send Delivery Receipts~~
    - [x] ~~Receive Delivery Receipts~~
  - [x] ~~Frontend~~
    - [x] ~~Show Delivery Receipts in UI~~
- [x] ~~Typing Indicators~~
  - [x] ~~Backend~~
    - [x] ~~Handle Typing Logic~~
    - [x] ~~Send Typing Indication~~
    - [x] ~~Receive Typing Indication~~
  - [x] ~~Frontend~~
    - [x] ~~Show Typing Indicators in UI~~
- [x] ~~Editing Messages~~
  - [x] ~~Backend~~
    - [x] ~~Send Edited Messages~~
    - [x] ~~Receive Edited Messages~~
  - [x] ~~Frontend~~
    - [x] ~~Edit Message UI~~
    - [x] ~~Edited Message Indication in UI~~
- [x] ~~End-To-End Encrypted~~
  - [x] ~~Backend~~
    - [x] ~~Establish RSA Keys~~
      - [x] ~~Public~~
      - [x] ~~Private~~
    - [x] ~~Share AES Key Encrypted with RSA~~
    - [x] ~~Send Encrypted Messages~~
- [x] ~~Replies~~
  - [x] ~~Backend~~
    - [x] ~~Create Replies~~
    - [x] ~~Send Replies~~
  - [x] ~~Frontend~~
    - [x] ~~Create Replies~~
    - [x] ~~Reply Indication in UI~~
- [x] ~~Unsend/Delete~~
  - [x] ~~Backend~~
    - [x] ~~Create Deletion Request~~
    - [x] ~~Handle Deletion Request for Sender~~
    - [x] ~~Handle Deletion Request for Receiver~~
  - [x] ~~Frontend~~
    - [x] ~~Create Deletion Request~~
    - [x] ~~Delete Message from Sender~~
    - [x] ~~Delete Message from Receiver~~
- [x] ~~Reactions~~
  - [x] ~~Backend~~
    - [x] ~~Create Reactions~~
    - [x] ~~Send Reactions~~
  - [x] ~~Frontend~~
    - [x] ~~Create Reactions~~
    - [x] ~~Reaction Indication in UI~~
- [x] ~~Files~~
  - [x] ~~Backend~~
    - [x] ~~Upload File~~
    - [x] ~~Download File~~
  - [x] ~~Frontend~~
    - [x] ~~Upload File~~
    - [x] ~~Download File~~
- [ ] Effects
  - [ ] Backend
    - [ ] Create Effects
    - [ ] Send Effects
  - [ ] Frontend
    - [ ] Create Effects
    - [ ] Reaction Indication in UI

## Building

Building this project for development purposes requires either `npm` or `tsc` to be installed. For testing the project, `npm` must be installed specifically.

**NPM Method:**

- **Building:** Run `npm run build` which will install `tsc` locally and build the main website. After running the command once, the project can then be rebuilt with `npx tsc` which will compile the TypeScript files for usage. Alternatively, `npm run build` can be used to rebuild the main website. `tsc` can also be manually installed with `npm install -g typescript` to remove the need to use `npx`.

- **Testing:** Run `npm run test` which will install `tsc` locally, build both the main website and the testing backend, and run the testing backend. Modifications to the main website can be recompiled with `npx tsc` and modifications to the testing backend can be recompiled with `npx tsc -p test.tsconfig.json`. Alternatively, `npm run test` can be used to rebuild both the main website and testing backend.

**TSC Method:**

- **Building:** If `tsc` has already been installed through either `npm install -g typescript` or through other methods, compiling is as simple as running `tsc` to build the main website. The project can then be rebuilt with `tsc` again.

- **Testing:** Testing cannot be done without `npm` installed.

After the prject has been compiled, simply open `TinyChat.html` with your desired web browser and chat away!

> [!NOTE]
> Any changes to TypeScript Files during development will require rebuilding the project as used prior. Modifications to any other file types (i.e. HTML, CSS) will be automatically updated when reloading the page.

## 4+1 Diagram

### Logical View

```mermaid
graph TB;
  A["
  Client
    <hr>#8226; #peer: Peer
    #8226; #editing: string
    #8226; #replying: string
    #8226; #reacting: string
    #8226; #keyPair: CryptoKeyPair
    #8226; #aesKeys: { [id: string]: [Uint8Array, CryptoKey] }
    #8226; #window: window
    #8226; #crypto: Crypto
    <hr>#8226; createChat: (to: string): HTMLSpanElement
    #8226; #render: (to: string, messageData: MessageData): void
    #8226; #send: (to: string, messageData: MessageData): void
    #8226; react: (reaction: string): void
  "] --> |Has a| B["
  Peer
    #8226; id: string
    #8226; connections: object
	#8226; disconnected: boolean
	#8226; destroyed: boolean
  "];
  C["
  MessageData
    <hr>#8226; from: string
    #8226; body: string
    #8226; time: string
    #8226; id: string
    #8226; event: MessageDataEvent
    #8226; prev: string
    #8226; effect: MessageDataEffects
  "];
  D["
  MessageDataEvent
    <hr>#8226; Typing
    #8226; StopTyping
    #8226; Edit
    #8226; Unsend
    #8226; Delivered
    #8226; GroupRSAKeyRequest
    #8226; GroupRSAKeyShare
    #8226; RSAKeyShare
    #8226; AESKeyShare
  "];
  E["
  MessageDataEffects
  <hr>
  "];
```

### Development View

```mermaid
graph TB
  A["TinyChat.html"];
  B["
  PeerJS
    <hr>#8226; https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js
  "] --> A;
  C["TinyChat.js"] --> A;
  D["
  NPM
    <hr>#8226; typescript
  "] --> C;
  E["
  TinyChat.ts
    <hr>#8226; MessageDataEvent
    #8226; MessageDataEffects
    #8226; MessageData
    #8226; Client
  "] --> D;
  F["TinyChat.css"] --> A;
  G["Testing.js"];
  H["
  NPM
    <hr>#8226; typescript
    #8226; @peculiar/webcrypto
    #8226; @types/node
    #8226; fs
    #8226; jsdom
  "] --> G;
  C --> G;
  I["
  Testing.ts
  <hr>#8226; createChatTest
  #8226; renderTest
  "] --> H;
```

### Scenarios View

#### Key Establishment

```mermaid
graph TB;
  subgraph "Client #1"
  A>Creates an RSA Key] --> |This is done once each time the page is opened or refreshed| B>Creates a new Conversation];
  B --> C>The Conversation is Added to the UI];
  B --> D>Sends RSA Public Key];
  D --> J>Waits for AES Symmetric Key];
  J --> K>Decrypts Encrypted Key with RSA Private Key];
  end
  subgraph "Client #2"
  E>Creates an RSA Key] --> |This is done once each time the page is opened or refreshed| F>Waits for RSA Public Key];
  D --> F;
  F --> G>Creates an AES Symmetric Key];
  G -->H>Encrypts the AES Key with Client #1s RSA Public Key];
  H -->I>Sends Encrypted Key to Cient #1];
  I --> J;
  F --> O>Sends RSA Public Key Request to all other members];
  G --> Q;
  P --> Q>Encrypts the AES Key with Client #+s RSA Public Key];
  Q --> R>Sends Encrypted Key to Cient #+];
  F --> U>The Conversation is Added to the UI];
  end
  subgraph "Client #+"
  L>Creates an RSA Key] --> |This is done once each time the page is opened or refreshed| M>Waits for RSA Public Key Request];
  M --> N>Sends RSA Public Key];
  O --> M;
  N --> P>Receives RSA Public Keys];
  N --> S> Waits for AES Symmetric Key];
  R --> S;
  S --> T>Decrypts Encrypted Key with RSA Private Key];
  M --> V>The Conversation is Added to the UI];
  end

  classDef user fill:#fff,color:#000
  class B user;
```

#### Messaging

```mermaid
graph LR;
  subgraph "Sender"
    subgraph "Modifiers"
      P>Edit] --> O;
      Q>Reply] --> O;
    end
    O>XOR] --> A;
    A>A Message is Typed];
    A --> S>Stop Typing];
    S --> T>A Stop Typing Indicator is Sent to each Receiver];
    A --> B>A Typing Indicator is Sent to each Receiver];
    A --> E>The Message is Sent];
    E --> F>The Message is Encrypted with the AES Symmetric Key];
    R>Reaction] --> F;
    F --> G>The Encrypted Message is Sent to each Receiver];
    E --> L>The Message is Added to the UI];
    L --> M>The Sender Waits for a Delivery Receipt];
    M --> |Only for First Received| N>A Delivery Receipt is Added to the UI];
  end
  subgraph "Receivers"
    B --> C>A Typing Indicator is Received];
    C --> D>The Typing Indicator is Added to the UI];
    G --> H>The Encrypted Message is Received];
    H --> I>The Encrypted Message is Decrypted with the AES Symmetric Key];
    I --> J>The Decrypted Message is Added to the UI];
    H --> K>A Delivery Receipt is Sent to the Sender];
    K --> M;
    T --> U>A Stop Typping Indicator is Received];
    U --> V>The Typing Indicator is Removed from the UI];
  end

  classDef user fill:#fff,color:#000
  class A,E,P,Q,R,S user;
```
