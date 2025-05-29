import requestIp from 'request-ip';

const signs = {
    bif: '₣',
    clp: '$',
    djf: '₣',
    gnf: '₣',
    jpy: '¥',
    kmf: 'CF',
    krw: '₩',
    mga: 'Ar',
    pyg: '₲',
    rwf: '₣',
    ugx: 'Sh',
    vnd: '₫',
    vuv: 'Vt',
    xaf: '₣',
    xof: 'CFA',
    xpf: '₣',
}

// amount should be in smallest unit of currency (e.g. cents)
export function display(amount, currency) {
    switch (currency) {
        case 'usd':
            const d = (amount / 100).toFixed(2);
            return `$${d}`;
        case 'eur':
            const e = (amount / 100).toFixed(2);
            return `€${e}`;
        case 'gbp':
            const g = (amount / 100).toFixed(2);
            return `£${g}`;
        case 'cad':
            const c = (amount / 100).toFixed(2);
            return `C$${c}`;
        case 'aud':
            const a = (amount / 100).toFixed(2);
            return `A$${a}`;

        // Zero-decimal currencies
        // https://docs.stripe.com/currencies?presentment-currency=US#zero-decimal
        case 'jpy':
        case 'bif':
        case 'clp':
        case 'djf':
        case 'gnf':
        case 'jpy':
        case 'kmf':
        case 'krw':
        case 'mga':
        case 'pyg':
        case 'rwf':
        case 'ugx':
        case 'vnd':
        case 'vuv':
        case 'xaf':
        case 'xof':
        case 'xpf':
            const sign = signs[currency];
            return `${sign}${Math.round(amount)}`;
        default:
            throw new Error('Unknown currency');
    }
}

// Stripe uses three-letter ISO currency codes in lowercase.
// https://www.iso.org/iso-4217-currency-codes.html#:~:text=The%20first%20two%20letters%20of,and%20the%20D%20for%20dollar.
export const pricingTable = {
    usd: {
        sign: '$',
        zero:                    { value: 0,     display: '$0.00'   },
        twenty_pct_off_lifetime: { value: 66399, display: '$663.99' },
        lifetime:                { value: 82999, display: '$829.99' },
        monthly:                 { value: 1499,  display: '$14.99'  },
        annual:                  { value: 14988, display: '$149.88' },
        kkboxpromo:              { value: 11990, display: '$119.90' },
    },
    eur: {
        sign: '€',
        zero:                    { value: 0,      display: '€0.00'   },
        twenty_pct_off_lifetime: { value: 73039,  display: '€730.39' },
        lifetime:                { value: 91299,  display: '€912.99' },
        monthly:                 { value: 1699,   display: '€16.99'  },
        annual:                  { value: 16499,  display: '€164.99' },
        kkboxpromo:              { value: 13189,  display: '€131.89' },
    },
    gbp: {
        sign: '£',
        zero:                    { value: 0,      display: '£0.00'   },
        twenty_pct_off_lifetime: { value: 73039,  display: '£730.39' },
        lifetime:                { value: 91299,  display: '£912.99' },
        monthly:                 { value: 1699,   display: '£16.99'  },
        annual:                  { value: 16499,  display: '£164.99' },
        kkboxpromo:              { value: 13189,  display: '£131.89' },
    },
    jpy: {
        sign: '¥',
        zero:                    { value: 0,      display: '¥0'   },
        twenty_pct_off_lifetime: { value: 99598,  display: '¥99598' },
        lifetime:                { value: 124498, display: '¥124498' },
        monthly:                 { value: 2248,   display: '¥2248' },
        annual:                  { value: 22482,  display: '¥22482' },
        kkboxpromo:              { value: 17985,  display: '¥17985' },
    },
};

export function countryToCurrency(country_iso) {
    switch (country_iso) {
        case 'US':
            return 'usd';

        // https://stripe.com/resources/more/which-countries-use-the-british-pound-a-guide-to-where-this-currency-is-used
        case 'GB':// UK (Great Britain, Scotland, Wales, Northern Ireland) XXX Leaving out British Antarctic Territory, gets grouped into AQ (Antarctica)
        case 'IO':// British Indian Ocean Territory
        case 'FK':// Falkland Islands (Malvinas)
        case 'GI':// Gibraltar
        case 'GG':// Guernsey
        case 'IM':// Isle of Man
        case 'JE':// Jersey
        case 'SH':// Saint Helena, Ascension and Tristan da Cunha
        case 'GS':// South Georgia and the South Sandwich Islands
            return 'gbp';

        // https://stripe.com/resources/more/which-countries-use-the-euro-a-guide-to-where-this-currency-is-used
        case 'AT':// Austria
        case 'BE':// Belgium
        case 'HR':// Croatia
        case 'CY':// Cyprus
        case 'EE':// Estonia
        case 'FI':// Finland
        case 'FR':// France
        case 'DE':// Germany
        case 'GR':// Greece
        case 'IE':// Ireland
        case 'IT':// Italy
        case 'LV':// Latvia
        case 'LT':// Lithuania
        case 'LU':// Luxembourg
        case 'MT':// Malta
        case 'NL':// Netherlands
        case 'PT':// Portugal
        case 'SK':// Slovakia
        case 'SI':// Slovenia
        case 'ES':// Spain

        // Not officieally in EU but uses Euro
        case 'AD':// Andorra
        case 'XK':// Kosovo
        case 'MC':// Monaco
        case 'ME':// Montenegro
        case 'SM':// San Marino
        case 'VA':// Vatican City
            return 'eur';


        // Canadian dollars
        case 'CA':
            return 'cad';

        // Australian dollars
        case 'AU':
        case 'CX':// Christmas Island
        case 'CC':// Cocos (Keeling) Islands
        case 'NR':// Nauru
        case 'TV':// Tuvalu
        case 'NF':// Norfolk Island
        case 'KI':// Kiribati
            return 'aud';

        // Japanese yen
        case 'JP':
            return 'jpy';

        // South Korean won
        case 'KR':
            return 'krw';

        default:
            return 'usd';
    }
}

//
// EX Usage: 
// const pricingModel = await pricing(req);
// const price        = pricingModel.lifetime; ( or pricingModel.[name of the offer] )
// const currency     = pricingModel.currency;
// const sign         = pricingModel.sign;
//
export async function pricing(req) {
    try {
        const user_ip     = requestIp.getClientIp(req);
        let user_currency = req.ui.currency || 'usd';

        if (!pricingTable[user_currency]) user_currency = 'usd';

        // Set for subsequent pricing calls during request lifecycle
        req.ui.currency = user_currency;

        return {
            currency: user_currency,
            ...pricingTable[user_currency]
        };

    } catch (e) {
        console.log(e);
        throw new Error('Failed to create pricing object');
    }
}

