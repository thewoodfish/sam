#### Samaritan on the web.

## Samaritan OS: A DID-based Web3 Cloud Access Layer

	Just as the word “person” describes a human being, a “Samaritan” describes the digital identity of an individual purely by the digital applications they interact with. A SamaritanOS can be thought of as a living vessel (a “means to an end”) made up of ones and zeroes, which can be accessed by any on-chain account, whose state is created and shaped uniquely by its users’ interactions.
	Samaritans are not new, they exist today in pieces’ scattered across the internet, living rent-free in data silos and storage farms owned by different entities, large and small, with different agendas. All in all, as you know, because the “home” of your state doesn’t belong to you, these “entities” can do whatever they please with your state/data e.g selling them, worse, they can deny you access to your own data! That is quite funny :)
The problem to solve is for Samaritans (e.g. everyday users, developers, other programs) to be able to own their interactions with applications and participate in voting for new applications for their fellow Samaritans to access.

### What is a Samaritan?
A Samaritan is the digital identity of an individual that is able to "possess" devices with the help of the SamaritanOS with its state(static, dynamic and inferred) to maintain controlled access between its state and the outside world.

### What components make up a Samaritan Ecosystem?
	A Samaritan ecosystem stands on three pillars:
- The Samaritan blockchain.
- The Samaritan OS.
- The Samaritan protocol.


### The Samaritan Blockchain
	The blockchain component for Samaritans is necessary to: 
- Provide a unique and unforgeable identity for an individual using the Samaritan OS
- To map an individual to whatever data (static) they might own.
- Prove and verify ownership of data that the Samaritan OS interacts with..
- Authorize and revoke access to valid state changes made by an individual.
- Record online interactions and prove that interactions are legitimate..
- Provide  governance mechanisms to add or exclude  meta protocol upgrades to the network.
- Economically  secure the network. 


### The Samaritan Operating System
	The Samaritan OS is a piece of low-level software that stands as a vessel to be “possessed” at will by any Samaritan. This OS is able to connect with the Samaritan blockchain and other decentralized protocols such as IPFS. The main function of the OS is to provide the infrastructure for programs running on it to interact seamlessly with Samaritans, while ensuring controlled access to the individual’s state. The OS is built to be really light with the Samaritan and its protocols just residing below the user space.

### Where is a Samaritan’s data stored?
	Samaritans store their state with the help of decentralized storage protocols like IPFS on decentralized storage networks like Crust. All of the data comprising the state are sharded and spread across the globe through a simple incentive model. Nobody can EVER have access or control of your data except when properly authorized. The Samaritan OS is able to gather this state at will and present it to the user on any devices the user may choose to use. Your state is independent of any device. It is everywhere and nowhere!

### What about the programs I choose to run?
	Programs follow some procedures before they can be run on a Samaritan OS. In a high abstraction for a typical program:
- The program must be verified by on-chain governance (or a whitelist of authorized members). 
- If the program gets a majority vote, it is committed to decentralized storage networks and is added to the “ability pool” - like an app store for other Samaritans to use.
- The program is then discoverable by every Samaritan across the globe.
- It can be then added to a users’ state by download.
- Upon running a program from the “ability pool”, the Samaritan checks to see what data the program might need to run properly. 
- Granting, revoking,data logging, behavior and access is all controlled by the individual through the Samaritan protocol.

### The Samaritan Protocol
	This describes the rules, SDKs, semantics of synchronization between the actors comprising the Samaritan exosystem.

### Progress?
	Samaritan is still in its early stage undergoing its idealization testing phase. It is currently being lightly built with its client as a simulated terminal on a browser and a node-js server. This encourages quick-testing and speed of changing ideas and implementation paths. It currently utilizes JavaScript, node-js and Substrate.

### Github:
https://github.com/thewoodfish/sam
This repository contains the server and client files used in the web prototype. It contains node-js and JavaScript files.

https://github.com/thewoodfish/s-chain
This repository contains the runtime logic of the samaritan chain written in Substrate. It contains mostly Rust files.

Thank you!
