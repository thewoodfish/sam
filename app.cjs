// imports
const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3002;

// substrate client imports
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { keyring } = require('@polkadot/ui-keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { u8aToHex }= require('@polkadot/util');

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

// real chain functions
async function genesisHash (res) {
    const api = await ApiPromise.create({ provider: wsProvider });
    res.send(api.genesisHash.toHex());
};

async function createAccount(body, res) {

    await ApiPromise.create({ provider: wsProvider }).then(() => {

        cryptoWaitReady().then(() => {
            // load all available addresses and accounts
            keyring.loadAll({ ss58Format: 42, type: 'sr25519' });

            const mnemonic = mnemonicGenerate();
            const { pair, json } = keyring.addUri(mnemonic, body.password, { name: body.name, created: Date.now() });

            res.send(mnemonic);
        });
    });
}

// request handles
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
 
app.post('/bhash', function (req, res) {
    const accounts = keyring.getAccounts();

    accounts.forEach(({ address, meta, publicKey }) =>
    console.log(address, JSON.stringify(meta), u8aToHex(publicKey))
    );
})

// add account
app.post('/create_account', function (req, res) {
    createAccount(req.body, res);
})

// authenticate account
app.post('/auth_account', function (req, res) {
    cauthAccount(req.body.keys, res);
})

app.listen(port, () => console.log(`Listening on port ${port}`))