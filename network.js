import { createRequire } from "module";
const require = createRequire(import.meta.url);

import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as IPFS from "ipfs-core";

const toBuffer = require('it-to-buffer');

async function constructHeader(pair) {
    // Construct auth header
    const sig = pair.sign(pair.address);
    const sigHex = '0x' + Buffer.from(sig).toString('hex');
    
    return Buffer.from(`sub-${pair.address}:${sigHex}`).toString('base64');
}

export async function uploadToIPFS(path) {
    const ipfs = await IPFS.create();
    const { cid } = await ipfs.add(path);

    console.log("dikbjdns");
    console.info(cid);

    if (cid) 
        console.log(cid.toV0().toString());
    else 
        throw new Error('IPFS add failed, please try again.');

    return cid;
}

export async function getFromIPFS(cid) {
    const ipfs = await IPFS.create();
    const bufferedContents = await toBuffer(ipfs.cat(cid)); // returns a Buffer
    
    return bufferedContents;
}