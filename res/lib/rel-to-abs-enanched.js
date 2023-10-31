/*
 * This library is a fork of the https://github.com/auth0/rel-to-abs
 * but it's a fork which works
 * 
 * Author   : R. Lucignani (scaledra.com)
 * Date     : 13/02/2019
 * 
 * It makes use of the URL class to resolve relative links into absolute links
 * The original version joins the base_url with the current_url without any logic producing wrong links
 * It used the url-join function which has been remove from this version because useless.
 * 
 */


var cheerio = require('cheerio');
const { URL } = require('url')
var debug = false

if (process.env.SCALEDRA_DEBUG) {
    debug = (process.env.SCALEDRA_DEBUG === 'true')
}

function convert(base_url, currentUrl) {
    if (!currentUrl || /^(http?|https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(currentUrl)) {
        if (debug) console.log("DEBUG: Link is already absolute: " + currentUrl)
        return currentUrl;
    }

    if (debug) console.log("DEBUG: Link resolver baseUrl: " + base_url + " - Link: " + currentUrl)
    if (debug) console.log('DEBUG: Resulting URL: ' + new URL(currentUrl, base_url))

    return new URL(currentUrl, base_url).href
    // return urlJoin(base_url, currentUrl);
}

exports.convert = function (html, base_url) {
    if (debug) console.log("**\n*\n* LOGGING: parseLink enanched\n*\n**")
    var $ = cheerio.load(html);
    $('img, script').each(function (index, el) {
        if (!el.attribs['src']) return;
        el.attribs['src'] = convert(base_url, el.attribs['src']);
    });

    $('a, link').each(function (index, el) {
        if (!el.attribs['href']) return;
        try {
            el.attribs['href'] = convert(base_url, el.attribs['href']);
        } catch (e) {
            if (debug) console.log("DEBUG: Link not converted due to an error. Link is: " + el.attribs['href'])
        }
    });

    return $.html();
};
