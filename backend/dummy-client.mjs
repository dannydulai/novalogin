import * as readline from 'node:readline/promises';
import pkceChallenge   from 'pkce-challenge';
import axios           from 'axios';
import { stdin as input, stdout as output } from 'node:process';
import { getCookie, setCookie, lookupAppInfo, LOGIN_CLIENT_ID } from "./utils.mjs";

let argv = process.argv;
argv.shift()
argv.shift()
let appid = argv.shift()
let challenge = argv.shift()

let secret = 'mysecret-' + appid;

console.log("looking up app...")
const appinfo = await lookupAppInfo(appid);

if (!appinfo.login_callback)
    secret = appinfo.secret;

console.log()
console.log("open the following url:")
console.log()

let url = `http://localhost:89/login?id=${appid}`;
if (challenge) url += "&challenge=" +  encodeURIComponent(pkceChallenge.generateChallenge(secret));
console.log(url);
console.log()

const rl = readline.createInterface({ input, output });
const code = await rl.question('Please enter code from login page after logging in: ');

const params = new URLSearchParams();
params.append('code', code);
if (appinfo.login_callback)
    params.append('verifier', secret);
else
    params.append('secret', secret);

console.log(params);

const r = (await axios.post(`http://localhost:89/token`, params)).data;

console.log(r)

rl.close();

