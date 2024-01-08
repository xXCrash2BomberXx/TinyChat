# TinyChat

> [!NOTE]
> Although this project is usable in the ways described below, this is *not* complete and progress can be seen [here](#features) as well as planned improvements for the future.
> Additionally, this project has been reported to not work on MS Edge, Brave, and Safari.

TinyChat works through the usage of [PeerJS](https://peerjs.com/).
When you open a TinyChat web page, a User ID will be shown in the top right bar.
This User ID is how people can contact you, but this will change every time you refresh the page.
TinyChat aims to give end-to-end encrypted communication through RSA-OAEP, Elliptic Curve Diffie-Hellman, and AES-CBC encryption.
Each conversation will have a unique AES-256 key with that key being shared using your RSA public key to allow the peer to produce a key that only the sender knows prior to encryption and that only you can decrypt as it will be encrypted with your RSA public key.

> [!IMPORTANT]
> Although the messages themselves are encrypted, many other metadata items are not.
> Further explanation of how this is done can be seen [here](#key-establishment).
>
> What the attacker *cannot* read:
>
> - The message body
> - The time the message was sent
> - The message ID
> - The message ID being replied to (should the message be a reply)
> - The effect being applied to the message (confetti, spotlight, etc.)
> - The message event type (message, delivery receipt, typing indicator, message edit, etc.)
>
> What the attacker *can* read:
>
> - The User ID that sent the message (Needed for Message Decryption)
> - User IDs in the group (Needed for Message Decryption)

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

After the project has been compiled, simply open `TinyChat.html` with your desired web browser and chat away!

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
    #8226; #dhKeys: { [id: string]: { [id: string]: CryptoKeyPair } }
    #8226; #window: window
    #8226; #crypto: Crypto
    #8226; #eventID: string | HTMLInputElement | undefined
    <hr>#8226; createChat: (to: string): HTMLSpanElement
    #8226; #render: (to: string, messageData: MessageData): void
    #8226; #send: (to: string, messageData: MessageData): void
    #8226; react: (reaction: string): void
    #8226; schedule: (seconds: number | undefined): void
    #8226; openContext: (): void
    #8226; openReacting: (): void
    #8226; markReply: (): void
    #8226; markEdit: (): void
    #8226; unsend: (): void
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
  A>Creates an RSA Key] --> |This is done once each time the page is opened or refreshed| B>Generate New AES Key Request];
  B --> |This is done for each client| D>Sends RSA Public Key];
  J --> K>Decrypt Encrypted Diffie-Hellman Public Key with RSA Private Key];
  K --> L>"Generate Diffie-Hellman Public/Private Key"];
  B --> F>Generate AES Key];
  F --> M;
  L --> M>One-Time-Pad = Diffie-Hellman Symmetric Key ^ Generated AES Key];
  M --> N>Encrypt Generated Diffie-Hellman Public Key and One-Time-Pad with Client #+'s RSA Public Key];
  N --> O>Send Encrypted Data to Client #+];
  end
  subgraph "Client #+"
  C>Creates an RSA Key] --> |This is done once each time the page is opened or refreshed| E>Creates a new Conversation];
  D --> E>Waits for RSA Public Key];
  E --> G>"Generate Diffie-Hellman  Public/Private Key"];
  G --> H>Encrypt Generated Diffie-Hellman Public Key with Client #1's RSA Public Key];
  H --> I>Send Encrypted Data and RSA Public Key to Client #1];
  I --> J>Receive Encrypted Data from Client #+];
  O --> P>Receive Encrypted Data from Client #1];
  P --> Q>Decrypt Encrypted Diffie-Hellman Public Key and One-Time-Pad with RSA Private Key];
  Q --> R>AES Key = One-Time-Pad ^ Diffie-Hellman Symmetric Key];
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
    T --> U>A Stop Typing Indicator is Received];
    U --> V>The Typing Indicator is Removed from the UI];
  end

  classDef user fill:#fff,color:#000
  class A,E,P,Q,R,S user;
```
