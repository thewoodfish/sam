/* File: simple test SDK for the Samaritan Terminal
 * Author: Woodfish
 * Date: Jul 12 15:07
 */

var get_sdata = () => {
    // get samaritan deep data
    var sam = JSON.parse(localStorage["samaritan"]);

    // first check if data is string or parsed
    if (typeof sam.data == "string") 
        return JSON.parse(sam.data);
    else	
        return sam.data;
}

var get_sdesc = () => {
    // get samaritan cid & pseudo
    var sam = JSON.parse(localStorage["samaritan"]);

    return { pseudo: sam.pseudo, cid: sam.cid };
}

function qs(prop) {
    return document.querySelector(prop);
}

const app_cid = qs(".app-cid").dataset.cid;
let app_data = {};

async function get_app_data() {
   // upload to server
   return fetch ("/get_app", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cid: app_cid
        })
    })
    .then(res => {
        return (async function () {
            return await res.json().then(res => {
                // assign data to global variable
                app_data = res.app;
                return (async function () {
                    let auth = await is_auth();
                    // check if the application is authorized or not
                    if (auth) 
                        return { result: get_info(), error: "" };
                    else {
                        ask_for_permission();
                        return { result: [], error: "no auth" };
                    }
                })();
            });
        })();  
    });
}

async function is_auth() {
     // upload to server
    return fetch ("/is_auth", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cid: app_cid,
            addr: get_sdata().addr
        })
    })
    .then(res => {
        return (async function () {
            return await res.json().then(res => {
                return res.auth;
            });
        })();  
    });
}

function ask_for_permission() {
    qs(".ask_perm").style.display = "block";
    qs(".perms").innerText = app_data.permissions;
}

async function authorize_application() {
    // give permission onchain
    return fetch ("/give_app_permission", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cid: app_cid, 
            allow: true,
            addr: get_sdata().addr
        })
    })
    .then(res => {
        return (async function () {
            return await res.json().then(res => {
                if (res.status) {
                    // we can start application now
                    remove_auth();
                    return initialize_application();
                }
            });
        })();  
    });
}

function require_auth() {
    document.querySelector(".ask_perm").style.display = "block";
}


function remove_auth() {
    document.querySelector(".ask_perm").style.display = "none";
}

function get_info() {
    // return requested info
    console.log(app_data);
    let p = app_data.permissions.split(', ');
    let details = [];
    
    // get user details
    let user_d = get_sdata();

    console.log(user_d);

    for (let i = 0; i < p.length; i++) {
        let req = p[i];
        details.push(user_d[req]);
    }

    return details;
}

// entry point
function initialize_application() {
    // first look for the apps CID
    if (app_cid) {
        // get app data
        return get_app_data();
    } else {
        console.log("Error: App CID not found!");
        return { result: [], error: "no cid found" };
    }
};
