# TinyChat

> [!NOTE]
> Although this project is usable in the ways described below, this is *not* complete and progress can be seen [here](#features) as well as planned improvements for the future.

TinyChat works through the usage of [PeerJS](https://peerjs.com/).
When you open a TinyChat web page, a User ID will be shown in the top right bar.
This User ID is how people can contact you, but this will change every time you refresh the page.
TinyChat aims to give end-to-end encrypted communication through RSA-OAEP and AES-CBC encryption.
Each conversation will have a unique AES-256 key with that key being shared using your RSA public key to allow the peer to produce a key that only the sender knows prior to encryption and that only you can decrypt as it will be encrypted with your RSA public key.

> [!WARNING]
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
- [ ] Effects
  - [ ] Backend
    - [ ] Create Effects
    - [ ] Send Effects
  - [ ] Frontend
    - [ ] Create Effects
    - [ ] Reaction Indication in UI
- [ ] Unsend/Delete
  - [ ] Backend
    - [ ] Create Deletion Request
    - [ ] Handle Deletion Request for Sender
    - [ ] Handle Deletion Request for Receiver
  - [ ] Frontend
    - [ ] Create Deletion Request
    - [ ] Delete Message from Sender
    - [ ] Delete Message from Receiver
- [ ] Reactions
  - [ ] Backend
    - [ ] Create Reactions
    - [ ] Send Reactions
  - [ ] Frontend
    - [ ] Create Reactions
    - [ ] Reaction Indication in UI

## Mermaid Diagram

Below shows the process of two clients intiating a conversation and sending a message.
The red blocks represent processes ran on the client who created the chat, the green blocks represent processes ran on the client who is joining the chat after creation, and the blue blocks represent user actions.
As you can see, from the graph, the processes the users perform themselves are quite minimal allowing for an overall easy-to-use messaging client.
Additionally, because everything is end-to-end encrypted, the server holding the data will never know your message contents.

```mermaid
graph TB;
  subgraph Client_#1_Key_Share
  A>Client #1 Creates an RSA Key] --> |This is done each time the page is opened or refreshed| B>Client #1 Creates a new Conversation with Client #2];
  B --> D>The Conversation is Added to the Conversation Screen for Client #1];
  B --> E>Client #1 Sends their RSA Public Key to Client #2];
  end
  subgraph Client_#2_Key_Share
  F>Client #2 Creates an RSA Key] --> |This is done each time the page is opened or refreshed| G>Client #2 Waits for the RSA Public Key from Client #1];
  E --> G;
  G --> H>Client #2 Creates an AES Symmetric Key];
  H -->I>Client #2 Encrypts the AES Key with Client #1s RSA Public Key];
  I -->J>Client #2 Sends the Encrypted Key to Cient #1];
  end
  subgraph Client_#1_Key_Share
  E --> K>Client #1 Waits for AES Symmetric Key from Client #2];
  J --> K;
  K --> L>Client #1 Decrypts the Encrypted Key with RSA Private Key];
  end
  L --> |The following could be either client, but Client #1 will be the sender for this example| M>A Message is Typed by Client #1];
  subgraph Client_#1_Messaging
  M --> W>A Typing Indicator is sent to Client #2];
  end
  subgraph Client_#2_Messaging
  W --> X>Client #2 Receives the Typing Indicator];
  X --> Y>The Typing Indicator is Added to the Conversation Screen for Client #2];
  end
  subgraph Client_#1_Messaging
  M --> Z>Client #1 Sends the Typed Message];
  Z --> N>The message is Encrypted with the AES Symmetric Key Established];
  N --> O>The Encrypted Message is Sent to Client #2];
  Z --> Q>The Message is Added to the Conversation Screen for Client #1];
  Q --> R>Client #1 Waits for Delivery Receipt from Client #1];
  R --> V>A Delivery Indicator is Added to the Conversation Screen];
  end
  subgraph Client_#2_Messaging
  O --> P>Client #2 Receives the message];
  P --> S>Client #2 Decrypts the Message];
  S --> C>The Typing Indicator is removed from the Conversation Screen for Client #2];
  C --> T>The Message is Added to the Conversation Screen for Client #2];
  P --> U>Client #2 Sends a Delivery Receipts to Client #1];
  U --> R;
  end

  classDef user fill:#fff,color:#000
  class B,M,Z user;
```

```mermaid
graph TB;
    subgraph "Client#2"
    I;
    end
    subgraph "Client#+"
    M;
    N;
    end
  subgraph "Client#1"
  A>Creates an RSA Key] --> B>Creates a new Conversation];
  B --> C>Add Conversation to UI];
  B --> D>Sends RSA Public Key];
  D --> J>Waits for AES Symmetric Key];
  I --> J;
  J --> K>Decrypts Encrypted Key with RSA Private Key];
  end
  subgraph "Client#2"
  E>Creates an RSA Key] --> F>Waits for RSA Public Key];
  D --> F;
  F --> G>Creates an AES Symmetric Key];
  G -->H>Encrypts the AES Key with Client #1s RSA Public Key];
  H -->I>Sends Encrypted Key to Cient #1];
  F --> O>Sends RSA Public Key Request to all other members];
  O --> M;
  N --> P>Receives RSA Public Keys];
  G --> Q;
  P --> Q>Encrypts the AES Key with Client #+s RSA Public Key];
  Q --> R>Sends Encrypted Key to Cient #+];
  end
  subgraph "Client#+"
  L>Creates an RSA Key] --> M>Waits for RSA Public Key Request];
  M --> N>Sends RSA Public Key];
  N --> S> Waits for AES Symmetric Key];
  R --> S;
  S --> T>Decrypts Encrypted Key with RSA Private Key];
  end
```

```mermaid
graph TB;
    subgraph "Receivers"
    C;
    end
  subgraph "Sender"
    A>A Message is Typed];
    A --> B>A Typing Indicator is Sent to each Receiver];
    B --> C;
    A --> E>The Message is Sent];
    E --> F>The Message is Encrypted with the AES Symmetric Key];
    F --> G>The Encrypted Message is Sent to each Receiver];
    E --> L>The Message is Added to the UI];
    L --> M>The Sender Waits for a Delivery Receipt];
    M --> N>A Delivery Receipt is Added to the UI];
  end
  subgraph "Receivers"
    C>A Typing Indicator is Received] --> D>The Typing Indicator is Added to the UI];
    G --> H>The Encrypted Message is Received];
    H --> I>The Encrypted Message is Decrypted with the AES Symmetric Key];
    I --> J>The Decrypted Message is Added to the UI];
    H --> K>A Delivery Receipt is Sent to the Sender];
    K --> M;
  end
```