// imports
const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3000;

// substrate client imports
const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/api');

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.post('/bhash', function (req, res) {
    const name = req.body.name;
    const type = req.body.type;

    genesisHash(res);
})

app.listen(port, () => console.log(`Listening on port ${port}`))