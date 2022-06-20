// imports
const express = require('express');
const app = express();
const port = 3000;

// Import
const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/api');


async function main () {
    // Construct
    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });

    // Do something
    console.log(api.genesisHash.toHex());
};

main().catch(console.error).finally(() => process.exit());

// static files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

// set views
app.set('views', './views')
app.set('view engine', 'ejs')

app.get('', (req, res) => {
    res.render('terminal')
})

app.get('/index', (req, res) => {
    res.render('index')
})

app.listen(port, () => console.log(`Listening on port ${port}`))