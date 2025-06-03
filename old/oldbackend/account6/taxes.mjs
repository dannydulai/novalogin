import axios from "axios";
import config from '../config.js';

export function vertex(o) {
    if (o?.groups?.includes("stripe-test")) {
        return {
            clientId:     config.vertexTestClientId,
            clientSecret: config.vertexTestClientSecret,
            baseUrl:      'https://harman.na1.ondemand.vertexinc.com',
        };
    }

    return {
        clientId:     config.vertexClientId,
        clientSecret: config.vertexClientSecret,
        baseUrl:      'https://harman2.na1.ondemand.vertexinc.com'
    }
}

async function getToken(ui) {
    const v   = vertex(ui);
    const params = new URLSearchParams();
    params.append('client_id',     v.clientId);
    params.append('client_secret', v.clientSecret);
    params.append('grant_type',    'client_credentials');
    const res = await axios.post(v.baseUrl + '/oseries-auth/oauth/token', params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return res.data.access_token;
}

// items[]: { sku, qty, price, shipping, tax }
export async function getQuote(ui, shippingAddress, items, currency) {
    const v = vertex(ui);

    // XXX Currency formatter
    if (currency != 'usd') {
        throw new Error('Currency not supported');
    }

    const vertexLineItems = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const vertexItem = {
            // lineItemId:     item.sku, XXX
            unitPrice:      item.price / 100,
            lineItemNumber: i + 1,
            vendorSKU:      item.sku,
            quantity:       {
                value: item.qty,
            },
        }
        vertexLineItems.push(vertexItem);
    }

    const res = await axios.post(v.baseUrl + '/vertex-ws/v2/supplies', {
        transactionType: 'SALE',
        saleMessageType: 'QUOTATION',
        currency: {
            isoCurrencyCodeAlpha: 'USD',
        },
        seller: {
            company: "HINT",
            department: "C3HQ",
            administrativeOrigin: {
                country: "US",
                mainDivision: "CA",
            },
            physicalOrigin: {
                country: "US",
                mainDivision: "CA",
            },
        },
        customer: {
            destination: {
                city:           shippingAddress.city,
                country:        shippingAddress.country,
                postalCode:     shippingAddress.postal_code,
                streetAddress1: shippingAddress.line1,
                mainDivision:   shippingAddress.state,
                ...(shippingAddress.line2 && { streetAddress2: shippingAddress.line2 }),
            },
        },
        postingDate: new Date().toISOString().split('T')[0],
        lineItems: vertexLineItems,
    }, {
        headers: {
            'Authorization': 'Bearer ' + await getToken(ui),
            'Content-Type':  'application/json',
        }
    });
    const quoteLines = res.data.data.lineItems;
    const quoteMap   = {
        lines: {},
        totalTax: res.data.totalTax * 100,
    };
    for (let line of quoteLines) quoteMap.lines[line.vendorSKU] = line.totalTax * 100;
    return quoteMap;

}

