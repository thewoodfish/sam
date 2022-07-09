const fs = require('fs');
const crypto = require('crypto');


// Get client IP address from request object ----------------------
let getClientAddress = (req)  => {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] 
    || req.connection.remoteAddress;
};

// create json file and encrypt the users basic data in
let createProfile = (address, hash_key) => {
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

    let js_data = encryptData(json, hash_key)

    let ret = {
        prof: js_data,
        user_det: json
    }

    // return JSON object
    return ret;
}

function encryptData(message, securitykey) {
    const initVector = "0000000000000000";
    const algorithm = "aes-256-cbc"; 

    const cipher = crypto.createCipheriv(algorithm, securitykey, initVector);

    let encryptedData = cipher.update(message, "utf-8", "hex");
    encryptedData += cipher.final("hex");

    return encryptedData;
}

function decryptData(encryptedData, securitykey) {
    const initVector = "0000000000000000";
    const algorithm = "aes-256-cbc"; 

    const decipher = crypto.createDecipheriv(algorithm, securitykey, initVector);

    let decryptedData = decipher.update(encryptedData, "hex", "utf-8");
    decryptedData += decipher.final("utf8");
    
    return decryptedData;
}

function sendProfileData(profile, mnemonic, variable, res) {
    let json = {
        data: profile,
        seed: mnemonic,
        var: variable
    };

    json = JSON.stringify(json);
    res.send(json);
}

function Utf8ArrayToStr(array) {

    // adopted from:
    //   http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt

    /* utf.js - UTF-8 <=> UTF-16 convertion
    *
    * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
    * Version: 1.0
    * LastModified: Dec 25 1999
    * This library is free.  You can redistribute it and/or modify it.
    */

    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    
    while(i < len) {
        c = array[i++];
        switch(c >> 4)
        { 
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12: case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                            ((char2 & 0x3F) << 6) |
                            ((char3 & 0x3F) << 0));
                break;
        }
    }

    return out;
}

module.exports = { getClientAddress, createProfile, sendProfileData, Utf8ArrayToStr, decryptData, encryptData };