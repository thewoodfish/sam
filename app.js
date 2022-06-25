// imports
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);

// 👇️ "/home/john/Desktop/javascript"
const __dirname = path.dirname(__filename);

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

// utility functions
const util = require("./utility.cjs");
import * as net from "./network.js";

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

// global variables
const wsProvider = new WsProvider('ws://127.0.0.1:9944');

cryptoWaitReady().then(() => {
    // load all available addresses and accounts
    keyring.loadAll({ ss58Format: 42, type: 'sr25519' });
});

// real chain functions
async function genesisHash (res) {
    const api = await ApiPromise.create({ provider: wsProvider });
    res.send(api.genesisHash.toHex());
};

async function createAccount(req, res) {
    const api = await ApiPromise.create({ provider: wsProvider }).then(() => {
        cryptoWaitReady().then(() => {
            const mnemonic = mnemonicGenerate();
            const { pair, json } = keyring.addUri(mnemonic, req.body.password, { name: req.body.name, created: Date.now() });

            res.send(mnemonic);

        });

        // create json file for user and commit to IPFS
        util.createProfile(pair.address);

        (async function() {
            // get IP address
            let ip = util.getClientAddress(req);

            // record creation and sign-in onchain
            const txHash = await api.tx.samaritan
                .signIn(ip)
                .signAndSend(pair.address);

            console.log(txHash);
        });
    });
}

async function authAccount(req, res) {
    const api = await ApiPromise.create({ provider: wsProvider }).then(() => {
        cryptoWaitReady().then(() => {
            var exist = false;
            const pair = keyring.createFromUri(req.body.keys, req.body.password);
            const accounts = keyring.getAccounts();

            accounts.forEach(({ address, meta, publicKey }) => {
                // search and compare for equality
                if (pair.address === address && meta.name === req.body.pseudo) 
                    exist = true;
            });
        });

        if (exist) {
            // get IP address
            let ip = util.getClientAddress(req);

            (async function() {
                // record sign-in onchain
                const _txHash = api.tx.samaritan
                    .signIn(ip)
                    .signAndSend(pair.address);

            });
        }

        res.send(exist);
    });
}

// request handles
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
 
// test function
app.post('/bhash', function (req, res) {
    // res.send(`IP is ${util.getClientAddress(req)}`);
    const mnemonic = mnemonicGenerate();
    const { pair, json } = keyring.addUri(mnemonic, req.body.password, { name: req.body.name, created: Date.now() });
    net.uploadToIPFS(pair, "./profile.json");


})

// add account
app.post('/create_account', function (req, res) {
    createAccount(req, res);
})

// authenticate account
app.post('/auth_account', function (req, res) {
    authAccount(req, res);
})

app.listen(port, () => console.log(`Listening on port ${port}`))