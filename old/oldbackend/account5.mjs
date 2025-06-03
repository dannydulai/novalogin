import * as utils from './account5utils.mjs';

/* Routes to port
"1/",                         [x] api0_NeedUpgrade);
"2/",                         [x] api0_NeedUpgrade);

"3/autharc",                  [x] api3_AuthArc);
"3/authapp",                  [x] api3_AuthApp);
"3/authroon1",                [x] api3_AuthRoon1);
"3/authroon2",                [x] api3_AuthRoon2);
"3/nch",                      [x] api3_NucleusCheck);
"3/ncr",                      [x] api3_NucleusCreate);
"__health",                   [x] api_Health);

"3/check",                    [x] api3_Check);
"3/basicauth",                [ ] api3_BasicAuth);
"3/login",                    [ ] api3_Login);
"3/logout",                   [ ] api3_Logout);
"6/login",                    [ ] api6_Login);
"6/logout",                   [ ] api6_Logout);
"6/verify",                   [ ] api6_Verify);
"6/savetfa",                  [ ] api6_SaveTFA);
"3/deletealltokens",          [ ] api3_DeleteAllTokens);
"3/resetemail",               [ ] api3_ResetEmail);
"3/resetpassword",            [ ] api3_ResetPassword);
"3/referralinfo",             [ ] api3_ReferralInfo);

"5/webcouponcheck",           [ ] api5_WebCouponCheck);
"5/webcouponinfo",            [ ] api5_WebCouponInfo);
"5/webcouponredeem",          [ ] api5_WebCouponRedeem);
"5/webtrialinfo",             [ ] api5_WebTrialInfo);
"5/websalestart",             [ ] api5_WebSaleStart);
"5/webtrialstart",            [ ] api5_WebTrialStart);
"5/webaccountinfo",           [ ] api5_WebAccountInfo);
"5/webreferralinfo",          [ ] api5_WebReferralInfo);
"5/webchangetrialbilling",    [ ] api5_WebChangeTrialBilling);
"5/webchangebilling",         [ ] api5_WebChangeBilling);
"5/weblicensecancel",         [ ] api5_WebLicenseCancel);
"5/webchangeautorenew",       [ ] api5_WebChangeAutorenew);
"5/webresubscribe",           [ ] api5_WebResubscribe);
"5/webclaimreferral",         [ ] api5_WebClaimReferral);
"5/adminforcebigcommerce",    [ ] api5_AdminForceBigCommerce);

"5/periodicrenew",            [ ] api5_PeriodicRenew);

"5/storeweblogin",            [ ] api5_StoreWebLogin);

"3/usersetdnc",               [ ] api3_UserSetDNC);
"3/usergetdnc",               [ ] api3_UserGetDNC);

"3/userclaim",                [ ] api3_UserClaim);
"3/usercreate",               [ ] api3_UserCreate);
"3/userupload",               [ ] api3_UserUpload);
"3/useredit",                 [ ] api3_UserEdit);
"3/usereditcc",               [ ] api3_UserEditCC);
"3/userinfo",                 [ ] api3_UserInfo);
"3/internaluserinfo",         [ ] api3_InternalUserInfo);
"5/prepcc",                   [ ] api5_PrepCC);
"5/usersavecc1",              [ ] api5_UserSaveCC1);
"5/usersavecc2",              [ ] api5_UserSaveCC2);
"3/partneremailinfo",         [ ] api3_PartnerEmailInfo);
"3/partnerlist",              [ ] api3_PartnerList);
"3/partneredit",              [ ] api3_PartnerEdit);
"3/taskadd",                  [ ] api3_TaskAdd);
"3/taskapprove",              [ ] api3_TaskApprove);
"3/usermachinetypes",         [ ] api3_UserMachineTypes);
"3/machinesetname",           [ ] api3_MachineSetName);
"3/machineallocate",          [ ] api3_MachineAllocate);
"3/machinedeallocate",        [ ] api3_MachineDeallocate);
"3/machineslist",             [ ] api3_MachinesList);
"3/profilecreate",            [ ] api3_ProfileCreate);
"3/profiledelete",            [ ] api3_ProfileDelete);
"3/profileedit",              [ ] api3_ProfileEdit);
"3/profileslist",             [ ] api3_ProfilesList);
"3/licenseslist",             [ ] api3_LicensesList);
"4/licensecreate",            [ ] api4_LicenseCreate);
"4/licenseedit",              [ ] api4_LicenseEdit);
"4/companycreate",            [ ] api4_CompanyCreate);
"4/codepurchase",             [ ] api4_CodePurchase);
"3/companyedit",              [ ] api3_CompanyEdit);
*/

export default function (app, logger) {
    app.get("/api/accounts/test", (req, res) => {
        res.json({ message: "Test successful" });
    });

    app.all('/api/accounts/__health', (req, res) => {
        res.status(200).send();
    });

    app.all('/api/accounts/1/*', (req, res) => {
        res.status(200).json({ status: 'NeedsUpgrade' });
    });

    app.all('/api/accounts/2/*', (req, res) => {
        res.status(200).json({ status: 'NeedsUpgrade' });
    });

    app.all('/api/accounts/3/autharc', async (req, res) => {
        try {
            const token = req.query.token;
            if (!token) {
                return res.status(200).json({ status: 'InvalidRequest' });
            }

            const result = await utils.AuthArc(token); // You'll implement this

            if (result.status === 'Success') {
                const exp = result.expiration; // Date object
                const iso = exp.toISOString().replace(/\.\d+Z$/, 'Z');

                res.status(200).json({
                    status: 'Success',
                    userid: result.userid,
                    groups: result.groups,
                    machineids: result.machineids,
                    expiration: iso
                });
            } else {
                res.status(200).json({ status: result.status });
            }
        } catch (e) {
            console.error(e);
            res.status(200).json({ status: 'UnexpectedError' });
        }
    });

    app.all('/api/accounts/3/authapp', async (req, res) => {
        try {
            const token     = req.query.token;
            const machineid = req.query.machineid;

            if (!token || !machineid) {
                return res.status(200).json({ status: 'InvalidRequest' });
            }

            const result = await utils.AuthApp(token, machineid);

            if (result.status === 'Success') {
                const iso = result.expiration.toISOString().replace(/\.\d+Z$/, 'Z');

                res.status(200).json({
                    status: 'Success',
                    userid: result.userid,
                    groups: result.groups,
                    expiration: iso,
                });
            } else {
                res.status(200).json({ status: result.status });
            }
        } catch (err) {
            console.error(err);
            res.status(200).json({ status: 'UnexpectedError' });
        }
    });

    app.all('/api/accounts/3/authroon1', async (req, res) => {
        try {
            const token = req.query.token;
            const machineid = req.query.machineid;

            if (!token || !machineid) {
                return res.status(200).json({ status: 'InvalidRequest' });
            }

            const result = await utils.AuthRoon1(token, machineid);

            if (result.status === 'Success') {
                const iso = result.expiration.toISOString().replace(/\.\d+Z$/, 'Z');

                res.status(200).json({
                    status: 'Success',
                    userid: result.userid,
                    groups: result.groups,
                    expiration: iso,
                });
            } else {
                res.status(200).json({ status: result.status });
            }
        } catch (err) {
            console.error(err);
            res.status(200).json({ status: 'UnexpectedError' });
        }
    });

    app.all('/api/accounts/3/authroon2', async (req, res) => {
        try {
            const { token, machineid } = req.query;

            if (!token || !machineid) {
                return res.status(200).json({ status: "InvalidRequest" });
            }

            const result = await utils.AuthRoon2(token, machineid);

            if (result.status === 'Success') {
                const formattedExpiration = new Date(result.expiration).toISOString().replace(/\.\d+Z$/, 'Z');
                return res.status(200).json({
                    status: "Success",
                    userid: result.userid,
                    groups: result.groups,
                    expiration: formattedExpiration
                });
            } else {
                return res.status(200).json({ status: result.status });
            }
        } catch (e) {
            console.error(e);
            return res.status(200).json({ status: "UnexpectedError" });
        }
    });

    app.all('/api/accounts/3/nch', async (req, res) => {
        try {
            const { b: blob, opt } = req.query;

            if (!blob) {
                return res.status(200).json({ status: "InvalidRequest" });
            }

            if (opt == null) {
                return res.status(200).json({ status: "Success", b: blob });
            } else {
                return res.status(200).json({ status: opt });
            }
        } catch (e) {
            console.error(e);
            return res.status(200).json({ status: "UnexpectedError" });
        }
    });

    app.all('/api/accounts/3/ncr', async (req, res) => {
        try {
            const { b: blob, firstname, lastname, email, password, birthdate, opt, url } = req.query;

            if (!blob || !firstname || !lastname || !email || !password || !birthdate) {
                return res.status(200).json({ status: "InvalidRequest" });
            }

            if (!utils.isValidBirthdate(birthdate.trim())) {
                return res.status(200).json({ status: "InvalidRequest" });
            }

            if (opt == null) {
                return res.status(200).json({ status: "Success", b: blob });
            } else if (opt.toLowerCase() === "gotoweb") {
                if (!url) {
                    return res.status(200).json({ status: "InvalidRequest" });
                }
                return res.status(200).json({ status: "GoToWeb", url });
            } else {
                return res.status(200).json({ status: opt });
            }

        } catch (e) {
            console.error(e);
            return res.status(200).json({ status: "UnexpectedError" });
        }
    });

    app.all('/api/accounts/3/check', async (req, res) => {
        try {
            const token = (req.query.token || "").trim();

            if (token.length > 0) {
                const tokenid = utils.tryParseGuid(token);
                if (!tokenid) {
                    return res.status(200).json({ status: "InvalidRequest" });
                }

                const result = await utils.CheckToken(tokenid);
                if (result.status === 'Success') {
                    return res.status(200).json({
                        status: "Success",
                        userid: result.userid,
                        groups: result.groups
                    });
                } else {
                    return res.status(200).json({ status: result.status });
                }

            } else {
                const email = (req.query.email || "").trim();
                const password = (req.query.password || "").trim();

                if (!email || !password) {
                    return res.status(200).json({ status: "InvalidRequest" });
                }

                const result = await utils.CheckLogin(email, password);
                if (result.status === 'Success') {
                    return res.status(200).json({
                        status: "Success",
                        userid: result.userid,
                        groups: result.groups
                    });
                } else {
                    return res.status(200).json({ status: result.status });
                }
            }

        } catch (e) {
            console.error(e);
            return res.status(200).json({ status: "UnexpectedError" });
        }
    });

    app.all('/api/accounts/3/basicauth', async (req, res) => {
        try {
            const groupParam = req.query.g;
            const reqgroups = groupParam ? groupParam.split(',').filter(g => g.trim() !== '') : [];

            const authHeader = req.headers['authorization'];
            const send401 = (msg) => {
                res.set('www-authenticate', 'Basic realm="Login with your Roon account info"');
                return res.status(401).send(msg || '');
            };

            if (!authHeader || !authHeader.startsWith('Basic ')) {
                return send401();
            }

            const base64 = authHeader.slice(6).trim();
            let decoded;
            try {
                decoded = Buffer.from(base64, 'base64').toString('utf8');
            } catch {
                return send401();
            }

            const sepidx = decoded.indexOf(':');
            if (sepidx <= 0) return send401();

            const username = decoded.substring(0, sepidx);
            const password = decoded.substring(sepidx + 1);

            const result = await utils.CheckLogin(username, password);
            if (result.status !== 'Success') {
                return send401(result.status);
            }

            for (const group of reqgroups) {
                if (!result.groups.includes(group)) {
                    return res.status(403).send('Bad groups');
                }
            }

            return res.status(200).json({
                userid: result.userid,
                groups: result.groups
            });

        } catch (e) {
            console.error(e);
            return res.sendStatus(500);
        }
    });

}
