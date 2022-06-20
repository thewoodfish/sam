// imports
const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3000;

// substrate client imports
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate } = require('@polkadot/util-crypto');

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

async function createAccount(pname, res) {
    const mnemonic = mnemonicGenerate();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const pair = keyring.addFromUri(mnemonic, { name: pname }, 'ed25519');

    res.send(mnemonic);
}


// request handles
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

// app.post('/bhash', function (req, res) {
//     genesisHash(res);
// })

app.post('/create_account', function (req, res) {
    createAccount(req.body.nam, res);
})

app.listen(port, () => console.log(`Listening on port ${port}`))