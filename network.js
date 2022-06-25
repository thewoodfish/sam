import * as IPFS from "ipfs-core";

async function constructHeader(pair) {
    // Construct auth header
    const sig = pair.sign(pair.address);
    const sigHex = '0x' + Buffer.from(sig).toString('hex');
    
    return Buffer.from(`sub-${pair.address}:${sigHex}`).toString('base64');
}

export async function uploadToIPFS(pair, path) {
    const ipfs = await IPFS.create();
    const { cid } = await ipfs.add(path)
    console.info(cid)

    if (cid) {
        console.log(cid.toV0().toString());
    } else {
        throw new Error('IPFS add failed, please try again.');
    }
}
