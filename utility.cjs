const fs = require('fs');


// Get client IP address from request object ----------------------
let getClientAddress = (req)  => {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] 
    || req.connection.remoteAddress;
};

let createProfile = (address) => {
    let json =  {
        "addr": address,
        "name": "Jack Sparrow",
        "age": 26,
        "sex": "M",
        "d-o-b": "12/9/01",
        "religion": "Christianity",
        "address": "Boston, Massachussets",
        "telephone": [
            "0192893838021",
            "0127938291282"
        ],
        "email": [
            "jacksparrow@gmail.com",
            "jsparrow23@gmail.com"
        ],
    };

    json = JSON.stringify(json);
    fs.writeFile('./profile.json', json, (err) => {
        if (!err) {
            console.log('done');
        }
    });
}


module.exports = { getClientAddress, createProfile };