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
>
> What the attacker *can* read:
>
> - The User ID that sent the message
> - The time the message was sent
> - The message ID
> - The message event type (message, delivery receipt, typing indicator, message edit, etc.)
> - The message ID being replied to (should the message be a reply)
> - The effect being applied to the message (confetti, spotlight, etc.)

## Features

- [x] Sending Messages
  - [x] Backend
    - [x] Create Conversation Groups with Client ID
    - [x] Create Conversations
    - [x] Create Messages
    - [x] Send Messages
    - [x] Receive Messages
  - [x] Frontend
    - [x] Create Conversation UI
    - [x] Create Message UI
    - [x] View Message History
- [x] Themes (Light/Dark)
  - [x] Frontend
    - [x] Light Theme
    - [x] Dark Theme
- [x] Delivery Receipts
  - [x] Backend
    - [x] Send Delivery Receipts
    - [x] Receive Delivery Receipts
  - [x] Frontend
    - [x] Show Delivery Receipts in UI
- [x] Typing Indicators
  - [x] Backend
    - [x] Handle Typing Logic
    - [x] Send Typing Indication
    - [x] Receive Typing Indication
  - [x] Frontend
    - [x] Show Typing Indicators in UI
- [x] Editing Messages
  - [x] Backend
    - [x] Send Edited Messages
    - [x] Receive Edited Messages
  - [x] Frontend
    - [x] Edit Message UI
    - [x] Edited Message Indication in UI
- [x] End-To-End Encrypted
  - [x] Backend
    - [x] Establish RSA Keys
      - [x] Public
      - [x] Private
    - [x] Share AES Key Encrypted with RSA
    - [x] Send Encrypted Messages
- [ ] Replies
  - [x] Backend
    - [x] Create Replies
    - [x] Send Replies
  - [ ] Frontend
    - [x] Create Replies
    - [ ] Reply Indication in UI
- [ ] Reactions
  - [ ] Backend
    - [ ] Create Reactions
    - [ ] Send Reactions
  - [ ] Frontend
    - [ ] Create Reaction
    - [ ] Reaction Indication in UI

## Mermaid Diagram

Below shows the process of two clients intiating a conversation and sending a message.
This process is simplified to remove the typing indicators being sent, but they follow the same procedure as as the message delivery.
The <span style="color:red">red</span> blocks represent processes ran on the client who created the chat, the <span style="color:green">green</span> blocks represent processes ran on the client who is joining the chat after creation, and the <span style="color:blue">blue</span> blocks represent user actions.
As you can see, from the graph, the processes the user performs themselves are quite minimal allowing for an overall easy to use messaging client.
Additionally, because everything is end-to-end encrypted, the server holding the data will never know your message contents.

```mermaid
graph TB;
  A>Client #1 Creates an RSA Key] --> |This is done each time the page is opened or refreshed| B>Client #1 Creates a new Conversation w/ Client #2];
  B --> D>Add Conversation to CLient #1 UI];
  B --> E>Client #1 Sends RSA Public Key to Client #2];
  F>Client #2 Creates an RSA Key] --> |This is done each time the page is opened or refreshed| G>Client #2 Waits for RSA Public Key from Client #1];
  E --> G;
  G --> H>Client #2 Creates an AES Symmetric Key];
  H -->I>Client #2 Encrypts the AES Key with Client #1s RSA Public Key];
  I -->J>Client #2 Sends Encrypted Key to Cient #1];
  E --> K>Client #1 Waits for AES Symmetric Key from Client #2];
  J --> K;
  K --> L>Client #1 Decrypts Encrypted Key with RSA Private Key];
  M --> W>A Typing Indicator is sent to Client #2];
  W --> X>Client #2 Receives the Typing Indicator];
  X --> Y>The Typing Indicator is Added to the Conversation Screen for Client #2];
  M --> Z>Client #1 Sends the Typed Message];
  L --> |The following could be either client, but Client #1 will be the sender for this example| M>A Message is Typed by Client #1];
  Z --> C>The message is converted to a MessageData object];
  C --> N>The message is Encrypted with the AES Symmetric Key Established];
  N --> O>The Encrypted Message is Sent to Client #2];
  C --> Q>The Message is Added to the Conversation Screen for Client #1];
  Q --> R>Client #1 Waits for Delivery Receipt from Client #1];
  R --> V>A Delivery Indicator is Added to the Conversation Screen];
  O --> P>Client #2 Receives the message];
  P --> S>Client #2 Decrypts the Message];
  S --> AA>The Typing Indicator is removed from the Conversation Screen for Client #2];
  AA --> T>The Message is Added to the Conversation Screen for Client #2];
  P --> U>Client #2 Sends a Delivery Receipts to Client #1];
  U --> R;

  classDef c1 fill:#500
  classDef c2 fill:#050
  classDef user fill:#005
  class A,C,D,E,K,L,M,N,O,Q,R,V,W c1;
  class F,G,H,I,J,P,S,T,U,X,Y,AA c2;
  class B,M,Z user;
```
