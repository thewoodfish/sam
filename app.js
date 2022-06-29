// imports
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3005;
const crypto = require('crypto');

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
const api = await ApiPromise.create({ provider: wsProvider });

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
    cryptoWaitReady().then(() => {
        // record new CID onchain
        (async function() {
            const mnemonic = mnemonicGenerate();
            const { pair, json } = keyring.addUri(mnemonic, req.body.password, { name: req.body.name, created: Date.now() });

            // create json file for user and commit to IPFS
            const ret  = util.createProfile(mnemonic, pair.address);

            // get IP address
            let ip = util.getClientAddress(req);

            // const _txHash = api.tx.samaritan
            //     .signIn(ip)
            //     .signAndSend(pair.address);

            // commit to IPFS
            await net.uploadToIPFS(ret.prof).then(cid => {
                console.log("The CID is  " + cid);

                // const _txHash1 = api.tx.samaritan
                //     .changeDetail(req.body.name, cid)
                //     .signAndSend(pair.address);
                
                util.sendProfileData(ret.user_det, mnemonic, { cid: cid.toString() }, res);
            });
        }());
    });
}

async function authAccount(req, res) {
    cryptoWaitReady().then(() => {
        var exist = false;
        var mnemonic = req.body.keys;
        const pair = keyring.createFromUri(mnemonic, req.body.password);
        const accounts = keyring.getAccounts();

        accounts.forEach(({ address, meta, publicKey }) => {
            // search and compare for equality
            if (pair.address === address && meta.name === req.body.pseudo) 
                exist = true;
        });


        if (exist) {
            // get IP address
            let ip = util.getClientAddress(req);

            (async function() {
                // record sign-in onchain
                // const _txHash = api.tx.samaritan
                //     .signIn(ip)
                //     .signAndSend(pair.address);

                // get CID from onchain storage
                const sam = await api.query.samaritan.samPool(pair.address);
                const cid = sam.toHuman().cid;

                // get state from IPFS using users CID
                net.getFromIPFS(cid).then(arr => {
                    let json = util.Utf8ArrayToStr(arr);
                    let decryptedData = util.decryptData(JSON.parse(json).data, pair.address.substring(0, 32));
                    let json_data = JSON.parse(decryptedData);

                    util.sendProfileData(json_data, "", { bool: exist, cid: cid }, res);
                });

            }());

        } else 
            util.sendProfileData({}, "", { bool: exist, cid: "" }, res);

    });
}

// modify Samaritan details and return to IPFS
async function modifySam(req, res) {
    // get state from IPFS using users CID
    await net.getFromIPFS(req.cid).then(arr => {
        let json = util.Utf8ArrayToStr(arr);
        let decryptedData = util.decryptData(JSON.parse(json).data, req.addr(0, 32));
        let json_data = JSON.parse(decryptedData);

        // modify data
        for (var k in json_data) {
            if (json_data.hasOwnProperty(k) && k.toString() == req.prop) {
                json_data.k = req.val;
                break;
            }
        }

        console.log(json_data);

        (async function() {
            // commit to IPFS
            await net.uploadToIPFS(json_data).then(cid => {
                console.log("The CID is  " + cid);

                // record change onchain
                // const _txHash1 = api.tx.samaritan
                //     .changeDetail(req.name, cid)
                //     .signAndSend(req.addr);
                
                util.sendProfileData(json_data, "", { cid: cid.toString() }, res);
            });
        }());
    });
}

// request handles
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
 
// test function
app.post('/bhash', function (req, res) {
    // res.send(`IP is ${util.getClientAddress(req)}`);
    // const mnemonic = mnemonicGenerate();
    // const { pair, json } = keyring.addUri(mnemonic, req.body.password, { name: req.body.name, created: Date.now() });

    // net.uploadToIPFS("./profile.json").then(cid => {;
                    
    //     console.log("The CID is  " + cid);
    //     // get IP address
    // });
    (async function () {
        const sam = await api.query.samaritan.samPool("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty");
        let cid = sam.toHuman().cid;

        net.getFromIPFS(cid).then(arr => {
            let mnemonic = "valve start borrow magic mean multiply verb width mimic grain awesome bag";
            let json = util.Utf8ArrayToStr(arr);
            
            let decryptedData = util.decryptData(JSON.parse(json).data, mnemonic.substring(0, 32));
            console.log(decryptedData);
        });

    }());
})

// add account
app.post('/create_account', function (req, res) {
    createAccount(req, res);
})

// authenticate account
app.post('/auth_account', function (req, res) {
    authAccount(req, res);
})

// modify Samaritan
app.post('/mod_state', function (req, res) {
    modifySam(req, res);
})

app.listen(port, () => console.log(`Listening on port ${port}`))