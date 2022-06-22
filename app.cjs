// imports
const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3002;

// substrate client imports
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { keyring } = require('@polkadot/ui-keyring');
// const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');

// semi-config
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

// set views
app.set('views', './views')
app.set('view engine', 'ejs')

// GETS
app.get('', (req, res) => {
    res.render('terminal')
})

app.get('/index', (req, res) => {
    res.render('index')
})

const wsProvider = new WsProvider('ws://127.0.0.1:9944');

cryptoWaitReady().then(() => {
    const exist = false;
    // load all available addresses and accounts
    keyring.loadAll({ ss58Format: 42, type: 'sr25519' });
});

// real chain functions
async function genesisHash (res) {
    const api = await ApiPromise.create({ provider: wsProvider });
    res.send(api.genesisHash.toHex());
};

async function createAccount(body, res) {
    await ApiPromise.create({ provider: wsProvider }).then(() => {
        cryptoWaitReady().then(() => {
            // load all available addresses and accounts

            const mnemonic = mnemonicGenerate();
            const { pair, json } = keyring.addUri(mnemonic, body.password, { name: body.name, created: Date.now() });

            const accounts = keyring.getAccounts();

            accounts.forEach(({ address, meta, publicKey }) =>
                console.log(address, JSON.stringify(meta), u8aToHex(publicKey))
            );

            res.send(mnemonic);
        });
    });
}

async function authAccount(body, res) {
    await ApiPromise.create({ provider: wsProvider }).then(() => {
        cryptoWaitReady().then(() => {
            var exist = false;
            const pair = keyring.createFromUri(body.keys, body.password);
            const accounts = keyring.getAccounts();

            accounts.forEach(({ address, meta, publicKey }) => {
                // search and compare for equality
                if (pair.address === address && meta.name === body.pseudo) 
                    exist = true;
            });

            res.send(exist);
        });
    });
}

// request handles
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
 
// test function
app.post('/bhash', function (req, res) {

    cryptoWaitReady().then(() => {
        // load all available addresses and accounts
        keyring.loadAll({ ss58Format: 42, type: 'sr25519' });


        const accounts = keyring.getAccounts();

        accounts.forEach(({ address, meta, publicKey }) =>
            console.log(address, JSON.stringify(meta), u8aToHex(publicKey))
        );

        const mnemonic = "excite hungry layer civil bachelor illness pole coffee captain vivid uncover winter";
        const pair = keyring.createFromUri(mnemonic, "woodfish");

        console.log(pair.address);
        console.log(mnemonic);
    })
})

// add account
app.post('/create_account', function (req, res) {
    createAccount(req.body, res);
})

// authenticate account
app.post('/auth_account', function (req, res) {
    authAccount(req.body, res);
})

app.listen(port, () => console.log(`Listening on port ${port}`))