const fs = require('fs');
const crypto = require('crypto');


// Get client IP address from request object ----------------------
let getClientAddress = (req)  => {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] 
    || req.connection.remoteAddress;
};

// create json file and encrypt the users basic data in
let createProfile = (address) => {
    let json =  {
        "addr": address,
        "name": "",
        "age": "",
        "sex": "",
        "d_o_b": "",
        "religion": "",
        "address": "",
        "telephone": [],
        "email": [],
    };

    json = JSON.stringify(json);

    // encrypt file
    const initVector = crypto.randomBytes(16);
    const algorithm = "aes-256-cbc"; 
    const message = json;

    const securitykey = crypto.randomBytes(32);
    const cipher = crypto.createCipheriv(algorithm, securitykey, initVector);

    let encryptedData = cipher.update(message, "utf-8", "hex");
    encryptedData += cipher.final("hex");

    // we're putting the key into the file
    let data = encryptedData.substring(0, 24) + initVector + encryptedData.substring(25);
    data = data + securitykey;

    let js_data = {
        "data": data
    };    

    js_data = JSON.stringify(js_data);

    fs.writeFile('profile.json', js_data, (err) => {
        if (!err) {
            console.log('done');
        }
    });

    // return JSON object
    return json;
}


module.exports = { getClientAddress, createProfile };