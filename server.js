"use strict"

/*
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  hosts: [
    'http://127.0.0.1:9200/'
  ]
});

module.exports = client;linkParser
*/


/*
 * --------------------------------
 * Project references and libraries 
 * --------------------------------
 */



const errorEnums = require(__dirname + "/res/enums/errorTypes");
const jsLinkEnums = require(__dirname + "/res/enums/linkParser");
// var errorClasses = require(__dirname + "/res/lib/httpError");
var scaledraConf = require(__dirname + "/res/scaledra_conf.json");

var waitForAjaxBase_PHANTOMJS = 0
var waitForAjaxBase_PUPPETEER = 0


var ICONV_SUPPORTED_CHARSETS;
var HTML5_TEMPLATE;

var zlib = require('zlib');
const gzip = zlib.createGzip();

var encodeUrl = require('encodeurl');
var Iconv = require('iconv').Iconv;
var charset = require('charset');
var xml2js = require('xml2json');
const Traceroute = require('nodejs-traceroute');

var cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { PendingXHR } = require('pending-xhr-puppeteer');
var express = require('express');
var app = express();

// set json output minified
app.set('json spaces', 0);

var compression = require('compression');
var compareUrls = require('compare-urls');
var phantom = require('phantom');
var phantomStream = require('phantom-render-stream');
var proc = require('process');
var dottie = require('dottie');

const linkConverter = require(__dirname + "/res/lib/rel-to-abs-enhanced.js");
const actionEngine = require(__dirname + "/res/lib/actionsProcessor.js");

const publicIp = require('public-ip');
const find = require('find-process');

// const normalizeUrl = require('normalize-url');
var os = require("os");
var platformOS = require('getos')
var urlParser = require('url');
var mime = require('mime-types')

// Selenium web-driver
const { Builder, Browser, By, Key, until, ChromeOptions } = require('selenium-webdriver')
/*
 * Alternative to follow redirects with https libs
 * include follow-redirects lib
 * change declaration as follow: var http = require('follow-redirects').http;
 */
var http = require('http');
var https = require('https');

// var rootCas = require('ssl-root-cas/latest').create();
var rootCas = require('ssl-root-cas').create();

https.globalAgent.options.ca = rootCas;

var dns = require('dns');

var uuid = require('uuid');

var request = require('request').defaults({ maxRedirects: 3, encoding: null });
// var request = require('request').defaults({ maxRedirects: 3 });

var resizer = require('resizer');
const tidy = require("tidy-html5").tidy_html5

const sanitizeOptions = {
  selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta']
}


/*  
 * Ignore TLS/SSL invalid certificate
 * This setting is used by the filepropeties and navigatestaic methods
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


/*
 * Trap any unhandled error in the core methods
 * TODO: Add loggin to Splunk or ELK
 */
process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    // process.exit(1);
  });



var htmlContent = require('node-readability');
var sanitizeHtml = require('sanitize-html');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Global variables
var privateHostIp
var publicHostIp
var hostname
var proxyEnabled = false

var bodyParser = require('body-parser');
const { notDeepEqual } = require('assert');
const URLParse = require('url-parse');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.disable('x-powered-by')
app.use(compression())

// Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Increare number of listeners for event emiters
require('events').EventEmitter.defaultMaxListeners = Infinity;

var debug = false // default value, set it via environment variable SCALEDRA_DEBUG



/*
 * --------------------------------
 * API/V2 endpoints
 * --------------------------------
 */

/**
 * @api {post} /extractpagecontent Extract relevant content from web pages
 * @apiVersion 0.0.3
 * @apiName PostExtractPageContent
 * @apiGroup v2
 *
 * @apiExample {curl} CURL:
 *     curl -X POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v2/extractpagecontent
 *        -d "url=http://publicnow.com" 
 *        -H "Content-Type: application/x-www-form-urlencoded"
 * 
 * @apiExample {httpie} httpie:
 *     http POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v2/extractpagecontent
 *        -d "url=http://publicnow.com" 
 * 
 *  @apiErrorExample {json} Error-Response:
 * 
 * Example 1:
 *     HTTP/1.1 520 Uknown
 * 
 * {
 *     "error": {
 *         "code": "ENOTFOUND",
 *         "errno": "ENOTFOUND",
 *         "syscall": "queryA",
 *         "hostname": "trilogiqj.com"
 *     }
 * }
 * 
 * Example 2:
 *     HTTP/1.1 520 Uknown
 * 
 * {
 *   "error": "Exceeded maxRedirects. Probably stuck in a redirect loop http://trilogiq.com/pubblication"
 * }
 * 
 * @apiDescription <p style="color: #f00;">(EXPERIMENTAL DON'T USE IN PRODUCTION ENVIRONMENTS)</p> Returns a an html document or a json document cotaining only the relevant text of the page accordingly to the service used (Mercury, Diffbot etc)
 * 
 * @apiParam {String} url The url of the remote resource
 * @apiParam {String} [responseFormat] Possible values are [ json | html ], the default one is "json". 
 * @apiParam {String} [apiKey] The API KEY porvided by the external service supplier. The key can be passed on each request or it can be configured in the scaledra_conf.json file in case of provisioned environments.
 * @apiParam {String} [extractionEngine] It identifies the external enigne to use to extract the content. It can be Mercury, Diffbot or others. The default engine can be configured in the scaledra_conf.json file.
 *
 * @apiSuccessExample Success-Response:
 * 
 * Example 1: Mercury Reader API service
 *     HTTP/1.1 200 OK
 * 
 * {
 *     "title": "Wall St moneymen on IBM Q4 financials: Don't get your hopes up",
 *     "author": "Paul Kunert 22 Jan 2019 at 09:20",
 *     "date_published": "2009-01-22T20:00:00.000Z",
 *     "dek": null,
 *     "lead_image_url": "https://regmedia.co.uk/2019/01/16/shutterstock_cash_bucket.jpg",
 *     "content": "<div id=\"body\"> <p>IBM revenues are expected to shrink for its Q4 of calendar &apos;18 and into 2019 amid worries the mainframe refresh wave has crested and strategic bets still aren&apos;t yet big enough to offset declines in legacy tech.</p> <p>Ahead of IBM reporting financials tomorrow, influential Big Blue watcher Bernstein outlined headline projections: total turnover is tipped to drop 4.2 per cent year-on-year to $21.6bn for three months ended 31 December. Analysts&apos; general consensus is for sales of $21.8bn.</p> <p>&quot;IBM previously guided to currency being about a -2 per cent headwind in Q4, however based on current fluctuations since the last guidance, we now estimate currency headwind may be an incremental 0.4 per cent,&quot; it said.</p> <p>Top brass at IBM were optimistic during the prior financial quarter ended September for software sales to rise, hoping that &quot;solutions&quot; and transaction-processing wares would paper over a dreadful Q3 of software sales. They similarly were estimating improvements in Strategic Imperatives.</p> <p>&quot;We worry that IBM&apos;s expectation for overall software growth and 7 per cent Strategic Imperatives growth (cloud, mobile, social, analytics) for Q4 are unrealistic,&quot; the analyst added in its IBM earnings preview.</p> <p>IBM received a revenue boost from its z14 big iron buying cycle in the past year or so but systems and other related transactional revenue is forecast by Bernstein to dip in the period IBM reports tomorrow night (GMT) and for &quot;at least&quot; the first half of this calendar year.</p> <p>The analyst pointed out that Systems contributed $1bn worth of sales to the Strategic Imperatives in Q4 2017. &quot;In fact, non-systems strategic imperatives growth hovered below 10 per cent throughout FY18, despite a boost in software sales related to the mainframe cycle, and we now think Systems could create an 8 per cent plus headwind for strategic imperatives growth year-on-year in Q4.&quot;</p> <p>The &quot;upshot&quot; is that with Systems adding fewer dollars to those key technologies IBM had bet on, the Strategic Imperatives could grow by low single digits.</p> <p>IBM notched more than 20 quarters of declining sales until it broke that duck in 2018. But even after a relatively positive run of form, IBM has not yet managed to entirely overcome its challenges: clients falling out of love with outsourcing, buying less hardware and not warming to Big Blue&apos;s software portfolio.</p> <p>The Q4 numbers will be <a href=\"https://www.theregister.co.uk/2019/01/23/ibm_q4_2018_full_year/\">reported</a> this evening UK time. &#xAE;</p> </div>",
 *     "next_page_url": null,
 *     "url": "https://www.theregister.co.uk/2019/01/22/ibm_q4_financials_previews/",
 *     "domain": "www.theregister.co.uk",
 *     "excerpt": "Software, Strategic Imperatives found wanting",
 *     "word_count": 389,
 *     "direction": "ltr",
 *     "total_pages": 1,
 *     "rendered_pages": 1
 * }
 * 
 * Example 2: Diffbot article API service
 *    HTTP/1.1 200 OK
 * 
 * {
 * "request": {
 *   "options": [
 *     "_=1548262119511",
 *     "callback=jQuery111107648181141211865_1548262119510",
 *     "format=jsonp"
 *   ],
 *   "pageUrl": "https://www.theregister.co.uk/2019/01/22/ibm_q4_financials_previews/",
 *   "api": "article",
 *   "version": 3
 * },
 * "objects": [
 *     {
 *       "date": "Tue, 22 Jan 2019 09:20:00 GMT",
 *       "images": [
 *         {
 *           "naturalHeight": 432,
 *           "width": 0,
 *           "diffbotUri": "image|3|-2013929710",
 *           "url": "https://regmedia.co.uk/2019/01/16/shutterstock_cash_bucket.jpg",
 *           "naturalWidth": 648,
 *           "primary": true,
 *           "height": 0
 *         }
 *       ],
 *       "author": "Paul Kunert",
 *       "estimatedDate": "Tue, 22 Jan 2019 09:20:00 GMT",
 *       "publisherRegion": "Northern Europe",
 *       "icon": "https://www.theregister.co.uk/design_picker/4ee431b84ac2d23c13376f753522acd7ecbb9b47/graphics/favicons/apple-touch-icon.png",
 *       "diffbotUri": "article|3|-1951361589",
 *       "siteName": "The Register",
 *       "type": "article",
 *       "title": "Wall St moneymen on IBM Q4 financials: Don't get your hopes up",
 *       "tags": [
 *         {
 *           "score": 0.957,
 *           "count": 14,
 *           "label": "IBM",
 *           "uri": "https://diffbot.com/entity/sPdsrDmLiMQCskvBLp_dloQ",
 *           "rdfTypes": [
 *             "http://dbpedia.org/ontology/Agent",
 *             "http://dbpedia.org/ontology/Organisation",
 *             "http://dbpedia.org/ontology/Corporation",
 *             "http://dbpedia.org/ontology/Skill",
 *             "http://dbpedia.org/ontology/Company"
 *           ]
 *         },
 *         {
 *           "score": 0.846,
 *           "count": 2,
 *           "label": "Finance",
 *           "uri": "https://diffbot.com/entity/sGOB9sXRON-ed_PVhIfk61w",
 *           "rdfTypes": [
 *             "http://dbpedia.org/ontology/AcademicSubject",
 *             "http://dbpedia.org/ontology/Skill",
 *             "http://dbpedia.org/ontology/TopicalConcept"
 *           ]
 *         },
 *         {
 *           "score": 0.62,
 *           "count": 6,
 *           "label": "Strategic Imperatives",
 *           "uri": "https://diffbot.com/entity/Omb56fUpdMNeAASyONzvxYA",
 *           "rdfTypes": [
 *             "http://dbpedia.org/ontology/Organisation",
 *             "http://dbpedia.org/ontology/Organization"
 *           ]
 *         }
 *       ],
 *       "publisherCountry": "United Kingdom",
 *       "humanLanguage": "en",
 *       "authorUrl": "https://www.theregister.co.uk/Author/Paul-Kunert",
 *       "pageUrl": "https://www.theregister.co.uk/2019/01/22/ibm_q4_financials_previews/",
 *       "html": "<p>IBM revenues are expected to shrink for its Q4 of calendar '18 and into 2019 amid worries the mainframe refresh wave has crested and strategic bets still aren't yet big enough to offset declines in legacy tech.</p>\n<p>Ahead of IBM reporting financials tomorrow, influential Big Blue watcher Bernstein outlined headline projections: total turnover is tipped to drop 4.2 per cent year-on-year to $21.6bn for three months ended 31 December. Analysts' general consensus is for sales of $21.8bn.</p>\n<p>&quot;IBM previously guided to currency being about a -2 per cent headwind in Q4, however based on current fluctuations since the last guidance, we now estimate currency headwind may be an incremental 0.4 per cent,&quot; it said.</p>\n<p>Top brass at IBM were optimistic during the prior financial quarter ended September for software sales to rise, hoping that &quot;solutions&quot; and transaction-processing wares would paper over a dreadful Q3 of software sales. They similarly were estimating improvements in Strategic Imperatives.</p>\n<p>&quot;We worry that IBM's expectation for overall software growth and 7 per cent Strategic Imperatives growth (cloud, mobile, social, analytics) for Q4 are unrealistic,&quot; the analyst added in its IBM earnings preview.</p>\n<p>IBM received a revenue boost from its z14 big iron buying cycle in the past year or so but systems and other related transactional revenue is forecast by Bernstein to dip in the period IBM reports tomorrow night (GMT) and for &quot;at least&quot; the first half of this calendar year.</p>\n<p>The analyst pointed out that Systems contributed $1bn worth of sales to the Strategic Imperatives in Q4 2017. &quot;In fact, non-systems strategic imperatives growth hovered below 10 per cent throughout FY18, despite a boost in software sales related to the mainframe cycle, and we now think Systems could create an 8 per cent plus headwind for strategic imperatives growth year-on-year in Q4.&quot;</p>\n<p>The &quot;upshot&quot; is that with Systems adding fewer dollars to those key technologies IBM had bet on, the Strategic Imperatives could grow by low single digits.</p>\n<p>IBM notched more than 20 quarters of declining sales until it broke that duck in 2018. But even after a relatively positive run of form, IBM has not yet managed to entirely overcome its challenges: clients falling out of love with outsourcing, buying less hardware and not warming to Big Blue's software portfolio.</p>\n<p>The Q4 numbers will be <a href="https://www.theregister.co.uk/2019/01/23/ibm_q4_2018_full_year/">reported</a> this evening UK time. &reg;</p>",
 *       "text": "IBM revenues are expected to shrink for its Q4 of calendar '18 and into 2019 amid worries the mainframe refresh wave has crested and strategic bets still aren't yet big enough to offset declines in legacy tech.\nAhead of IBM reporting financials tomorrow, influential Big Blue watcher Bernstein outlined headline projections: total turnover is tipped to drop 4.2 per cent year-on-year to $21.6bn for three months ended 31 December. Analysts' general consensus is for sales of $21.8bn.\n"IBM previously guided to currency being about a -2 per cent headwind in Q4, however based on current fluctuations since the last guidance, we now estimate currency headwind may be an incremental 0.4 per cent," it said.\nTop brass at IBM were optimistic during the prior financial quarter ended September for software sales to rise, hoping that "solutions" and transaction-processing wares would paper over a dreadful Q3 of software sales. They similarly were estimating improvements in Strategic Imperatives.\n"We worry that IBM's expectation for overall software growth and 7 per cent Strategic Imperatives growth (cloud, mobile, social, analytics) for Q4 are unrealistic," the analyst added in its IBM earnings preview.\nIBM received a revenue boost from its z14 big iron buying cycle in the past year or so but systems and other related transactional revenue is forecast by Bernstein to dip in the period IBM reports tomorrow night (GMT) and for "at least" the first half of this calendar year.\nThe analyst pointed out that Systems contributed $1bn worth of sales to the Strategic Imperatives in Q4 2017. "In fact, non-systems strategic imperatives growth hovered below 10 per cent throughout FY18, despite a boost in software sales related to the mainframe cycle, and we now think Systems could create an 8 per cent plus headwind for strategic imperatives growth year-on-year in Q4."\nThe "upshot" is that with Systems adding fewer dollars to those key technologies IBM had bet on, the Strategic Imperatives could grow by low single digits.\nIBM notched more than 20 quarters of declining sales until it broke that duck in 2018. But even after a relatively positive run of form, IBM has not yet managed to entirely overcome its challenges: clients falling out of love with outsourcing, buying less hardware and not warming to Big Blue's software portfolio.\nThe Q4 numbers will be reported this evening UK time. ®"
 *     }
 *   ],
 *   "url": "https://www.theregister.co.uk/2019/01/22/ibm_q4_financials_previews/"
 * }
 * 
 * 
 */

app.post('/api/v2/extractpagecontent', function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  const start = new Date()
  var url = req.body.url
  var redirectChain = []

  if (debug) console.log("method v2/extractpagecontent: " + url);

  // Evaluate URL params
  var urlParams = urlParser.parse(encodeURI(url), true)
  if (urlParams.port === null && urlParams.protocol === "http:") {
    urlParams.port = 80
  } else if (urlParams.port === null && urlParams.protocol === "https:") {
    urlParams.port = 443
  }


  try {
    dns.resolve4(urlParams.hostname, function (err, addresses) { // Check if the domain exists
      if (err) {
        // ERROR: Unable to resolve url domain
        generateErrorResponse(err, res, errorEnums.errors.dns);
      } else {

        if (scaledraConf.extensions.mercuryReaderApiKey) {

          try {
            var mercury = require('mercury-parser')(scaledraConf.extensions.mercuryReaderApiKey);

            mercury.parse(url).then(response => {
              var extractedContent = HTML5_TEMPLATE
              extractedContent = extractedContent.replaceAll("__CODE_FRAGMENT__", response.content)
              extractedContent = extractedContent.replace("__WEBSITE__", "<a href=\"" + url + "\">" + url + "</a>")

              res.setHeader('Content-type', 'text/html');
              res.send(extractedContent)

              // res.setHeader('Content-type', 'application/json');
              // res.send(response)

            }
            ).catch(err => {
              console.log('Error: ', err);
            })

          } catch (error) {
            generateErrorResponse(error, res, errorEnums.errors.exception)
          } finally {
            mercury = undefined
          }

        } else {
          generateErrorResponse("No API KEY provided", res, errorEnums.errors.customError);
        }

      }

    })
  } catch (error) {
    generateErrorResponse(error, res, errorEnums.errors.exception)
    // console.log("fileproperties: error occurred while retrieving file properties")
  }
})


/**
 * @api {post} /fileproperties Get file properties
 * @apiVersion 0.0.3
 * @apiName PostFileProperties
 * @apiGroup v2
 *
 * @apiExample {curl} CURL:
 *     curl -X POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v2/fileproperties
 *        -d "url=http://publicnow.com" 
 *        -H "Content-Type: application/x-www-form-urlencoded"
 * 
 * @apiExample {httpie} httpie:
 *     http POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v2/fileproperties
 *        -d "url=http://publicnow.com" 
 * 
 *  @apiErrorExample {json} Error-Response:
 * 
 * Example 1:
 *     HTTP/1.1 520 Uknown
 * {
 *     "error": {
 *         "code": "ENOTFOUND",
 *         "errno": "ENOTFOUND",
 *         "syscall": "queryA",
 *         "hostname": "trilogiqj.com"
 *     }
 * }
 * 
 * Example 2:
 *     HTTP/1.1 520 Uknown
 * {
 *   "error": "Exceeded maxRedirects. Probably stuck in a redirect loop http://trilogiq.com/pubblication"
 * }
 * 
 * @apiDescription Return the mime-type of a remote resource with evidence of the redirects occurred to reach the resource. The redirectionChain chain element is always empty in the v1 version. If you want to follow redirects and get the complete redirectionChain data user the v2 instead.
 * 
 * @apiParam {String} url The url of the remote resource
 *
 * @apiSuccess {Object[]} responseTime contains values for: startTime, endTime and elapsedTime in ms
 * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
 * @apiSuccess {String} url The url of the remote resource
 * @apiSuccess {Object[]} redirectionChain This object in the v2 version is always empty, no redirects are followed by this method. If you don't provide a url of an existing resource no contentType, contentLenght, contentDisposition or lastModified are returned
 * @apiSuccess {String} content-type The mime content-type of the remote resource reached through the redirection chain
 * @apiSuccess {String} content-length The size in Kb of the documented returned (This value can be missing if not provided by the remote server)
 * @apiSuccess {String} content-disposition Indicates the suggested name for the remote resource to be saved locally (This value can be missing if not provided by the remote server)
 * 
 * @apiSuccessExample Success-Response:
 * 
 * Example 1:
 *     HTTP/1.1 200 OK
 * {
 *     "responseTime": {
 *         "startTime": "2017-10-27T14:36:39.256Z",
 *         "endTime": "2017-10-27T14:36:39.733Z",
 *         "elapsedTime": 477
 *     },
 *     "correlationId": "3e590e50-bb24-11e7-9c65-4b8c519e63ca",
 *     "url": "https://www.latam.com/en_us/press-room/releases/LATAMBostontosaopaulo2018/",
 *     "redirectionChain"; [],
 *     "content-type": "text/html; charset=UTF-8",
 *     "last-modified": "Mon, 25 Sep 2017 09:47:43 GMT"
 * }		
 *
 * Example 2:
 *     HTTP/1.1 200 OK 
 * {
 *     "responseTime": {
 *         "startTime": "2017-10-23T15:32:07.084Z",
 *         "endTime": "2017-10-23T15:32:08.361Z",
 *         "elapsedTime": 1277
 *     },
 *     "correlationId": "55d504d0-bb24-11e7-9c65-4b8c519e63ca",
 *     "url": "http://medicarerights.org/pdf/093015-joint-ltr-partb-premiums.pdf",
 *     "redirectionChain"; [],
 *     "contentType": "application/pdf",
 *     "contentLength": "1756990",
 *     "contentDisposition": "inline; filename=093015-joint-ltr-partb-premiums.pdf"
 *     "lastModified": "Mon, 25 Sep 2017 09:47:43 GMT"
 * }
 * 
 * Example 3:
 *    HTTP/1.1. 200 OK
 * {
 *     "responseTime": {
 *         "startTime": "2017-10-23T15:30:16.404Z",
 *         "endTime": "2017-10-23T15:30:16.787Z",
 *         "elapsedTime": 383
 *     },
 *     "url": "http://www.theregister.co.uk/2017/10/23/vodafone_gsm_gateway_evidence_surrey_police_op_callahan/",
 *     "redirectionChain": [],
 *     "content-type": "text/html; charset=UTF-8",
 *     "last-modified": "Mon, 25 Sep 2017 09:47:43 GMT"
 * }
 * 
 */

app.post('/api/v2/fileproperties', function (req, res) {
  executeV2fileproperties(req, res);
})

/* --------------------------------------------------------------------- */

function executeV2fileproperties(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const start = new Date()
  var url = req.body.url
  var redirectChain = []

  if (debug) console.log("method v2/fileproperties: " + url);

  var urlParams = urlParser.parse(encodeURI(url), true)

  var jsonResponse;


  // Assign the port
  if (urlParams.port === null && urlParams.protocol === "http:") {
    urlParams.port = 80
  } else if (urlParams.port === null && urlParams.protocol === "https:") {
    urlParams.port = 443
  }

  // TODO: Implement request method HEAD/GET as parameter for the request
  var options = {
    method: scaledraConf.helperMethods.fileproperties.defaultHttpMethod,
    host: urlParams.hostname,
    port: urlParams.port,
    path: urlParams.path,
    rejectUnauthorized: false,
    headers: scaledraConf.globals.commonHttpHeaders
  };

  if (debug) console.log("DEBUG: performing request with headers: " + JSON.stringify(options.headers, null, 2));

  /*
   * an HEAD request could be performed but some servers are configured to return the 
   * ['content-type'] only in case of GET requests
   */

  try {
    dns.resolve4(urlParams.hostname, function (err, addresses) { // Check if the domain exists




      if (err) {
        // ERROR: Unable to resolve url domain
        generateErrorResponse(err, res, errorEnums.errors.dns);
      } else {



        if (urlParams.protocol === "http:") {
          try {
            var req = http.request(options, function (response) {
              const finish = new Date();
              jsonResponse = fileJsonResponse(response.headers, url, start, finish, response);

              console.log(`STATUS: ${response.statusCode}`);
              console.log(`HEADERS: ${JSON.stringify(response.headers)}`);

              response.setEncoding('utf8');
              res.setHeader('Content-type', 'application/json');
              res.send(jsonResponse);


              response.on('end', () => {
                console.log('No more data in response.');
              });

            }
            )
              .on('error', function (err) {
                generateErrorResponse(err, res, errorEnums.errors.exception);
              })
          } catch (err) {
            // console.log("Parse error" + err);
            generateErrorResponse(error, res, errorEnums.errors.exception)
          }
          // req.end();

        }
      }

      if (urlParams.protocol === 'https:') {

        var req = https.request(options, function (response) {
          const finish = new Date();
          jsonResponse = fileJsonResponse(response.headers, url, start, finish, response);

          res.setHeader('Content-type', 'application/json');
          res.send(jsonResponse);
        }
        )
          .on('error', function (err) {
            generateErrorResponse(err, res, errorEnums.errors.exception);
          })

        req.end();

      }
    })
  } catch (error) {
    console.log("DEBUG: Error " + error)
    generateErrorResponse(error, res, errorEnums.errors.exception)
    // console.log("fileproperties: error occurred while retrieving file properties")
  }
}

/*---------------------------------------------------------------------- */



/**
   * @api {post} /navigate Navigate page
   * @apiVersion 0.0.2
   * @apiName PostNavigate
   * @apiGroup v2
   *
   * @apiExample {curl} CURL:
   *     curl -X POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v2/navigate
   *        -d "url=http://publicnow.com"
   *        -d "forceBody=false" 
   *        -d "renderFormat=json"
   *        -H "content-type: application/x-www-form-urlencoded"
   * 
   * @apiExample {httpie} httpie:
   *     http POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v2/navigate
   *        url="http://publicnow.com"
   *        forceBody="false"
   *        renderFormat=json
   * 
   * @apiDescription Return a JSON document containing the code of the page rendered via Google Puppeteer engine, the redirection chain occurred to reach the resource, all the response headers and all the query paramters
   * 
   * @apiParam {String} url The url of the remote resource
   * @apiParam {Boolean} [forceBody] Force the service to return the page body content even if a navigation redirection has occurred. Default is 'false' (TODO)
   * @apiParam {String} [renderFormat] Set the pageBody content type, paramter can be 'plainText', 'json', 'content' or 'html'. If not specified default value is 'json'. Html returns the raw content of the html page not emebdded inside a json document.
   * @apiParam {Integer} [waitForAjax] Set the time in ms to wait before returning the page. During this timme the rendering engine continues to execute the code page. It's useful on sites that loads content as AJAX action after the page has been loaded. If not specified default value is 0 (TODO)
   * @apiParam {Boolean} [removePageScripts] If true stripes-out all the 'script' elements from the page. Default is false (TODO)
   * @apiParam {Integer} [getFrameContentId] Returns the code of the specified frame id
   * @apiParam {String} [sessionCookie] Specifies the Cookie values to inject into the request. Some pages requires a policy agreement in order to open properly, with this paramteres it's possibile to pass it directly into the request.
   * @apiParam {String} [forcePageEncoding] Allows to force a specific charset encoding for a given url, in case PHS is not able to properly detect it
   * @apiParam {String} [actionPlaybook] It's an optional script which allows page transformations and actions execution on the page like, buttons click, type in a text box, expand a tree view etc. for more information about the actionPlaybook read the <a href="http://www.scaledra.com/doc/actionplaybooks/action_Playbooks_documentation.pdf">actionPlaybook documentation here</a>
   * @apiParam {Integer} [jsLinkParser] Specifies if the javascript link resolver should be triggered or not. Possibile values are: 0:Off 3:Simple 5:Full. 'Simple' resolve simple windows.open scripts, 'Full' aims to resolve the output of any javascript output.
   * * @apiParam {Integer} [includeOriginalHtml] Speciifies whenever or not the originalHtml field is returned in the response
   * 
   * @apiSuccess {Object[]} responseTime Contains values for: startTime, endTime and elapsedTime in ms
   * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
   * @apiSuccess {String} nodeServerPid PID of the nodejs process that served the request
   * @apiSuccess {String} hostname Hostname of the host the PHS service is running on
   * @apiSuccess {String} publicIp Public IP used by the service to navigate the remote page
   * @apiSuccess {String} privateIp Private IP of the host running the service if initialized during process start, if not it will be not present
   * @apiSuccess {String} layoutEngine The framework used to render the page code
   * @apiSuccess {String} url Webpage URL provided in the 'url' parameter
   * @apiSuccess {String} landingUrl The landing url obtained aftyer navigating the web page. If a redirection occurred 'startingUrl' and 'finalUrl' will be different
   * @apiSuccess {Boolean} urlRedirectStrict 'True' if the comparsion of 'startingUrl' and 'finalUrl' reveals a difference at string level
   * @apiSuccess {Boolean} urlRedirectSmart A comparison of 'startingUrl' and 'finalUrl' performed by the compare-url function. For more info visit: https://www.npmjs.com/package/compare-urls
   * @apiSuccess {Object[]} Te palybook execution results, including the final execution status and the single action execution time
   * @apiSuccess {Object[]} redirectionChain An array containing all the redirection steps that may occur during the web page navigation
   * @apiSuccess {Object[]} httpResponseHeaders An array containing all the response headers
   * @apiSuccess {String} remoteHost Remote host name
   * @apiSuccess {String} remotePort Remote host port (default is 80)
   * @apiSuccess {String} remoteUri The rempte resource uri
   * @apiSuccess {Object[]} remoteQueryParams An array contaning all the query string paramters
   * @apiSuccess {String} urlFragment The "fragment" portion of the URL including the pound-sign (#)
   * @apiSuccess {String} httpScheme The remote server protocol, it can be http or https
   * @apiSuccess {Boolean} forceBody The value of the 'forceBody' parameter provided in the call
   * @apiSuccess {String} renderFormat The requested format to return the 'pageBody' field
   * @apiSuccess {String} orignalPageEncoding The page encoding of the page as received by 
   * @apiSuccess {Boolean} navigationViaProxy Indicates if navigation has been performed via an external proxy
   * @apiSuccess {Integer} hasFrames Indicates If the page contain frames. Frames content is not returned in the 'pageBody' field
   * @apiSuccess {String} pageBody The JSON escaped content of the web page
   * 
   * @apiSuccessExample Success-Response:
   *      HTTP/1.1. 301 Moved Permanently
   *{
   *    "responseTime": {
   *        "startTime": "2019-01-23T17:03:27.442Z",
   *        "endTime": "2019-01-23T17:03:34.370Z",
   *        "elapsedTime": 6928
   *    },
   *    "correlationId": "d1d04790-1f30-11e9-874b-5f524a86a428",
   *    "nodeServerPid": 24406,
   *    "hostname": "madghigno-ThinkPad-T420",
   *    "publicIp": "84.14.71.226",
   *    "privateIp": [
   *        "10.3.1.109"
   *    ],
   *    "aws": {},
   *    "layoutEngine": "Puppeteer (HeadlessChrome/73.0.3679.0)",
   *    "url": "https://www.gopresto.com/content/s/financial-information-form-4-and-press-releases",
   *    "landingUrl": "https://www.gopresto.com/content/s/financial-information-form-4-and-press-releases",
   *    "urlRedirectStrict": false,
   *    "urlRedirectSmart": false,
   *    "actionPlaybook": {
   *        "header": {
   *            "scriptName": "Grab content",
   *            "author": "R. Lucignani",
   *            "version": "1.0.0",
   *            "description": "Fix a rendering problem accessing directly the final page in puppeteer"
   *        },
   *        "actions": [
   *            {
   *                "action": {
   *                    "type": "grabInnerHtmlContent",
   *                    "selector": "#main_content_area > div > div > div > div > form:nth-child(4) > p > select",
   *                    "transformHtmlTag": {
   *                        "enabled": true,
   *                        "begin": {
   *                            "from": "<option value=",
   *                            "to": "<a href="
   *                        },
   *                        "end": {
   *                            "from": "</option>",
   *                            "to": "</a><br />"
   *                        }
   *                    },
   *                    "waitTime": 0,
   *                    "enabled": true,
   *                    "description": "Grab the press releases option list and converts <option> tag to hyperlinks ",
   *                    "result": "OK"
   *                    "executionTime": 3
   *                }
   *            }
   *        ]
   *    },
   *    "redirectionChain": [
   *        {
   *            "httpCode": 200,
   *            "httpDescription": 200,
   *            "httpUrl": "https://www.gopresto.com/content/s/financial-information-form-4-and-press-releases"
   *        }
   *    ],
   *    "httpResponseHeaders": [
   *        {
   *            "name": "date",
   *            "value": "Wed, 23 Jan 2019 17:03:28 GMT"
   *        },
   *        {
   *            "name": "server",
   *            "value": "Apache"
   *        },
   *        {
   *            "name": "x-frame-options",
   *            "value": "SAMEORIGIN"
   *        },
   *        {
   *            "name": "set-cookie",
   *            "value": "PHPSESSID=rdsol23518u6ll9567h3v34fq2; path=/"
   *        },
   *        {
   *            "name": "expires",
   *            "value": "Thu, 19 Nov 1981 08:52:00 GMT"
   *        },
   *        {
   *            "name": "cache-control",
   *            "value": "no-store, no-cache, must-revalidate"
   *        },
   *        {
   *            "name": "pragma",
   *            "value": "no-cache"
   *        },
   *        {
   *            "name": "x-ua-compatible",
   *            "value": "IE=Edge,chrome=1"
   *        },
   *        {
   *            "name": "x-xss-protection",
   *            "value": "1; mode=block"
   *        },
   *        {
   *            "name": "vary",
   *            "value": "Accept-Encoding"
   *        },
   *        {
   *            "name": "content-encoding",
   *            "value": "gzip"
   *        },
   *        {
   *            "name": "content-length",
   *            "value": "6910"
   *        },
   *        {
   *            "name": "keep-alive",
   *            "value": "timeout=5, max=100"
   *        },
   *        {
   *            "name": "connection",
   *            "value": "Keep-Alive"
   *        },
   *        {
   *            "name": "content-type",
   *            "value": "text/html; charset=utf-8"
   *        }
   *    ],
   *    "remoteHost": "www.gopresto.com",
   *    "remotePort": 443,
   *    "remoteUri": "/content/s/financial-information-form-4-and-press-releases",
   *    "urlFragment": null,
   *    "httpScheme": "https:",
   *    "forceBody": true,
   *    "renderFormat": "json",
   *    "originalPageEncoding": "utf-8",
   *    "hasFrames": 1,
   *    "navigationViaProxy": false,
   *    "pageBody": "",
   *    "originalHtml": ""
   * }
   *
   */
app.post('/api/v2/navigate', function (req, res) {

  // chain = chain.then(async () => {
  const start = new Date();

  var url = req.body.url
  var renderFormat = 'json'
  var waitForAjax = waitForAjaxBase_PUPPETEER
  var removePageScripts = false
  var smartRedirect = false
  var strictRedirect = false
  var hasFrames = 0
  var frameId = 0
  var pageActions
  var pageContent
  var jsParsingType = jsLinkEnums.parser.simple
  var skipTidyOutput = false;
  var skipLinkParametersParser = false;
  var userDefinedProxy = undefined;
  var extractedFields = {};
  var cookies;

  var actionPlaybookPlayed = false  // Indicates if an action playbook altered or performed actions on the oiriginal URL page

  if (debug) console.log("method v2/navigate (puppeteer): " + url);

  // res.setHeader('Content-Type', 'application/json')  

  var jsonParams = JSON.parse(JSON.stringify(req.body, null, 2))


  if (typeof req.body.jsLinkParser !== 'undefined') {
    jsParsingType = parseInt(req.body.jsLinkParser)
  }

  if (typeof req.body.removePageScripts !== 'undefined') {
    removePageScripts = (req.body.removePageScripts === 'true')
  }

  if (typeof req.body.getFrameContentId !== 'undefined') {
    frameId = parseInt(req.body.getFrameContentId)
  }

  if (typeof req.body.forceBody !== 'undefined') {
    var forceBody = (req.body.forceBody === 'true')
  } else {
    var forceBody = false
  }

  if (typeof req.body.sessionCookie !== "undefined") {
    if (debug) console.log("DEBUG: session cookie declared: " + req.body.sessionCookie);
    cookies = req.body.sessionCookie;
  }

  if (req.body.renderFormat) {
    renderFormat = req.body.renderFormat
  }

  if (req.body.waitForAjax) {
    waitForAjax = parseInt(req.body.waitForAjax) + waitForAjaxBase_PUPPETEER
  }

  // Check if an actionPlaybook has been defdined
  if (typeof req.body.actionPlaybook !== "undefined" && req.body.actionPlaybook !== "" && req.body.actionPlaybook !== null) {
    try {
      pageActions = JSON.parse(req.body.actionPlaybook)

      if (typeof pageActions.globals !== 'undefined') {

        // actionPlaybook overrides the request jsParsingType
        if (pageActions.globals.hasOwnProperty('jsLinkParserStrategy')) {
          jsParsingType = parseInt(pageActions.globals.jsLinkParserStrategy);
        }

        // Check if there's a user defined proxy in the actionPlaybook
        if (pageActions.globals.hasOwnProperty('useProxyServer')) {
          userDefinedProxy = pageActions.globals.useProxyServer;
        }

        if (pageActions.globals.hasOwnProperty('skipTidyOutput')) {
          skipTidyOutput = pageActions.globals.skipTidyOutput;
          if (skipTidyOutput === false) {
            // Apply tidy to the output if global section is present and skipTidyOutput is set to false
            actionPlaybookPlayed = true;
          }
        }

        if (pageActions.globals.hasOwnProperty('skipLinkParametersParser')) {
          skipLinkParametersParser = pageActions.globals.skipLinkParametersParser;
        }
      }
    } catch (e) {
      var err = new Error();
      err.message = "Check your actionPlaybook syntax"
      generateErrorResponse(err, res, errorEnums.errors.customError)
    } finally {
      // DO NOTHING
    }
  }


  if (typeof url === 'undefined') { // url parameter missing
    res.status(520) // As per Cloudflare 5xx errors space
    var json = JSON.stringify({ "error": "missing URL parameter" })
    res.send(json)
  } else {


    var redirectChain = [];
    var httpResponseHeaders;
    var firstHttpStatusCode;
    var landingUrl = null
    var landingStatus = null
    var tmp

    const onResponseHandler = (resource) => {
      if (typeof httpResponseHeaders === 'undefined') {
        if (typeof firstHttpStatusCode === 'undefined') {
          firstHttpStatusCode = resource._status
          if (firstHttpStatusCode === 403 || firstHttpStatusCode === 404) {
            landingUrl = url
          }
          // console.log("First http return code: " + firstHttpStatusCode)
        }
        if (tmp !== resource._url) {
          // console.log(resource.url)
          tmp = "Valore resource URL: " + resource._url
          redirectChain.push({ httpCode: resource._status, httpDescription: resource._status, httpUrl: resource._url })
        }

        if (typeof httpResponseHeaders === 'undefined' && checkForGoodHttpResponseCodes(resource._status)) {
          httpResponseHeaders = resource._headers
          landingUrl = resource._url
          landingStatus = resource._status

        }
      }
    };

    let proxyServerLocal = undefined;

    if (userDefinedProxy !== undefined) {
      proxyServerLocal = userDefinedProxy
    } else {
      if (scaledraConf.protocols.httpProxyConfig.proxyUrl !== "") {
        proxyServerLocal = scaledraConf.protocols.httpProxyConfig
      } else {
        proxyServerLocal = Object();
        proxyServerLocal.proxyUrl = "";
        proxyServerLocal.proxyAuthUser = "";
        proxyServerLocal.proxyAuthPassword = "";  
      }
    }



    // if (scaledraConf.protocols.httpProxyConfig.proxyUrl !== "") {

    //   if (userDefinedProxy !== undefined) {
    //     proxyServerLocal = userDefinedProxy
    //   } else {
    //     proxyServerLocal = scaledraConf.protocols.httpProxyConfig
    //   }

    //   // var proxyData = urlParser.parse(scaledraConf.protocols.httpProxyConfig.proxyUrl, true);
    //   // var proxyConfig = proxyData.hostname + ":" + proxyData.port;
    // } else {
    //   proxyServerLocal = Object();
    //   proxyServerLocal.proxyUrl = "";
    //   proxyServerLocal.proxyAuthUser = "";
    //   proxyServerLocal.proxyAuthPassword = "";

    //   // proxyConfig = "";
    // }

    // var proxyConfig = prepareProxyConfigUrl(userDefinedProxy);

    (async () => {
      const browser = await puppeteer.launch({
        headless: true,
        timeout: scaledraConf.globals.responseTimeoutMs,
        ignoreHTTPSErrors: true,
        dumpio: false,
        // slowMo: 250,
        args: [
          '--user-data-dir=""',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          // '--use-gl',
          '--disable-gpu',
          '--font-render-hinting=medium',
          '--proxy-server=' + proxyServerLocal.proxyUrl
          // '--remote-debugging-port=9222'
        ]
        // devtools: true
      });
      console.log(proxyServerLocal);
      // slowMo:10    To simulate human behavior

      const page = await browser.newPage();

      await page.authenticate({
        username: proxyServerLocal.proxyAuthUser,
        password: proxyServerLocal.proxyAuthPassword
      });

      const pendingXHR = new PendingXHR(page);

      // await page.setJavaScriptEnabled(true)
      await page.setCacheEnabled(scaledraConf.navigationEngines.puppeteer.enableCaching)
      await page.emulateMedia('screen');
      await page.setViewport({
        width: 1280,
        height: 4000
      });

      // Default method http headers
      var defaultRequestHeaders = {
        "Accept-Encoding": "gzip, deflate"
      }


      if (typeof req.body.sessionCookie !== 'undefined' && req.body.sessionCookie !== null) {
        // Adds the session cookie to the request          
        defaultRequestHeaders['Cookie'] = req.body.sessionCookie

      }

      // Resulting http headers 
      if (typeof pageActions !== 'undefined' && pageActions.hasOwnProperty("globals") && pageActions.globals.hasOwnProperty('overrideHttpHeaders')) {
        defaultRequestHeaders = Object.assign(defaultRequestHeaders, scaledraConf.globals.commonHttpHeaders, pageActions.globals.overrideHttpHeaders);
      } else {
        defaultRequestHeaders = Object.assign(defaultRequestHeaders, scaledraConf.globals.commonHttpHeaders);
      }

      // Replace dynamic header values with values from URL parameters
      var urlParams = urlParser.parse(url, true)
      defaultRequestHeaders = actionEngine.replaceDynamicHeadersFromUrl(urlParams, defaultRequestHeaders);
      console.log(urlParams);

      await page.setExtraHTTPHeaders(defaultRequestHeaders)


      /* */
      // await page.waitFor(15000);
      await page.setRequestInterception(true);

      // Block V8 javascirpt execution
      // await page.setJavaScriptEnabled(false);

      page.setMaxListeners(0);
      // Page response events
      page.on('response', onResponseHandler);

      page.on('uncaughtException', () => {
        page.close();
        generateErrorResponse(err, res, errorEnums.errors.customError);
      })

      page.on('unhandledRejection', () => {
        page.close();
        generateErrorResponse(err, res, errorEnums.errors.customError);
      })

      // Page request events
      page.on('request', interceptedRequest => {

        var abortRequest = evaluateRequestBlockTerms(interceptedRequest._url)

        if (['image', 'stylesheet', 'font', 'fetch'].indexOf(interceptedRequest.resourceType()) !== -1 || abortRequest === true) {
          // interceptedRequest.continue();
          interceptedRequest.abort();
          if (debug) console.log("aborted request: " + interceptedRequest._url);
        } else {
          interceptedRequest.continue();
          if (debug) console.log("accepted request: " + interceptedRequest._url + " - " + interceptedRequest.resourceType());
        }
      })
      /*    
          
  
          interceptedRequest.continue();
        });
        */

      url = checkIfUrlEncoded(url)

      try {

        const htmlCode = await page.goto(url,
          {
            // TODO: Verify if expose these paramters externally
            waitUntil: 'networkidle0',
            // waitUntil: 'networkidle2',
            timeout: 180000
          });
        await pendingXHR.waitForAllXhrFinished();
        /*
      var cookies = await page.cookies();
      console.log(cookies);
        */
        /*
      const cookies = [
        {
          'domain': 'www.intrasense.fr',
          'expires': -1,
          'httpOnly': false,
          'name': 'wpml_browser_redirect_test',
          'path': '/news-events',
          'secure': false,
          'session': true,
          'value': '0'
        },
        {
          'domain': '.www.intrasense.fr',
          'expires': 1527293051,
          'httpOnly': false,
          'name': '_icl_visitor_lang_js',
          'path': '/',
          'secure': false,
          'session': false,
          'value': 'en-us'
        }
      ];
 
      await page.setCookie(...cookies);
      */

        /*
          const cookies = [
            {
              'domain': 'www.dbrs.com',
              'expires': -1,
              'httpOnly': false,
              'name': 'allowGDPR',
              'path': '/',
              'secure': false,
              'session': true,
              'value': '1'
            }
          ];
          

        await page.setCookie(...cookies);
          */
        // default waitforAjax value




        await page.waitFor(waitForAjax)
        if (debug) console.log("DEBUG: waitForAjax value is: " + waitForAjax)
        if (debug) console.log("DEBUG: pending XHR requests after page render: " + pendingXHR.pendingXhrCount());
        /* 
         * Perform an action on the page
         * Actions are not performed to iframe/frame contents while selected
         * they apply to main page only
         */

        var extractedFields = {}

        var execStart;
        var execEnd;

        var _originalHtml = ""

        // var myCode = await page.content();
        // Get the HTML/V8 engines output
        pageContent = await page.frames()[frameId].content();
        var $ = cheerio.load(pageContent);

        // preserve the original HTML code returned by the web server
        if (typeof req.body.includeOriginalHtml !== 'undefined' && req.body.includeOriginalHtml === 'true') {
          _originalHtml = pageContent.replace(/\\r|\\t|\\n/g);
        }

        if (typeof pageActions !== 'undefined' && pageActions.hasOwnProperty('actions')) {
          for (var i = 0; i < pageActions.actions.length; i++) {
            if (pageActions.actions[i].action.enabled === true) {
              try {

                execStart = new Date();

                switch (pageActions.actions[i].action.type) {

                  /*
                   *
                   * action name  : snedClick
                   * action family: action
                   *
                   */
                  case "sendClick":
                    await page.click(pageActions.actions[i].action.selector)
                    await page.waitFor(pageActions.actions[i].action.waitTime)

                    // reload the latest html code after the action execution
                    pageContent = await page.frames()[frameId].content();
                    $ = cheerio.load(pageContent);

                    pageActions.actions[i].action.result = 'OK'

                    execEnd = new Date();
                    pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

                    if (debug)
                      console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4) + " - OK")
                    break

                  /*
                   *
                   * action name  : typeText
                   * action family: action
                   *
                   */
                  case "typeText":
                    await page.type(pageActions.actions[i].action.selector, pageActions.actions[i].action.value)
                    await page.waitFor(pageActions.actions[i].action.waitTime)

                    // reload the latest html code after the action execution
                    pageContent = await page.frames()[frameId].content();
                    $ = cheerio.load(pageContent);

                    pageActions.actions[i].action.result = 'OK'

                    execEnd = new Date();
                    pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

                    if (debug)
                      console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
                    break

                  /*
                   *
                   * action name  : sendKeyEnter
                   * action family: action
                   *
                   */
                  case "sendKeyEnter":
                    await page.keyboard.press(String.fromCharCode(13));
                    await page.waitFor(pageActions.actions[i].action.waitTime)

                    // reload the latest html code after the action execution
                    pageContent = await page.frames()[frameId].content();
                    $ = cheerio.load(pageContent);

                    pageActions.actions[i].action.result = 'OK'

                    execEnd = new Date();
                    pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

                    if (debug)
                      console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
                    break

                  /*
                   *
                   * action name  : selectMenuItem
                   * action family: action
                   *
                   */
                  case "selectMenuItem":
                    // await page.waitForSelector(pageActions.actions[i].action.selector)
                    await page.select(pageActions.actions[i].action.selector, pageActions.actions[i].action.value)
                    await page.waitFor(pageActions.actions[i].action.waitTime)

                    // reload the latest html code after the action execution
                    pageContent = await page.frames()[frameId].content();
                    $ = cheerio.load(pageContent);

                    pageActions.actions[i].action.result = 'OK'

                    execEnd = new Date();
                    pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

                    if (debug)
                      console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
                    break

                  /*
                   *
                   * action name  : grabInnerElementContent
                   * action family: content
                   *
                   */
                  case "grabInnerElementContent":

                    pageContent = actionEngine.executeAction(pageActions, i, pageContent, HTML5_TEMPLATE, debug);

                    $ = cheerio.load(pageContent);
                    actionPlaybookPlayed = true;

                    break;



                  /*
                   *
                   * action name  : grabInnerHtmlContent
                   * action family: content
                   *
                   */
                  case "grabInnerHtmlContent":

                    pageContent = actionEngine.executeAction(pageActions, i, pageContent, HTML5_TEMPLATE, debug);

                    $ = cheerio.load(pageContent);
                    actionPlaybookPlayed = true;

                    break;

                  /*
                   *
                   * action name  : alterHtmlElement
                   * action family: content
                   *
                   */
                  case "alterHtmlElement":
                    pageContent = actionEngine.executeAction(pageActions, i, pageContent, HTML5_TEMPLATE, debug);

                    $ = cheerio.load(pageContent);
                    actionPlaybookPlayed = true;

                    break;

                  /*
                   *
                   * action name  : removeHtmlElement
                   * action family: content
                   *
                   */
                  case "removeHtmlElement":
                    pageContent = actionEngine.executeAction(pageActions, i, pageContent, HTML5_TEMPLATE, debug);

                    $ = cheerio.load(pageContent)
                    actionPlaybookPlayed = true

                    break;

                  /*
                   *
                   * action name  : htmlElementsToField
                   * action family: content
                   *
                   */
                  case "htmlElementsToField":


                    pageContent = actionEngine.executeAction(pageActions, i, pageContent, HTML5_TEMPLATE, debug);

                    $ = cheerio.load(pageContent);
                    actionPlaybookPlayed = true;

                    break;

                  /*
                   *
                   * action name  : mergeHtmlElements
                   * action family: content
                   *
                   */
                  case "mergeHtmlElements":

                    pageContent = actionEngine.executeAction(pageActions, i, pageContent, HTML5_TEMPLATE, debug);

                    $ = cheerio.load(pageContent);
                    actionPlaybookPlayed = true;

                    break;

                  /*
                   *
                   * action name  : extractFieldValue
                   * action family: metadata
                   *
                   */
                  case "extractFieldValue":


                    var _tempField = actionEngine.executeAction(pageActions, i, pageContent, HTML5_TEMPLATE, debug);

                    extractedFields[Object.keys(_tempField)[0]] = _tempField[Object.keys(_tempField)[0]];



                    // var element = await page.$(pageActions.actions[i].action.selector);
                    // var extractedField = await page.evaluate(element => element.textContent, element);
                    // var fieldName = pageActions.actions[i].action.fieldName

                    // extractedFields[fieldName] = extractedField.trim()

                    // pageActions.actions[i].action.result = 'OK'

                    // execEnd = new Date();
                    // pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

                    // if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))

                    break


                  default:
                    pageActions.actions[i].action.result = 'NOT APPLIED. Check action definition'

                    if (debug)
                      console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
                    break
                }
              } catch (e) {
                pageActions.actions[i].action.result = 'FAILED'

                if (debug)
                  console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
              }
            }
          }
        }

        /*
        // Get the height of the rendered page
        const bodyHandle = await page.$('body');
        const { height } = await bodyHandle.boundingBox();
        await bodyHandle.dispose();

        // Scroll one viewport at a time, pausing to let content load
        const viewportHeight = page.viewport().height;
        let viewportIncr = 0;
        while (viewportIncr + viewportHeight < height) {
          await page.evaluate(_viewportHeight => {
            window.scrollBy(0, _viewportHeight);
          }, viewportHeight);
          await wait(20);
          viewportIncr = viewportIncr + viewportHeight;
        }

        */

        // Scroll back to top
        /*
        await page.evaluate(_ => {
          window.scrollTo(0, 0);
        });
        */

        // Some extra delay to let images load
        // await wait(4000);


        res.setHeader('Content-Type', 'application/json');
        var redirectionChain = cleanRedirectChain(redirectChain)
        console.log(redirectChain);

        if (!checkForGoodHttpResponseCodes(redirectionChain[redirectionChain.length - 1].httpCode)) {

          var err = new Error();
          switch (redirectionChain[redirectionChain.length - 1].httpCode) {

            case 400:
              err.statusMessage = "Bad request";
              err.statusCode = 400;
              generateErrorResponse(err, res, errorEnums.errors.http);
              break;

            case 403:
              err.statusMessage = "Forbidden";
              err.statusCode = 403;
              generateErrorResponse(err, res, errorEnums.errors.http);
              break;

            case 404:
              err.statusMessage = "Not Found";
              err.statusCode = 404;
              generateErrorResponse(err, res, errorEnums.errors.http);
              break;

            case 500:
              err.statusMessage = "Internal Server Error";
              err.statusCode = 500;
              generateErrorResponse(err, res, errorEnums.errors.http);
              break;

          }

        } else {


          if (landingUrl === null) {
            // If null it takes the last url in the redirection chain
            landingUrl = redirectChain[redirectChain.length - 1].httpUrl;
          }
          var urlParams = urlParser.parse(landingUrl, true)

          if (urlParams.port === null && urlParams.protocol === "http:") {
            urlParams.port = 80
          } else if (urlParams.port === null && urlParams.protocol === "https:") {
            urlParams.port = 443
          }

          // Define queryparams if presents
          if (JSON.stringify(urlParams.query) === "{}") {
            var queryParams
          } else {
            var queryParams = urlParams.query
          }


          // Evaluate redirect flgags
          url = decodeURIComponent(url)
          landingUrl = decodeURIComponent(landingUrl)



          var json
          // Evaluate presence of frames and iframes in the page
          hasFrames = page.frames().length - 1;

          // const finish = new Date();
          // const executionTime = (finish.getTime() - start.getTime());


          // Replace the page content with fragment extracted by actions
          if (actionPlaybookPlayed) {
            if (skipTidyOutput) {
              pageContent = actionEngine.formatOutputPage(pageContent, landingUrl, pageActions.globals.skipTidyOutput);
            } else {
              pageContent = actionEngine.formatOutputPage(pageContent, landingUrl, false);
            }
          }

          // pageContent = htmlCode.text();

          var urlPath = urlParams.pathname
          // var baseElementBody = addBaseElement(pageContent, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")) + "/") // Add base html element for relative links
          // var baseElementBody = addBaseElement(pageContent, urlParams.protocol + "//" + urlParams.host) // Add base html element for relative links
          // var baseElementBody = pageContent

          console.log("Type of httpResponseHeaders: " + JSON.stringify(typeof request));
          if (typeof httpResponseHeaders["content-type"] !== 'undefined') {
            var encodingResults = getPageEncoding(req, httpResponseHeaders['content-type'], pageContent)
          } else {
            // If missing it assumes text/html by default
            var encodingResults = getPageEncoding(req, "text/html; charset=utf-8", pageContent)
          }

          if (!skipLinkParametersParser) {
            encodingResults.pageContent = completeParameterLinks(encodingResults.pageContent, urlParams, jsParsingType);
          } else {
            if (debug) console.log('DEBUG: completeParameterLinks step skipped');
          }

          console.log(urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")) + "/")

          // Check if there is a "base" element declared for the links
          // if (encodingResults.pageContent.indexOf("<base href") === -1) {
          if (typeof $('base').attr('href') == 'undefined') {
            // If NOT assumes the website root to complete links
            var baseElementBody = addBaseElement(encodingResults.pageContent, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")) + "/") // Add base html element for relative links
            var contentBody = linkConverter.convert(baseElementBody, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/") + 1))

          } else {
            // If DECLARED uses the base element declaration

            var baseLink = $('base').attr('href');
            // var baseLink = docDom.window.document.querySelector("base").getAttribute("href")
            if (baseLink === "/") { // Fix local base references
              var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + "//" + urlParams.host)
            } else {
              if (baseLink.indexOf("http") === -1) { // fix base url without protocol and host
                if (baseLink.substring(0, 1) === '/') baseLink = baseLink.substring(1, baseLink.length - 1) // Avoid doubble slashes
                var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + "//" + urlParams.host + "/" + baseLink)
              } else {
                // var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + '//' + urlParams.hostname)
                var contentBody = linkConverter.convert(encodingResults.pageContent, baseLink)
              }
            }
            // docDom = null
            // console.log(docDom)

          }

          if (removePageScripts) {
            contentBody = removeScript(contentBody)
          }


          if (!compareUrls(url, landingUrl)) {
            smartRedirect = true;
          }

          if ((url !== landingUrl)) {
            strictRedirect = true;
            if (!forceBody) {
              contentBody = ""
            }
          }

          const finish = new Date();
          const executionTime = (finish.getTime() - start.getTime());

          // TODO: bug - manage redirect flags to populate or not the contentBody to return

          /*
          if (extractedContent) {
            contentBody = extractedContent
          }
          */

          if (Object.keys(extractedFields).length === 0) {
            extractedFields = undefined
          }

          if (renderFormat === 'html') {
            // var normalizedHeaders = normalizeHttpResponseHeaders(httpResponseHeaders);

            // for (let i =0; i < normalizedHeaders.length; i++) {
            //     if (normalizedHeaders[i].name === 'content-type') res.setHeader("Content-Type", normalizedHeaders[i].value);
            // }

            // if (res._headers['content-type'] === "") res.setHeader("Content-Type", "text/html")
            res.setHeader("Content-Type", "text/html");
            res.send(contentBody)
          } else if (renderFormat === 'plainText') {
            const dom = new JSDOM(sanitizeHtml(await htmlCode.text()), sanitizeOptions)
            res.setHeader("Content-Type", "text/plain")
            res.send(dom.window.document.querySelector("body").textContent)

          } else {
            var json = JSON.stringify({
              "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
              "correlationId": uuid.v1(),
              "nodeServerPid": proc.pid,
              "hostname": hostname,
              "publicIp": publicHostIp,
              "privateIp": privateHostIp,
              "aws": { availabilityZone: process.env.AWS_AVAILABILITY_ZONE },
              "layoutEngine": "Puppeteer (" + await browser.version() + ")",
              "url": req.body.url,
              "landingUrl": landingUrl,
              "urlRedirectStrict": strictRedirect,
              "urlRedirectSmart": smartRedirect,
              "actionPlaybook": pageActions,
              "redirectionChain": cleanRedirectChain(redirectChain),
              "httpResponseHeaders": normalizeHttpResponseHeaders(httpResponseHeaders),
              "remoteHost": urlParams.host,
              "remotePort": urlParams.port,
              "remoteUri": urlParams.pathname,
              "remoteQueryParams": queryParams,
              "urlFragment": urlParams.hash,
              "httpScheme": urlParams.protocol,
              "forceBody": forceBody,
              "renderFormat": renderFormat,
              "originalPageEncoding": encodingResults.pageEncoding,
              "hasFrames": hasFrames,
              "navigationViaProxy": proxyEnabled,
              "extractedFields": extractedFields,
              "pageBody": contentBody,
              "originalHtml": _originalHtml
            })

            res.send(json)
          }
          await page.close();
          await browser.close();



        }
      } catch (e) {
        generateErrorResponse(e, res, errorEnums.errors.exception);
        // console.log(e);
        await page.close()
        await browser.close();
      }

    }

    )(); // Here Async close

  }

})

function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

/*
* --------------------------------
* API/V1 endpoints
* --------------------------------
*/


/**
   * @api {get} /healthcheck Health Check
   * @apiVersion 0.0.1
   * @apiName GetHealthCheck
   * @apiGroup v0
   *
   * @apiExample {curl} CURL:
   *     curl -X GET 
   *        http://phs.noodls.net/api/v1/healthcheck
   * 
   * @apiExample {httpie} httpie:
   *     http POST 
   *        http://phs.noodls.net/api/v1/healthcheck
   * 
   * @apiDescription Return a short message if the service is up and running. The call can be used in distributed environemnt to satisfy load balancer health check activity.
   * 
   * @apiSuccess {String} status Returns "Alive" if the service is up and running
   * 
   * @apiSuccessExample Success-Response:
   * {
   *     "status": "Alive"
   * }
   *
   */
app.get('/api/v1/healthcheck', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  var response = JSON.stringify({
    "status": "Alive"
  })

  res.status(200).send(response);
})

/**
   * @api {post} /traceroute Return the network traceroute for a given address
   * @apiVersion 0.0.1
   * @apiName PostTraceroute
   * @apiGroup v1
   *
   * @apiExample {curl} CURL:
   *     curl -X POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v1/traceroute
   *        -d "url=http://publicnow.com"
   *        -H "content-type: application/x-www-form-urlencoded"
   * 
   * @apiExample {httpie} httpie:
   *     http POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v1/traceroute
   *        url="http://publicnow.com"
   * 
   * @apiDescription Return a JSON document an array of HOPS wiht IP e and RTT (ms) to reeach the destination
   * 
   * @apiParam {String} url The url of the remote resource
   *
   * 
   * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
   * @apiSuccess {Object[]} responseTime contains values for: startTime, endTime and elapsedTime in ms
   * @apiSuccess {String} hostname The name of the host that served the request
   * @apiSuccess {String} nodejsPid The process id fo the nodejs server
   * @apiSuccess {String} publicIp The public IP the service uses to navigate pages
   * @apiSuccess {String} privateIp of the nodejs instance, multiple ip can be returned
   * @apiSuccess {Object[]} tracerouteData an array containing all the traceroute information for each hop
   * 
   * @apiSuccessExample Success-Response:
   *      HTTP/1.1. 200 OK
   * 
   *   "responseTime": {
   *     "startTime": "2020-03-04T15:21:20.089Z",
   *     "endTime": "2020-03-04T15:21:20.196Z",
   *     "elapsedTime": 107
   *   },
   *   "correlationId": "ccde8040-5e2b-11ea-aaf9-6989a0cca4c0",
   *   "tracerouteResult": [
   *     {
   *       "hop": 1,
   *       "ip": "54.93.0.209",
   *       "rtt_ms": 7.919
   *     },
   *     {
   *       "hop": 2,
   *       "ip": "100.66.0.252",
   *       "rtt_ms": 19.885
   *     },
   *     {
   *       "hop": 3,
   *       "ip": "100.66.8.192",
   *       "rtt_ms": 12.413
   *     },
   *     {
   *       "hop": 4,
   *       "ip": "100.66.10.140",
   *       "rtt_ms": 13.516
   *     },
   *     {
   *       "hop": 5,
   *       "ip": "100.66.7.161",
   *       "rtt_ms": 19.194
   *     },
   *     {
   *       "hop": 6,
   *       "ip": "100.66.4.23",
   *       "rtt_ms": 13.973
   *     },
   *     {
   *       "hop": 7,
   *       "ip": "100.65.10.1",
   *       "rtt_ms": 0.221
   *     },
   *     {
   *       "hop": 8,
   *       "ip": "52.93.23.121",
   *       "rtt_ms": 1.511
   *     },
   *     {
   *       "hop": 9,
   *       "ip": "54.239.107.114",
   *       "rtt_ms": 4.155
   *     },
   *     {
   *       "hop": 10,
   *       "ip": "100.91.37.86",
   *       "rtt_ms": 9.095
   *     },
   *     {
   *       "hop": 11,
   *       "ip": "100.91.37.64",
   *       "rtt_ms": 9.508
   *     },
   *     {
   *       "hop": 12,
   *       "ip": "52.93.134.120",
   *       "rtt_ms": 8.995
   *     },
   *     {
   *       "hop": 13,
   *       "ip": "52.95.60.110",
   *       "rtt_ms": 9.221
   *     },
   *     {
   *       "hop": 14,
   *       "ip": "52.95.60.66",
   *       "rtt_ms": 9.11
   *     },
   *     {
   *       "hop": 15,
   *       "ip": "52.95.60.21",
   *       "rtt_ms": 9.016
   *     },
   *     {
   *       "hop": 16,
   *       "ip": "104.31.2.163",
   *       "rtt_ms": 9.164
   *     }
   *   ],
   *   "hostname": "ip-172-31-21-229",
   *   "nodejsPid": 18386,
   *   "aws": {},
   *   "publicIp": "3.120.182.196",
   *   "privateIp": [
   *     "172.31.21.229"
   *   ]
   * }
   *
   */
app.post('/api/v1/traceroute', function (req, res) {

  const start = new Date();

  res.setHeader('Content-Type', 'application/json');
  var url = req.body.url;
  var urlParams = urlParser.parse(url, true);
  var hops = [];

  if (debug) console.log("method v1/traceroute: " + url);

  try {
    const tracer = new Traceroute();
    tracer
      .on('pid', (pid) => {
        // console.log(`pid: ${pid}`);
      })
      .on('destination', (destination) => {

        // console.log(`destination: ${destination}`);
      })
      .on('hop', (hop) => {
        // Modifies the hop response format
        hop.rtt_ms = parseFloat(hop.rtt1.replace(" ms", ""));
        delete hop.rtt1;
        hops.push(hop);
      })
      .on('close', (code) => {

        const finish = new Date();
        const executionTime = (finish.getTime() - start.getTime());

        var json = JSON.stringify({
          "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
          "correlationId": uuid.v1(),
          "tracerouteResult": hops,
          "hostname": os.hostname(),
          "nodejsPid": proc.pid,
          "aws": { availabilityZone: process.env.AWS_AVAILABILITY_ZONE },
          "publicIp": publicHostIp,
          "privateIp": privateHostIp
        })

        res.send(json);

      });

    tracer.trace(urlParams.hostname);

  } catch (error) {
    generateErrorResponse(error, res, errorEnums.errors.exception);
  }

})






/**
   * @api {post} /dnslookup DNS name lookup
   * @apiVersion 0.0.4
   * @apiName PostDNSLookup
   * @apiGroup v1
   *
   * @apiExample {curl} CURL:
   *     curl -X POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v1/lookup
   *        -d "url=http://publicnow.com"
   *        -H "content-type: application/x-www-form-urlencoded"
   * 
   * @apiExample {httpie} httpie:
   *     http POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v1/dnslookup
   *        url="http://publicnow.com"
   * 
   * @apiDescription Return a JSON document containing details about the DNS entries for a given URL, including ipv4, ipv6 and aliases
   * 
   * @apiParam {String} url The url of the remote resource
   *
   * 
   * @apiSuccess {Object[]} aliases A list of aliases associated to the given URL host
   * @apiSuccess {Object[]} ipv4 An array containing all the ipv4 addresses associated to the givel URL host
   * @apiSuccess {Object[]} ipv6 An array containing all the ipv6 addresses associated to the givel URL host
   * 
   * @apiSuccessExample Success-Response:
   *      HTTP/1.1. 200 OK
   * 
   * {
   *    "correlationId": "b00e3600-c88f-11e8-ace2-99472808cac3",
   *    "hostname": "publicnow.com",
   *    "ipv4": [
   *        "104.31.2.163",
   *        "104.31.3.163"
   *    ],
   *    "ipv6": [
   *        "2606:4700:31::681f:3a3",
   *        "2606:4700:31::681f:2a3"
   *    ],
   *    "responseTime": {
   *        "elapsedTime": 187,
   *        "endTime": "2018-10-05T11:13:29.440Z",
   *        "startTime": "2018-10-05T11:13:29.253Z"
   *    }
   * }
   *
   */
app.post('/api/v1/dnslookup', function (req, res) {

  if (debug) console.log("method v1/dnslookup: " + url);

  try {

    const start = new Date();

    var url = req.body.url;
    url = checkIfUrlEncoded(url);

    var urlParams = urlParser.parse(url, true)

    dns.resolve6(urlParams.host, (errv6, address) => {
      var ipv6_addresses = address

      dns.resolve4(urlParams.host, (errv4, address) => {
        var ipv4_addresses = address

        dns.resolveCname(urlParams.host, (errcname, aliases, family) => {
          var host_aliases = aliases

          const finish = new Date();
          const executionTime = (finish.getTime() - start.getTime());

          // Raise an error only if the error code is different from ENODATA (no ipv4 data available)
          if ((errv4) && (errv4.code != 'ENODATA')) {
            generateErrorResponse(errv4, res, errorEnums.errors.dns);
          } else {

            var response = JSON.stringify({

              "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
              "correlationId": uuid.v1(),
              "hostname": urlParams.host,
              "ipv6": ipv6_addresses,
              "ipv4": ipv4_addresses,
              "aliases": host_aliases

            })
            res.setHeader('Content-Type', 'application/json')
            res.send(response)
          }
        });

      });
    });

  } catch (error) {
    generateErrorResponse(error, res, errorEnums.errors.exception);
  }

})


/**
 * @api {get} /charsets Supported charstes
 * @apiSampleRequest /charsets
 * @apiVersion 0.2.2
 * @apiName GetCharsets
 * @apiGroup v0
 *
 * @apiExample {curl} CURL:
 *     curl -X GET
 *        http://us-va-phantomjs-1.noodls.net/api/v0/charsets
 * 
 * @apiExample {httpie} httpie:
 *     http GET
 *        http://us-va-phantomjs-1.noodls.net/api/v0/charsets
 * 
 * @apiDescription Returns the supported charsets in the v0/naviagte methods for the the "forcePageEncoding" parameter
 * 
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "correlationId": "33879e30-126a-11e9-a64e-33be5d168ccb",
 *     "responseTime": {
 *         "elapsedTime": 0,
 *         "endTime": "2019-01-07T10:51:35.183Z",
 *         "startTime": "2019-01-07T10:51:35.183Z"
 *     },
 *     "supportedCharsetsCount": 420,
 *     "supportedCharsets": [
 *         "ansi_x3.4-1968",
 *         "ansi_x3.4-1986",
 *         "ascii",
 *         "cp367",
 *         "ibm367",
 *         "iso-ir-6",
 *         "iso646-us",
 *         "iso_646.irv:1991",
 *         "us",
 *         "us-ascii",
 *         "csascii",
 *         "utf-8",
 *         "iso-10646-ucs-2",
 *         "ucs-2",
 *         "csunicode",
 *         "ucs-2be",
 *         "unicode-1-1",
 *         "unicodebig",
 *         ...
 *     ]
 * }
 * *
 */

app.get('/api/v0/charsets', function (req, res) {
  const start = new Date();


  res.setHeader('Content-Type', 'application/json');
  var hostname = os.hostname();
  var pjson = require('./package.json');


  const finish = new Date();
  const executionTime = (finish.getTime() - start.getTime());

  platformOS(function (e, os) {
    var json = JSON.stringify({
      "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
      "correlationId": uuid.v1(),
      "supportedCharsetsCount": ICONV_SUPPORTED_CHARSETS.length,
      "supportedCharsetsList": ICONV_SUPPORTED_CHARSETS
    })

    res.end(json);
  })

});

/**
   * @api {post} /navigate Navigate static
   * @apiVersion 0.0.5
   * @apiName PostNavigateStatic
   * @apiGroup v0
   *
   * @apiExample {curl} CURL:
   *     curl -X POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v0/navigate
   *        -d "url=http://publicnow.com"
   *        -d "forceBody=false" 
   *        -d "renderFormat=html"
   *        -H "content-type: application/x-www-form-urlencoded"
   * 
   * @apiExample {httpie} httpie:
   *     http POST 
   *        http://us-va-phantomjs-1.noodls.net/api/v0/navigate
   *        url="http://publicnow.com"
   *        forceBody="false"
   *        renderFormat=html
   * 
   * @apiDescription Return a JSON document containing the code of the page rendered via Static Browser engine, the redirection chain occurred to reach the resource, all the response headers and all the query parameters. This navigation method is faster the dynamic one and it's warmly suggested when the page doens't require client javascript execution.
   * 
   * @apiParam {String} url The url of the remote resource
   * @apiParam {Boolean} [forceBody] Force the service to return the page body content even if a navigation redirection has occurred. Default is 'false' (TODO)
   * @apiParam {String} [renderFormat] Set the pageBody content type, paramter can be 'plainText', 'json', 'content' or 'html'. If not specified default value is 'json'. Html returns the raw content of the html page not emebdded inside a json document.
   * @apiParam {Integer} [waitForAjax] Set the time in ms to wait before returning the page. During this timme the rendering engine continues to execute the code page. It's useful on sites that loads content as AJAX action after the page has been loaded. If not specified default value is 0 (TODO)
   * @apiParam {Boolean} [removePageScripts] If true stripes-out all the 'script' elements from the page. Default is false (TODO)
   * @apiParam {String} [sessionCookie] Specifies the Cookie values to inject into the request. Some pages requires a policy agreement in order to open properly, with this paramteres it's possibile to pass it directly into the request.
   * @apiParam {String} [forcePageEncoding] Allows to force a specific charset encoding for a given url, in case PHS is not able to properly detect it
   * @apiParam {String} [actionPlaybook] It's an optional script which allows page transformations and actions execution on the page like, buttons click, type in a text box, expand a tree view etc. for more information about the actionPlaybook read the <a href="http://www.scaledra.com/doc/actionplaybooks/action_Playbooks_documentation.pdf">actionPlaybook documentation here</a>
   * @apiParam {Integer} [jsLinkParser] Speciifies if the javascript link resolver should be triggered or not. Possibile values are: 0:Off 3:Simple 5:Full. 'Simple' resolve simple windows.open scripts, 'Full' aims to resolve the output of any javascript output.
   * @apiParam {Integer} [includeOriginalHtml] Speciifies whenever or not the originalHtml field is returned in the response
   * 
   * @apiSuccess {Object[]} responseTime Contains values for: startTime, endTime and elapsedTime in ms
   * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
   * @apiSuccess {String} nodeServerPid PID of the nodejs process that served the request
   * @apiSuccess {String} hostname Hostname of the host the PHS service is running on
   * @apiSuccess {String} publicIp Public IP used by the service to navigate the remote page
   * @apiSuccess {String} privateIp Private IP of the host running the service if initialized during process start, if not it will be not present
   * @apiSuccess {String} layoutEngine The framework used to render the page code
   * @apiSuccess {String} url Webpage URL provided in the 'url' parameter
   * @apiSuccess {String} landingUrl The landing url obtained aftyer navigating the web page. If a redirection occurred 'startingUrl' and 'finalUrl' will be different
   * @apiSuccess {Boolean} urlRedirectStrict 'True' if the comparsion of 'startingUrl' and 'finalUrl' reveals a difference at string level
   * @apiSuccess {Boolean} urlRedirectSmart A comparison of 'startingUrl' and 'finalUrl' performed by the compare-url function. For more info visit: https://www.npmjs.com/package/compare-urls
   * @apiSuccess {Object[]} Te palybook execution results, including the final execution status and the single action execution time
   * @apiSuccess {Object[]} redirectionChain An array containing all the redirection steps that may occur during the web page navigation
   * @apiSuccess {Object[]} httpResponseHeaders An array containing all the response headers
   * @apiSuccess {String} remoteHost Remote host name
   * @apiSuccess {String} remotePort Remote host port (default is 80)
   * @apiSuccess {String} remoteUri The rempte resource uri
   * @apiSuccess {Object[]} remoteQueryParams An array contaning all the query string paramters
   * @apiSuccess {String} urlFragment The "fragment" portion of the URL including the pound-sign (#)
   * @apiSuccess {String} httpScheme The remote server protocol, it can be http or https
   * @apiSuccess {Boolean} forceBody The value of the 'forceBody' parameter provided in the call
   * @apiSuccess {String} renderFormat The requested format to return the 'pageBody' field
   * @apiSuccess {String} orignalPageEncoding The page encoding of the page as received by 
   * @apiSuccess {Boolean} navigationViaProxy Indicates if navigation has been performed via an external proxy
   * @apiSuccess {Integer} hasFrames Indicates If the page contain frames. Frames content is not returned in the 'pageBody' field
   * @apiSuccess {String} pageBody The JSON escaped content of the web page
   * 
   * @apiSuccessExample Success-Response:
   *      HTTP/1.1. 301 Moved Permanently
   * {
   *     "responseTime": {
   *         "startTime": "2017-10-23T15:32:58.186Z",
   *         "endTime": "2017-10-23T15:33:01.129Z",
   *         "elapsedTime": 2943
   *     },
   *     "correlationId": "26e52390-bb23-11e7-a5e7-87745a274b1e",* 
   *     "nodeServerPid": 9392,
   *     "hostname": "lucignanir-w7",
   *     "publicIp": "84.14.71.226",
   *     "privateIp": "192.168.x.x",
   *     "layoutEngine": "Puppeteer",
   *     "url": "http://publicnow.com",
   *     "landingUrl": "https://www.publicnow.com/home",
   *     "urlRedirectStrict": true,
   *     "urlRedirectSmart": true,
   *     "actionPlaybook": {
   *         "header": {
   *             "scriptName": "Transform JSON to HTML table",
   *             "author": "R. Lucignani",
   *             "version": "1.0.0",
   *             "description": "This a JSON to HTML mapping example"
   *         },
   *         "actions": [
   *             {
   *                 "action": {
   *                     "type": "jsonToHtmlMapping",
      *                     "dataRoot": "data",
   *                     "fieldsMapping": [
   *                         {
   *                             "sourceFiled": "headline",
   *                             "fieldLabel": "Pressrelease title",
   *                             "fieldQualificator": "text"
   *                         },
   *                         {
   *                             "sourceFiled": "timestamp",
   *                             "fieldLabel": "Pubblication date",
   *                             "fieldQualificator": "timestamp"
   *                         },
   *                         {
   *                             "sourceFiled": "htmlUrl",
   *                             "fieldLabel": "Link to pressrelease",
   *                             "fieldQualificator": "link"
   *                         }
   *                     ],
   *                     "waitTime": 0,
   *                     "enabled": true,
   *                     "description": "Map a JSON document record fields to HTML table columns",
   *                     "result": "OK",
   *                     "executionTime": 3
   *                 }
   *             }
   *         ]
   *     },
   *     "redirectionChain": [
   *         {
   *             "httpCode": 301,
   *             "httpDescription": "Moved Permanently",
   *             "httpUrl": "http://publicnow.com/"
   *         },
   *         {
   *             "httpCode": 302,
   *             "httpDescription": "Found",
   *             "httpUrl": "https://www.publicnow.com/"
   *         },
   *         {
   *             "httpCode": 301,
   *             "httpDescription": "Moved Permanently",
   *             "httpUrl": "https://www.publicnow.com/home.aspx"
   *         },
   *         {
   *             "httpCode": 200,
   *             "httpDescription": "OK",
   *             "httpUrl": "https://www.publicnow.com/home"
   *         }
   *     ],
   *     "httpResponseHeaders": [
   *         {
   *             "name": "Date",
   *             "value": "Tue, 10 Oct 2017 10:55:02 GMT"
   *         },
   *         {
   *             "name": "Content-Type",
   *             "value": "text/html; charset=utf-8"
   *         },
   *         {
   *             "name": "Transfer-Encoding",
   *             "value": "chunked"
   *         },
   *         {
   *             "name": "Connection",
   *             "value": "keep-alive"
   *         },
   *         {
   *             "name": "Cache-Control",
   *             "value": "public"
   *         },
   *         {
   *             "name": "X-AspNet-Version",
   *             "value": "4.0.30319"
   *         },
   *         {
   *             "name": "X-Powered-By",
   *             "value": "ASP.NET"
   *         },
   *         {
   *             "name": "Server",
   *             "value": "cloudflare-nginx"
   *         },
   *         {
   *             "name": "CF-RAY",
   *             "value": "3ab90b876b3d3dbf-MXP"
   *         }
   *     ],
   *     "remoteHost": "www.publicnow.com",
   *     "remotePort": 80,
   *     "remoteUri": "/home",
   *     "remoteQueryParams": {},
   *     "httpScheme": "https:",
   *     "forceBody": false,
   *     "renderFormat": "json",
   *     "hasFrames": false,
   *     "pageBody": "",
   *     "originalHtml": ""
   * }
   *
   */
app.post('/api/v0/navigate', function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  const start = new Date();
  var url = req.body.url;
  var redirectChain = [];
  var smartRedirect = false;
  var strictRedirect = false;
  var hasFrames = 0;
  var renderFormat = 'json';
  var landingUrl = url;
  var removePageScripts;
  var pageActions = "";
  var requestMethod = 'GET';
  var actionPlaybookPlayed = false;  // Indicates if an action playbook altered or performed actions on the oiriginal URL page
  var actionPlaybookPassthrough = false; // Indicates if a playbook executed in content passthrough mode
  var requestPayLoad;
  var jsonRequest = false;
  var requestAdditionalHeaders = '';
  var jsParsingType = jsLinkEnums.parser.simple;
  var skipLinkParametersParser = false;
  var extractedFields = {};
  var gzipSupport = scaledraConf.navigationEngines.static.enableGzipSupport;
  var skipTidyOutput = false;
  var passThroughContentDelivered = false;
  var userDefinedProxy = undefined;

  if (typeof req.body.jsLinkParser !== 'undefined') {
    jsParsingType = parseInt(req.body.jsLinkParser)
  }

  if (typeof req.body.forceBody !== 'undefined') {
    var forceBody = (req.body.forceBody === 'true')
  } else {
    var forceBody = false
  }

  if (req.body.renderFormat) {
    renderFormat = req.body.renderFormat
  }

  if (typeof req.body.removePageScripts !== 'undefined') {
    removePageScripts = (req.body.removePageScripts === 'true')
  }

  var urlParams = urlParser.parse(url, true);


  url = actionEngine.parseDynamicParams(url, debug);
  if (debug) console.log("DEBUG: url after dynamic parameters processing: " + url);

  url = checkIfUrlEncoded(url);



  // Set HTTP request headers
  // var defaultRequestHeaders = {};
  var defaultRequestHeaders = {
    'Host': urlParams.hostname,
  }

  if (typeof req.body.actionPlaybook !== "undefined" && req.body.actionPlaybook !== null && req.body.actionPlaybook !== "") {


    try {
      pageActions = JSON.parse(req.body.actionPlaybook)

      if (typeof pageActions.globals !== 'undefined') {

        // actionPlaybook overrides the request jsParsingType
        if (pageActions.globals.hasOwnProperty('jsLinkParserStrategy')) {
          jsParsingType = parseInt(pageActions.globals.jsLinkParserStrategy)
        }

        if (pageActions.globals.hasOwnProperty('skipTidyOutput')) {
          skipTidyOutput = pageActions.globals.skipTidyOutput
          if (skipTidyOutput === false) {
            // Apply tidy to the output if global section is present and skipTidyOutput is set to false
            actionPlaybookPlayed = true;
          }
        }

        if (pageActions.globals.hasOwnProperty('npm ')) {
          skipLinkParametersParser = pageActions.globals.skipLinkParametersParser;
        }

        // Check if there's a user defined proxy in the actionPlaybook
        if (pageActions.globals.hasOwnProperty('useProxyServer')) {
          userDefinedProxy = pageActions.globals.useProxyServer;
          if (debug) console.log("Overriding proxy configuration by actionPlaybook: " + JSON.stringify(userDefinedProxy, null, 2));
        }


        if (pageActions.globals.hasOwnProperty('enableStaticBrowserGzipSupport')) {
          gzipSupport = pageActions.globals.enableStaticBrowserGzipSupport;
        }


      }
    } catch (e) {
      var err = new Error()
      err.message = "Check your actionPlaybook syntax"
      generateErrorResponse(err, res, errorEnums.errors.customError)
    } finally {
      // DO NOTHING
    }

    /*
      *
      * TODO: Check for an actionPlaybooks action with dataEndpoint declared
      * In case the dataEndpoint is present it will replace the provided 'url'
      * 
      */
    if (typeof pageActions !== 'undefined' && pageActions.hasOwnProperty('actions')) {
      var result = pageActions.actions.find(function (e) {
        return (e.action.type == 'jsonDocumentToHtmlMapping' || e.action.type == 'jsonArrayToHtmlMapping')
      })
    }

    if (result) {

      // *** Check for an explicit data-endpiont declaration to use as target url
      // if (debug) console.log("DEBUG: A jsonDocumentToHtmlMapping is present and a dataEndpoint is declared: " + result.action.dataEndpoint)
      if (typeof result.action.dataEndpoint !== 'undefined') {
        if (debug) console.log("DEBUG: A dataEndpoint has been declared, the url is: " + result.action.dataEndpoint)

        if (typeof result.action.useMainUrlAsDataEndpoint !== 'undefined' && result.action.useMainUrlAsDataEndpoint === true) {
          if (debug) console.log("DEBUG: A dataEndpoint has been declared, but dynamic dataRoot is active this url will be used instead: " + url);
        } else {
          url = actionEngine.parseDynamicParams(result.action.dataEndpoint, debug);
          if (debug) console.log("DEBUG: dataEndpoint url after dynamic parameters processing: " + url);

        }

        requestMethod = result.action.XhrRequestParams.method;
        requestAdditionalHeaders = result.action.XhrRequestParams.headers;
        if (typeof result.action.XhrRequestParams.payload !== 'undefined') {

          // Dynamic parameters replacement for payload ( "myparam1={myVar1}&myparam2={myvar2}")
          var newPayload = actionEngine.replaceDynamicFieldsFromUrl(urlParams, result.action.XhrRequestParams.payload);
          if (debug) console.log("DEBUG: request payload:\n\tdefinition: " + result.action.XhrRequestParams.payload + "\n\tresulting after dynamic params replacement: " + newPayload);

          if (typeof result.action.XhrRequestParams.headers["Content-Type"] !== "undefined" && (result.action.XhrRequestParams.headers["Content-Type"].indexOf("application/x-www-form-urlencoded") !== -1)) {
            // requestPayLoad = result.action.XhrRequestParams.payload;
            requestPayLoad = newPayload;
          } else {
            // requestPayLoad = JSON.parse(result.action.XhrRequestParams.payload);
            requestPayLoad = JSON.parse(newPayload);
            jsonRequest = true;
          }

          if (typeof result.action.XhrRequestParams.headers["Content-Type"] !== 'undefined') {
            if (debug) console.log("DEBUG: An XHR request payload has been declared, xhrRequest will be made with content-type: " + result.action.XhrRequestParams.headers["Content-Type"]);
          }
        }

        // request = require('request');

      }
    }

  } else {
    request = require('request').defaults({ maxRedirects: 3, encoding: null });
  }

  if (debug) console.log("method v0/navigate (static): " + url);



  if (typeof req.body.sessionCookie !== 'undefined' && req.body.sessionCookie !== null) {
    if (debug) console.log("DEBUG: session cookie declared: " + req.body.sessionCookie);
    defaultRequestHeaders['Cookie'] = req.body.sessionCookie
  }

  if (gzipSupport) {
    defaultRequestHeaders['Accept-Encoding'] = 'gzip, deflate';
  }

  defaultRequestHeaders = Object.assign(defaultRequestHeaders, scaledraConf.globals.commonHttpHeaders);



  /*
   * IMPORTANT: request.js problem https://github.com/bitpay/node-bitpay-client/issues/84
   */
  if (typeof pageActions.globals !== 'undefined' && pageActions.globals.hasOwnProperty('overrideHttpHeaders')) {
    var resultingHeaders = Object.assign(defaultRequestHeaders, requestAdditionalHeaders, pageActions.globals.overrideHttpHeaders)
  } else {
    var resultingHeaders = Object.assign(defaultRequestHeaders, requestAdditionalHeaders)
  }

  resultingHeaders = actionEngine.replaceDynamicHeadersFromUrl(urlParams, resultingHeaders);

  var proxyConfig = prepareProxyConfigUrl(userDefinedProxy);


  var httpMaxPoolSockets = evaluateHttpPoolMaxSockets(scaledraConf.globals.httpPoolMaxSockets, pageActions);

  var options = {
    timeout: scaledraConf.globals.responseTimeoutMs,
    // maxRedirects: scaledraConf.navigationEngines.static.maxRedirects,
    // followRedirect: true,
    followAllRedirects: true,
    // followOriginalHttpMethod: true,
    agent: false,
    pool: { maxSockets: httpMaxPoolSockets },
    // encoding: null,
    url: url,
    method: requestMethod,
    body: requestPayLoad,
    headers: resultingHeaders,
    json: jsonRequest,
    jar: true,
    gzip: gzipSupport,
    proxy: proxyConfig
  }

  options.jar = false;

  if (debug) console.log("DEBUG: performing request with headers: " + JSON.stringify(options.headers, null, 2));

  /*
   * an HEAD request could be performed but some servers are configured to return the 
   * ['content-type'] only in case of GET requests
   */

  try {
    dns.resolve4(urlParams.hostname, function (err, addresses) { // Check if the domain exists
      if (err) {
        // ERROR: Unable to resolve url domain
        generateErrorResponse(err, res, errorEnums.errors.dns);
      } else {
        // console.log(url)
        // console.log(encodeURI(url))

        // Look for redirects loops
        // var request = require('request');
        //request(options, function (error, response, body) {
        // if (!error) {
        let body = ""
        request(options, function (error, response, body) {
          // Class doesn't report all the intermediate http code statuses
          if (redirectChain.length === 1) {
            redirectChain[0].httpCode = 200
            redirectChain[0].httpDescription = "OK"
          } else {
            var i = 0
            for (i = 0; i < redirectChain.length - 1; i++) {
              redirectChain[i].httpCode = 301
              redirectChain[i].httpDescription = "Found"
            }
          }

          /*
           * In case the URL points to a file which is not an HTML document and the render format is not JSON
           * It returns the file as is
           */

          var contentType;

          var gunzip = zlib.createGunzip()

          if (debug) console.log("DEBUG: Response bytes length " + body.length);

          if (typeof response.headers['content-type'] !== 'undefined') {
            contentType = response.headers['content-type']
          } else {
            // if it's missing it assumes text/html
            // TODO: Try with the [magic-numbers] lib to properly detect the mime-type from data-stream
            // magic number refercences: https://en.wikipedia.org/wiki/List_of_file_signatures
            contentType = "text/html"
          }
          if (contentType.indexOf("html") === -1 && renderFormat === 'html' && typeof (req.body.actionPlaybook) === 'undefined') {
            if (debug) console.log("DEBUG: Direct stream returned for document of type: " + contentType)
            res.setHeader('content-type', contentType)

            if (typeof response.headers["content-encoding"] !== 'undefined' && response.headers["content-encoding"].indexOf("gunzip").indexOf("gunzip") > -1) {

              res.pipe(gunzip(body));
            } else {

              res.send(body)
            }
            return
          }

          // Try to get the page encodin{
          var encodingResults = getPageEncoding(req, response.headers['content-type'], body.toString())

          /*
          if (response.headers['content-encoding'].indexOf('gzip') >= 0) {
            gzip.gunzip(encodingResults)(function (err, dezipped) {
              console.log(dezipped.toString())
            })
          }
          */


          /*
           * In case of encoding different from utf-8 perfrom a conversion
           */
          var htmlDoc
          var urlPath = urlParams.pathname

          try {
            if (encodingResults.pageEncoding !== null && ICONV_SUPPORTED_CHARSETS.indexOf(encodingResults.pageEncoding) > -1) {

              if (encodingResults.pageEncoding !== 'utf-8') {
                var iconv = new Iconv(encodingResults.pageEncoding, 'utf-8')
                var encodedOutput = iconv.convert(body)
                htmlDoc = encodedOutput.toString()
              } else {
                if (isByteArray(body)) {
                  htmlDoc = body.toString()
                } else {
                  htmlDoc = JSON.stringify(body)
                }
              }

            } else {
              if (isByteArray(body)) {
                htmlDoc = body.toString()
              } else {
                htmlDoc = JSON.stringify(body)
              }
            }

          } catch (err) {
            if (err.code === "EILSEQ") {
              var iconv = require('iconv-lite');
              // Illegal character sequence.
              htmlDoc = iconv.decode(body, encodingResults.pageEncoding).toString()

            } else {
              generateErrorResponse(err.code + ": " + err.message + " (page charset processing)", res, errorEnums.errors.customError)

            }
          }

          var pageActions
          var tmptableRow = ""
          var tabledata = ""

          var execStart;
          var execEnd;

          var _originalHtml = ""

          // preserve the original HTML code returned by the web server
          if (typeof req.body.includeOriginalHtml !== 'undefined' && req.body.includeOriginalHtml === 'true') {
            _originalHtml = htmlDoc.replace(/\\r|\\t|\\n/g);
          }

          if (typeof req.body.actionPlaybook !== "undefined" && req.body.actionPlaybook !== "" && req.body.actionPlaybook !== null) {


            pageActions = JSON.parse(req.body.actionPlaybook)
          }

          if (typeof pageActions !== 'undefined' && pageActions.hasOwnProperty('actions')) {
            for (var i = 0; i < pageActions.actions.length; i++) {
              if (pageActions.actions[i].action.enabled === true) {
                try {

                  execStart = new Date();

                  switch (pageActions.actions[i].action.type) {


                    case "jsonArrayToHtmlMapping":

                      // Render the header with parameter replacement if any
                      var HtmlOutputHeader = ""
                      var HtmlOutputFooter = ""
                      if (pageActions.actions[i].action.htmlOutput.htmlPrefix) {
                        HtmlOutputHeader = pageActions.actions[i].action.htmlOutput.htmlPrefix
                        for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
                          HtmlOutputHeader = HtmlOutputHeader.replaceAll("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
                        }
                      }

                      // Render the footer with parameter repalcement if any
                      if (pageActions.actions[i].action.htmlOutput.htmlSuffix) {
                        HtmlOutputFooter = pageActions.actions[i].action.htmlOutput.htmlSuffix
                        for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
                          HtmlOutputFooter = HtmlOutputFooter.replaceAll("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
                        }
                      }

                      var jsondata = JSON.parse(htmlDoc)
                      var fields = new Object()

                      // Iterates on fields and assign JSON arrays to an associative array
                      for (var j = 0; j < pageActions.actions[i].action.fieldsMapping.length; j++) {
                        fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = getJsonProperty(jsondata[pageActions.actions[i].action.dataRoot], pageActions.actions[i].action.fieldsMapping[j].sourceField)
                      }

                      var _numElements = fields[pageActions.actions[i].action.fieldsMapping[0].fieldLabel].length;
                      // Check if there's a "getTopElements" value
                      if (typeof pageActions.actions[i].action.getTopElements !== 'undefined' && parseInt(pageActions.actions[i].action.getTopElements) < fields[pageActions.actions[i].action.fieldsMapping[0].fieldLabel].length) {
                        _numElements = parseInt(pageActions.actions[i].action.getTopElements);
                      }

                      // Iterates on all array elements. Arrays must have the same length
                      for (var j = 0; j < _numElements; j++) {
                        var record = pageActions.actions[i].action.htmlOutput.recordTemplate
                        // Iterates on fields
                        for (var t = 0; t < pageActions.actions[i].action.fieldsMapping.length; t++) {
                          var tempVal = fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j]

                          // Check for a field transformation
                          // THIS IS MAINTAINED FOR RETRO-COMPATIBILITY WITH OLD SCRIPTS, PLEASE USE THE NEW TRANSFORMATIONS FEATURE
                          // TODO: Fix the transform for nested fields
                          if (typeof pageActions.actions[i].action.fieldsMapping[t].transformation !== 'undefined' && pageActions.actions[i].action.fieldsMapping[t].transformation.enabled === true) {
                            var rexData = pageActions.actions[i].action.fieldsMapping[t].transformation.find
                            var rexTransformation = new RegExp(rexData, "gmi")

                            tempVal = tempVal.replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[t].transformation.replace)
                          }

                          // Multiple transformations supoport
                          if (typeof pageActions.actions[i].action.fieldsMapping[t].transformations !== 'undefined') {
                            for (var x = 0; x < pageActions.actions[i].action.fieldsMapping[t].transformations.length; x++) {
                              if (pageActions.actions[i].action.fieldsMapping[t].transformations[x].transformation.enabled) {
                                tempVal = tempVal.toString().replaceAll(new RegExp(pageActions.actions[i].action.fieldsMapping[t].transformations[x].transformation.find, "gmi"), pageActions.actions[i].action.fieldsMapping[t].transformations[x].transformation.replace)
                              }
                            }
                          }

                          switch (pageActions.actions[i].action.fieldsMapping[t].fieldQualificator) {

                            case "link":
                              fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j] = "<a href=\"" + tempVal + "\">Link</a>"
                              break

                            default:

                              // fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j] = tempVal
                              break

                          }

                          // Assign fields to the record
                          var rex = new RegExp("{" + pageActions.actions[i].action.fieldsMapping[t].fieldLabel + "}", "gi")
                          record = record.replace(rex, tempVal)
                        }
                        // Add the new record to the output
                        tabledata = tabledata + record
                      }


                      // Build output document
                      tabledata = HtmlOutputHeader + tabledata + HtmlOutputFooter
                      htmlDoc = HTML5_TEMPLATE
                      htmlDoc = htmlDoc.replaceAll("__CODE_FRAGMENT__", tabledata)
                      actionPlaybookPlayed = true


                      pageActions.actions[i].action.result = 'OK'

                      execEnd = new Date();
                      pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

                      if (debug)
                        console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
                      break

                    case "jsonDocumentToHtmlMapping":

                      // Render the header with parameter replacement if any
                      var HtmlOutputHeader = ""
                      var HtmlOutputFooter = ""
                      if (pageActions.actions[i].action.htmlOutput.htmlPrefix) {
                        HtmlOutputHeader = pageActions.actions[i].action.htmlOutput.htmlPrefix
                        for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
                          HtmlOutputHeader = HtmlOutputHeader.replace("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
                        }
                      }

                      // Render the footer with parameter repalcement if any
                      if (pageActions.actions[i].action.htmlOutput.htmlSuffix) {
                        HtmlOutputFooter = pageActions.actions[i].action.htmlOutput.htmlSuffix
                        for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
                          HtmlOutputFooter = HtmlOutputFooter.replace("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
                        }
                      }


                      if (pageActions.actions[i].action.hasOwnProperty('forceContentType')) {
                        response.headers['content-type'] = pageActions.actions[i].action.forceContentType;
                      }

                      var jsondata = "";

                      if (pageActions.actions[i].action.hasOwnProperty('dataField')) {
                        if (debug) console.log("dataField property has been declared")
                        var $ = cheerio.load(htmlDoc)

                        // Generate the JSON data source from a value on an html element
                        if (pageActions.actions[i].action.dataField.hasOwnProperty("sourceElementSelector") && pageActions.actions[i].action.dataField.hasOwnProperty("sourceElementAttribute")) {
                          htmlDoc = $(pageActions.actions[i].action.dataField.sourceElementSelector).attr(pageActions.actions[i].action.dataField.sourceElementAttribute)
                          if (debug) console.log("dataField data extracted from: \n\tHTML element: " + pageActions.actions[i].action.dataField.sourceElementSelector + "\n\telement attribute: " + pageActions.actions[i].action.dataField.sourceElementAttribute)
                        } else {
                          if (debug) console.log("dataField elements not defined")
                        }
                      }

                      // It returns the result of the XHR call without performing any mappig or transformation
                      if (pageActions.actions[i].action.hasOwnProperty('contentPassThrough')) {
                        actionPlaybookPassthrough = pageActions.actions[i].action.contentPassThrough;
                        if (debug && actionPlaybookPassthrough) console.log("DEBUG: pass-through delcared, value is " + actionPlaybookPassthrough);
                      }

                      if (response.headers['content-type'].indexOf('html') === -1 && actionPlaybookPassthrough === false) {

                        // If dataEndPoint is XML, converts to JSON
                        if (response.headers['content-type'].indexOf('xml') !== -1) {
                          jsondata = getJsonProperty(JSON.parse(xml2js.toJson(htmlDoc)), pageActions.actions[i].action.dataRoot)
                        }


                        // If dataEndPoint is JSON
                        // IMPORTANT: It tries to parse as JSON even documents returned as "text/plain"
                        if (response.headers['content-type'].indexOf('json') !== -1 || response.headers['content-type'].indexOf('javascript') !== -1 || response.headers['content-type'].indexOf('text/plain') !== -1) {
                          // htmlDoc = htmlDoc.replaceAll("\r\n", "")    // Removes carriage rteturns in Windows format 
                          if (pageActions.actions[i].action.hasOwnProperty('documentEnvelope')) {
                            var _prefixRe = new RegExp(pageActions.actions[i].action.documentEnvelope.prefix, "gmi");
                            var _suffixRe = new RegExp(pageActions.actions[i].action.documentEnvelope.suffix + "$", "gmi");
                            htmlDoc = htmlDoc.replace(_prefixRe, "");
                            htmlDoc = htmlDoc.replace(_suffixRe, "");
                          }

                          if (pageActions.actions[i].action.dataRoot !== ".") {
                            var _tempData = dottie.get(JSON.parse(htmlDoc), pageActions.actions[i].action.dataRoot);
                            if (typeof _tempData.length === 'undefined') {
                              jsondata = [_tempData]
                            } else {
                              jsondata = dottie.get(JSON.parse(htmlDoc), pageActions.actions[i].action.dataRoot)
                            }
                            // jsondata = getJsonProperty(JSON.parse(htmlDoc), pageActions.actions[i].action.dataRoot)
                          } else {
                            jsondata = JSON.parse(htmlDoc)
                          }
                        }

                        if (jsondata !== "") {

                          var _numElements
                          var singleRecord = false // Tells if the input json file is a single record without array
                          if (typeof jsondata.length === 'undefined' || typeof jsondata === 'string') {
                            _numElements = 1;
                            var _jsondata = [jsondata];
                            jsondata = _jsondata;
                            singleRecord = true;
                          } else {
                            _numElements = jsondata.length;
                          }

                          // var _numElements = jsondata.length;
                          // Check if there's a "getTopElements" value
                          if (typeof pageActions.actions[i].action.getTopElements !== 'undefined' && parseInt(pageActions.actions[i].action.getTopElements) < jsondata.length) {
                            _numElements = parseInt(pageActions.actions[i].action.getTopElements);
                          }

                          for (var t = 0; t < _numElements; t++) { // Loop on JSON data items

                            var fields = new Object()

                            // Check for data filters so to discard unwanted records before being processed                                  
                            var _filterSkip = false;
                            if (pageActions.actions[i].action.hasOwnProperty("dataFilters")) {
                              var _discardRecord = false;
                              for (var w = 0; w < pageActions.actions[i].action.dataFilters.length; w++) {
                                // Skips further checks in case the previous one failed
                                if (!_filterSkip) {
                                  // if (getJsonProperty(jsondata[t], pageActions.actions[i].action.dataFilters[w].fieldName) !== pageActions.actions[i].action.dataFilters[w].fieldValue) {
                                  if (typeof getJsonProperty(jsondata[t], pageActions.actions[i].action.dataFilters[w].fieldName) !== 'undefined') {
                                    // TODO: Introduce field match value with regex support
                                    var _fieldMatch = (getJsonProperty(jsondata[t], pageActions.actions[i].action.dataFilters[w].fieldName).indexOf(pageActions.actions[i].action.dataFilters[w].fieldValue)) != -1 ? true : false;
                                  } else {
                                    // non-existing field
                                    var _fieldMatch = false;
                                  }
                                  switch (pageActions.actions[i].action.dataFilters[w].action) {
                                    case "exclude":
                                      if (_fieldMatch) {
                                        _discardRecord = true;
                                        _filterSkip = true;
                                      } else {
                                        _discardRecord = false;
                                      }
                                      break;
                                    case "include":
                                      if (_fieldMatch) {
                                        _discardRecord = false;
                                      } else {
                                        _discardRecord = true;
                                        _filterSkip = true;
                                      }
                                      break;
                                    default:
                                      _discardRecord = false;
                                  }
                                }
                              }
                            }
                            if (!_discardRecord) {
                              for (var j = 0; j < pageActions.actions[i].action.fieldsMapping.length; j++) { // Loop on fields

                                // Check for a field transformation
                                // THIS IS MAINTAINED FOR RETRO-COMPATIBILITY WITH OLD SCRIPTS, PLEASE USE THE NEW TRANSFORMATIONS FEATURE
                                // TODO: Fix the transform for nested fields
                                var tempVal;
                                if (pageActions.actions[i].action.fieldsMapping[j].hasOwnProperty("fieldDecodeMethod")) {
                                  switch (pageActions.actions[i].action.fieldsMapping[j].fieldDecodeMethod) {
                                    case "jsonEscaped":
                                      if (singleRecord) {
                                        tempVal = getJsonProperty(jsondata[t], pageActions.actions[i].action.fieldsMapping[j].sourceField)
                                      } else {
                                        tempVal = JSON.parse(getJsonProperty(jsondata[t], pageActions.actions[i].action.fieldsMapping[j].sourceField.substring(0, pageActions.actions[i].action.fieldsMapping[j].sourceField.indexOf('.'))))
                                        tempVal = getJsonProperty(tempVal, pageActions.actions[i].action.fieldsMapping[j].sourceField.substring(pageActions.actions[i].action.fieldsMapping[j].sourceField.indexOf(".") + 1, pageActions.actions[i].action.fieldsMapping[j].sourceField.length))
                                      }
                                      break;

                                    default:

                                      break;


                                  }
                                } else {

                                  tempVal = getJsonProperty(jsondata[t], pageActions.actions[i].action.fieldsMapping[j].sourceField);
                                  if (tempVal === null) tempVal = "";
                                }
                                if (typeof pageActions.actions[i].action.fieldsMapping[j].transformation !== 'undefined' && pageActions.actions[i].action.fieldsMapping[j].transformation.enabled === true) {
                                  var rexData = pageActions.actions[i].action.fieldsMapping[j].transformation.find
                                  var rexTransformation = new RegExp(rexData, "gmi");
                                  tempVal = tempVal.toString().replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[j].transformation.replace)
                                }

                                // Multiple transformations supoport
                                if (typeof pageActions.actions[i].action.fieldsMapping[j].transformations !== 'undefined') {
                                  for (var x = 0; x < pageActions.actions[i].action.fieldsMapping[j].transformations.length; x++) {
                                    if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.enabled) {
                                      if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.hasOwnProperty("replace")) {
                                        tempVal = tempVal.toString().replace(new RegExp(pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.find, "gmi"), pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.replace)
                                      } else {
                                        if (tempVal === null) tempVal = "";
                                        var _tempVal = tempVal.toString().match(new RegExp(pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.find, "gmi"));
                                        if (_tempVal !== null) {
                                          tempVal = _tempVal[0];
                                        } else {    // TODO: Verify impact on existing scripts
                                          tempVal = "";
                                        }
                                      }
                                    }
                                  }
                                }

                                switch (pageActions.actions[i].action.fieldsMapping[j].fieldQualificator) {

                                  case "link":
                                    fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = "<a href=\"" + tempVal + "\">Link</a>"
                                    break

                                  case "epochTime":
                                    try {
                                      var d = new Date(parseInt(tempVal) * 1000)
                                      // d.setUTCSeconds(tempVal)
                                      fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = d.toISOString()
                                    } catch (e) {
                                      fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = "";
                                      if (debug) console.log("ERROR: epochTime conversione failed for value: " + tempVal)
                                    }
                                    break

                                  default:
                                    fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = tempVal
                                    break

                                }

                              }
                              var record = pageActions.actions[i].action.htmlOutput.recordTemplate
                              var rex
                              for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
                                rex = new RegExp("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", "gi")
                                record = record.replace(rex, fields[pageActions.actions[i].action.fieldsMapping[s].fieldLabel])
                              }

                              tabledata = tabledata + record
                              tmptableRow = ""


                            }
                          }
                          // Build output document
                          tabledata = HtmlOutputHeader + tabledata + HtmlOutputFooter
                          htmlDoc = HTML5_TEMPLATE
                          htmlDoc = htmlDoc.replaceAll("__CODE_FRAGMENT__", tabledata)

                        }
                      }

                      actionPlaybookPlayed = true
                      pageActions.actions[i].action.result = 'OK'

                      execEnd = new Date();
                      pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

                      if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))

                      break;


                    /*
                     *
                     * COMMON ACTIONS MANAGED BY THE actionProcessor CLASS
                     *
                     */

                    case "grabInnerElementContent":
                      htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

                      $ = cheerio.load(htmlDoc);
                      actionPlaybookPlayed = true;

                      break;

                    case "grabInnerHtmlContent":
                      htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

                      $ = cheerio.load(htmlDoc);
                      actionPlaybookPlayed = true;

                      break;

                    case "alterHtmlElement":
                      htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

                      $ = cheerio.load(htmlDoc);
                      actionPlaybookPlayed = true;

                      break;

                    case "removeHtmlElement":
                      htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

                      $ = cheerio.load(htmlDoc);
                      actionPlaybookPlayed = true;

                      break;

                    case "htmlElementsToField":
                      htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

                      $ = cheerio.load(htmlDoc);
                      actionPlaybookPlayed = true;

                      break;


                    case "mergeHtmlElements":
                      htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

                      $ = cheerio.load(htmlDoc);
                      actionPlaybookPlayed = true;

                      break;


                    case "extractFieldValue":
                      var _tempField = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

                      extractedFields[Object.keys(_tempField)[0]] = _tempField[Object.keys(_tempField)[0]];

                      // This action doens't set the actionPlaybookPlayed flag to true since it doesn't do anything on the html code
                      // It adds a element to the JSON response only
                      // actionPlaybookPlayed = true;

                      break;

                    default:
                      pageActions.actions[i].action.result = 'NOT APPLIED. Check action definition'

                      if (debug)
                        console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
                      break
                  }
                } catch (e) {
                  pageActions.actions[i].action.result = 'FAILED'

                  if (debug)
                    console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
                }
              }
            }
          }

          // Creates the final page starting from the HTML5 template
          if (actionPlaybookPlayed) {
            // TODO: IMPORTANT !!! Verify conditions under which solve links, if content passThrough is enabled
            // in actionPlayboook the output format could be of any type including JSON and XML
            if (!actionPlaybookPassthrough) {
              if (skipLinkParametersParser === false) {
                htmlDoc = completeParameterLinks(htmlDoc, urlParams, jsParsingType);
                htmlDoc = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/") + 1))
              }
            }

            if (typeof pageActions.globals !== 'undefined' && pageActions.globals.hasOwnProperty('skipTidyOutput')) {
              htmlDoc = actionEngine.formatOutputPage(htmlDoc, landingUrl, pageActions.globals.skipTidyOutput);
            } else {
              // Split content-type to handle cases like "application/json; utf=8" that we will miss doing an exact match
              if (!["application/json", "application/xml", "text/xml", "text/html"].includes(response.headers["content-type"].split(";")[0])) {
                if (debug) console.log("Returning original response from server. Content-Type is " + response.headers["content-type"]);
                passThroughContentDelivered = true;
                res.writeHead(200, {
                  'Content-Type': response.headers["content-type"]
                });

                res.write(body);
                res.end();

              } else {
                htmlDoc = actionEngine.formatOutputPage(htmlDoc, landingUrl, false);
              }
            }


          } else {

            // Skips the links manipulation in case of RSS response
            // if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
            if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
              if (!skipLinkParametersParser) {
                htmlDoc = completeParameterLinks(htmlDoc, urlParams, jsParsingType);
              } else {
                if (debug) console.log('DEBUG: completeParameterLinks step skipped');
              }
            }

          }


          if (!passThroughContentDelivered) {
            var $ = cheerio.load(htmlDoc)

            // *** Check if there's a <base> html element
            if (typeof $('base').attr('href') == 'undefined') {
              // *** Skips the links manipulation in case of RSS response
              // if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
              if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
                var bodyFixedURL = ""
                bodyFixedURL = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/") + 1))

              } else {
                bodyFixedURL = htmlDoc
              }
              //var bodyFixedURL = linkConverter.convert(htmldocOut, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")))
            } else {
              var docDom = new JSDOM(htmlDoc)
              var baseLink = ""
              baseLink = docDom.window.document.querySelector("base").getAttribute("href")
              if (baseLink === "/") { // Fix local base references
                var bodyFixedURL = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host)
              } else {
                // *** Skips the links manipulation in caso of RSS response
                if (response.headers['content-type'].indexOf("rss") === -1) {
                  if (baseLink.indexOf("http") === -1) { // fix base url without protocol and host
                    if (baseLink.substring(0, 1) === '/') baseLink = baseLink.substring(1, baseLink.length - 1) // Avoid doubble slashes
                    var bodyFixedURL = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host + "/" + baseLink)
                  } else {
                    var bodyFixedURL = linkConverter.convert(htmlDoc, baseLink)
                  }
                }
              }
              docDom = undefined
            }



            /*
             * TODO: Unfortunately it's necessary to re-call the fixCharasetEncoding
             * again since, in the static navigation the response is a bytestream instead
             * of a string. Before it's necessary to convert the stream in utf-8 before
             * manipulating the resulting string.
             */
            // Skips the links manipulation in caso of RSS response
            // if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
            if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
              bodyFixedURL = fixCharsetEncoding(bodyFixedURL)
            }


            if (redirectChain.length > 1) {
              console.log(redirectChain[redirectChain.length - 1].httpUrl)
              landingUrl = redirectChain[redirectChain.length - 1].httpUrl
            } else {
              landingUrl = url
            }

            if (urlParams.port === null && urlParams.protocol === "http:") {
              urlParams.port = 80
            } else if (urlParams.port === null && urlParams.protocol === "https:") {
              urlParams.port = 443
            }

            if (!compareUrls(url, landingUrl)) {
              smartRedirect = true;
            }

            if ((url !== landingUrl)) {
              strictRedirect = true;
              if (!forceBody) {
                // TODO: Replace with htmlCode
                //contentBody = ""
              }
            }

            // Define queryparams if presents
            if (JSON.stringify(urlParams.query) === "{}") {
              var queryParams
            } else {
              var queryParams = urlParams.query
            }

            if (smartRedirect && forceBody === false) {
              var pageHtml = ""
            } else {
              // if (bodyFixedURL.indexOf("<base href") === -1 && typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
              if (bodyFixedURL.indexOf("<base href") === -1 && typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
                var pageHtml = addBaseElement(bodyFixedURL, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")) + "/") // Add base html element for relative links
              } else {
                var pageHtml = bodyFixedURL
              }

            }



            if (removePageScripts && response.headers['content-type'].indexOf("html") !== -1) {
              pageHtml = removeScript(pageHtml)
            }

            // Fix page rendering problems or website coding errors if returned document is of html type

            if (actionPlaybookPlayed !== "") {
              // const tidy = require("tidy-html5").tidy_html5
              // var pageHtml = tidy(pageHtml, { "indent-spaces": 4 });

            }

            // Replace the page content with fragment extracted by actions
            /*
            if (actionPlaybookPlayed) {
              pageHtml = actionEngine.formatOutputPage(pageHtml, landingUrl);
            }
            */

            // Avoids to send the JSON structure if there are no fileds extracted
            if (Object.keys(extractedFields).length === 0) {
              extractedFields = undefined;
            }


            const finish = new Date()
            const executionTime = (finish.getTime() - start.getTime())


            if (redirectChain.length === 1) {
              redirectChain[0].httpCode = response.statusCode;
              redirectChain[0].httpDescription = response.statusMessage
            }


            if (checkForGoodHttpResponseCodes(response.statusCode)) {
              if (renderFormat === 'html') {
                // res.setHeader('content-type', 'text/html')
                if (tabledata !== "") {

                  res.setHeader('content-type', "text/html")
                } else {
                  if (typeof response.headers['content-type'] !== 'undefined') {
                    res.setHeader('content-type', response.headers['content-type'])
                  } else {
                    // *** It assumes text/html
                    res.setHeader('content-type', "text/html");
                  }
                }
                res.send(pageHtml)

              } else {
                var json = JSON.stringify({
                  "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
                  "correlationId": uuid.v1(),
                  "nodeServerPid": proc.pid,
                  "hostname": hostname,
                  "publicIp": publicHostIp,
                  "privateIp": privateHostIp,
                  "aws": { availabilityZone: process.env.AWS_AVAILABILITY_ZONE },
                  "layoutEngine": "Static browser",
                  "url": url,
                  "landingUrl": landingUrl,
                  "urlRedirectStrict": strictRedirect,
                  "urlRedirectSmart": smartRedirect,
                  "actionPlaybook": pageActions,
                  "redirectionChain": cleanRedirectChain(redirectChain),
                  "httpResponseHeaders": normalizeHttpResponseHeaders(response.headers),
                  "remoteHost": urlParams.host,
                  "remotePort": urlParams.port,
                  "remoteUri": urlParams.pathname,
                  "remoteQueryParams": queryParams,
                  "urlFragment": urlParams.hash,
                  "httpScheme": urlParams.protocol,
                  "forceBody": forceBody,
                  "renderFormat": renderFormat,
                  "originalPageEncoding": encodingResults.pageEncoding,
                  "hasFrames": hasFrames,
                  "navigationViaProxy": proxyEnabled,
                  "extractedFields": extractedFields,
                  "pageBody": pageHtml,
                  "originalHtml": _originalHtml
                }, null, 4)
                // if (err) console.log("AN ERROR OCCURED " + err)
                res.setHeader('Content-Type', 'application/json')
                res.send(json)

              }

            } else {

              var err = new Error();
              switch (response.statusCode) {
                // Good response
                // case 500:
                //   err.statusMessage = "Internal server error";
                //   err.statusCode = 500;
                //   generateErrorResponse(err, res, errorEnums.errors.http);
                //   break;

                // case 400:
                //   err.statusMessage = "Bad request";
                //   err.statusCode = 400;
                //   generateErrorResponse(err, res, errorEnums.errors.http);
                //   break;

                // case 403:
                //   err.statusMessage = "Forbidden";
                //   err.statusCode = 403;
                //   generateErrorResponse(err, res, errorEnums.errors.http);
                //   break;

                // case 404:
                //   err.statusMessage = "Not found";
                //   err.statusCode = 404;
                //   generateErrorResponse(err, res, errorEnums.errors.http);
                //   break;

                // ERROR: Return the specific HTTP error
                default:
                  err.statusCode = response.statusCode;
                  err.statusMessage = response.statusMessage;
                  generateErrorResponse(err, res, errorEnums.errors.http);
                  break;

              }
            }
          }
          /*
          var json = JSON.stringify({
            "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
            "correlationId": uuidv1(),
            "url": url,
            // "redirectionChain": cleanRedirectChain(redirectChain),
            "content-type": response.headers['content-type'],
            "content-length": response.headers['content-length'],
            "content-disposition": response.headers['content-disposition'],
            "last-modified": response.headers['last-modified']
          }, null, 4)
          if (err) console.log("AN ERROR OCCURED " + err)
          res.send(json)
          */
        })
          .on('response', function(response) {
            console.log(response);
          })
          // .get(url, options)
          .on('request', function (request) {

            var hostPort = ""
            if (!request.getHeaders().defaultPort === 80 || !request.getHeaders().defaultPort === 443) {
              hostPort = ":" + req.getHeaders().defaultPort
            }
            try {
              if (typeof request.getHeaders().referer === 'undefined') {
                redirectChain.push({
                  httpCode: 301,
                  httpDescription: 301,
                  httpUrl: request.agent.protocol + "//" + request.getHeaders().host + hostPort + request.path
                })
              } else {
                redirectChain.push({
                  httpCode: 200,
                  httpDescription: 300,
                  httpUrl: request.agent.protocol + "//" + request.getHeaders().host + hostPort + request.path
                })
              }
            } catch (e) {
              generateErrorResponse(e, res, errorEnums.errors.exception)
              // console.log("an error occured " + e)
            }


          })
        // .on ('error', function(response){
        //    console.log("error");
        //  })
        // .on('response', function (response) {
        //   // Class doesn't report all the intermediate http code statuses
        //   if (redirectChain.length === 1) {
        //     redirectChain[0].httpCode = 200
        //     redirectChain[0].httpDescription = "OK"
        //   } else {
        //     var i = 0
        //     for (i = 0; i < redirectChain.length - 1; i++) {
        //       redirectChain[i].httpCode = 301
        //       redirectChain[i].httpDescription = "Found"
        //     }
        //   }

        //   /*
        //    * In case the URL points to a file which is not an HTML document and the render format is not JSON
        //    * It returns the file as is
        //    */

        //   var contentType;

        //   var gunzip = zlib.createGunzip()

        //   if (debug) console.log("DEBUG: Response bytes length " + body.length);

        //   if (typeof response.headers['content-type'] !== 'undefined') {
        //     contentType = response.headers['content-type']
        //   } else {
        //     // if it's missing it assumes text/html
        //     // TODO: Try with the [magic-numbers] lib to properly detect the mime-type from data-stream
        //     // magic number refercences: https://en.wikipedia.org/wiki/List_of_file_signatures
        //     contentType = "text/html"
        //   }
        //   if (contentType.indexOf("html") === -1 && renderFormat === 'html' && typeof (req.body.actionPlaybook) === 'undefined') {
        //     if (debug) console.log("DEBUG: Direct stream returned for document of type: " + contentType)
        //     res.setHeader('content-type', contentType)

        //     if (typeof response.headers["content-encoding"] !== 'undefined' && response.headers["content-encoding"].indexOf("gunzip").indexOf("gunzip") > -1) {

        //       res.pipe(gunzip(body));
        //     } else {

        //       res.send(body)
        //     }
        //     return
        //   }

        //   // Try to get the page encodin{
        //   var encodingResults = getPageEncoding(req, response.headers['content-type'], body.toString())

        //   /*
        //   if (response.headers['content-encoding'].indexOf('gzip') >= 0) {
        //     gzip.gunzip(encodingResults)(function (err, dezipped) {
        //       console.log(dezipped.toString())
        //     })
        //   }
        //   */


        //   /*
        //    * In case of encoding different from utf-8 perfrom a conversion
        //    */
        //   var htmlDoc
        //   var urlPath = urlParams.pathname

        //   try {
        //     if (encodingResults.pageEncoding !== null && ICONV_SUPPORTED_CHARSETS.indexOf(encodingResults.pageEncoding) > -1) {

        //       if (encodingResults.pageEncoding !== 'utf-8') {
        //         var iconv = new Iconv(encodingResults.pageEncoding, 'utf-8')
        //         var encodedOutput = iconv.convert(body)
        //         htmlDoc = encodedOutput.toString()
        //       } else {
        //         if (isByteArray(body)) {
        //           htmlDoc = body.toString()
        //         } else {
        //           htmlDoc = JSON.stringify(body)
        //         }
        //       }

        //     } else {
        //       if (isByteArray(body)) {
        //         htmlDoc = body.toString()
        //       } else {
        //         htmlDoc = JSON.stringify(body)
        //       }
        //     }

        //   } catch (err) {
        //     if (err.code === "EILSEQ") {
        //       var iconv = require('iconv-lite');
        //       // Illegal character sequence.
        //       htmlDoc = iconv.decode(body, encodingResults.pageEncoding).toString()

        //     } else {
        //       generateErrorResponse(err.code + ": " + err.message + " (page charset processing)", res, errorEnums.errors.customError)

        //     }
        //   }

        //   var pageActions
        //   var tmptableRow = ""
        //   var tabledata = ""

        //   var execStart;
        //   var execEnd;

        //   var _originalHtml = ""

        //   // preserve the original HTML code returned by the web server
        //   if (typeof req.body.includeOriginalHtml !== 'undefined' && req.body.includeOriginalHtml === 'true') {
        //     _originalHtml = htmlDoc.replace(/\\r|\\t|\\n/g);
        //   }

        //   if (typeof req.body.actionPlaybook !== "undefined" && req.body.actionPlaybook !== "" && req.body.actionPlaybook !== null) {


        //     pageActions = JSON.parse(req.body.actionPlaybook)
        //   }

        //   if (typeof pageActions !== 'undefined' && pageActions.hasOwnProperty('actions')) {
        //     for (var i = 0; i < pageActions.actions.length; i++) {
        //       if (pageActions.actions[i].action.enabled === true) {
        //         try {

        //           execStart = new Date();

        //           switch (pageActions.actions[i].action.type) {


        //             case "jsonArrayToHtmlMapping":

        //               // Render the header with parameter replacement if any
        //               var HtmlOutputHeader = ""
        //               var HtmlOutputFooter = ""
        //               if (pageActions.actions[i].action.htmlOutput.htmlPrefix) {
        //                 HtmlOutputHeader = pageActions.actions[i].action.htmlOutput.htmlPrefix
        //                 for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
        //                   HtmlOutputHeader = HtmlOutputHeader.replaceAll("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
        //                 }
        //               }

        //               // Render the footer with parameter repalcement if any
        //               if (pageActions.actions[i].action.htmlOutput.htmlSuffix) {
        //                 HtmlOutputFooter = pageActions.actions[i].action.htmlOutput.htmlSuffix
        //                 for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
        //                   HtmlOutputFooter = HtmlOutputFooter.replaceAll("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
        //                 }
        //               }

        //               var jsondata = JSON.parse(htmlDoc)
        //               var fields = new Object()

        //               // Iterates on fields and assign JSON arrays to an associative array
        //               for (var j = 0; j < pageActions.actions[i].action.fieldsMapping.length; j++) {
        //                 fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = getJsonProperty(jsondata[pageActions.actions[i].action.dataRoot], pageActions.actions[i].action.fieldsMapping[j].sourceField)
        //               }

        //               var _numElements = fields[pageActions.actions[i].action.fieldsMapping[0].fieldLabel].length;
        //               // Check if there's a "getTopElements" value
        //               if (typeof pageActions.actions[i].action.getTopElements !== 'undefined' && parseInt(pageActions.actions[i].action.getTopElements) < fields[pageActions.actions[i].action.fieldsMapping[0].fieldLabel].length) {
        //                 _numElements = parseInt(pageActions.actions[i].action.getTopElements);
        //               }

        //               // Iterates on all array elements. Arrays must have the same length
        //               for (var j = 0; j < _numElements; j++) {
        //                 var record = pageActions.actions[i].action.htmlOutput.recordTemplate
        //                 // Iterates on fields
        //                 for (var t = 0; t < pageActions.actions[i].action.fieldsMapping.length; t++) {
        //                   var tempVal = fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j]

        //                   // Check for a field transformation
        //                   // THIS IS MAINTAINED FOR RETRO-COMPATIBILITY WITH OLD SCRIPTS, PLEASE USE THE NEW TRANSFORMATIONS FEATURE
        //                   // TODO: Fix the transform for nested fields
        //                   if (typeof pageActions.actions[i].action.fieldsMapping[t].transformation !== 'undefined' && pageActions.actions[i].action.fieldsMapping[t].transformation.enabled === true) {
        //                     var rexData = pageActions.actions[i].action.fieldsMapping[t].transformation.find
        //                     var rexTransformation = new RegExp(rexData, "gmi")

        //                     tempVal = tempVal.replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[t].transformation.replace)
        //                   }

        //                   // Multiple transformations supoport
        //                   if (typeof pageActions.actions[i].action.fieldsMapping[t].transformations !== 'undefined') {
        //                     for (var x = 0; x < pageActions.actions[i].action.fieldsMapping[t].transformations.length; x++) {
        //                       if (pageActions.actions[i].action.fieldsMapping[t].transformations[x].transformation.enabled) {
        //                         tempVal = tempVal.toString().replaceAll(new RegExp(pageActions.actions[i].action.fieldsMapping[t].transformations[x].transformation.find, "gmi"), pageActions.actions[i].action.fieldsMapping[t].transformations[x].transformation.replace)
        //                       }
        //                     }
        //                   }

        //                   switch (pageActions.actions[i].action.fieldsMapping[t].fieldQualificator) {

        //                     case "link":
        //                       fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j] = "<a href=\"" + tempVal + "\">Link</a>"
        //                       break

        //                     default:

        //                       // fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j] = tempVal
        //                       break

        //                   }

        //                   // Assign fields to the record
        //                   var rex = new RegExp("{" + pageActions.actions[i].action.fieldsMapping[t].fieldLabel + "}", "gi")
        //                   record = record.replace(rex, tempVal)
        //                 }
        //                 // Add the new record to the output
        //                 tabledata = tabledata + record
        //               }


        //               // Build output document
        //               tabledata = HtmlOutputHeader + tabledata + HtmlOutputFooter
        //               htmlDoc = HTML5_TEMPLATE
        //               htmlDoc = htmlDoc.replaceAll("__CODE_FRAGMENT__", tabledata)
        //               actionPlaybookPlayed = true


        //               pageActions.actions[i].action.result = 'OK'

        //               execEnd = new Date();
        //               pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        //               if (debug)
        //                 console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
        //               break

        //             case "jsonDocumentToHtmlMapping":

        //               // Render the header with parameter replacement if any
        //               var HtmlOutputHeader = ""
        //               var HtmlOutputFooter = ""
        //               if (pageActions.actions[i].action.htmlOutput.htmlPrefix) {
        //                 HtmlOutputHeader = pageActions.actions[i].action.htmlOutput.htmlPrefix
        //                 for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
        //                   HtmlOutputHeader = HtmlOutputHeader.replace("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
        //                 }
        //               }

        //               // Render the footer with parameter repalcement if any
        //               if (pageActions.actions[i].action.htmlOutput.htmlSuffix) {
        //                 HtmlOutputFooter = pageActions.actions[i].action.htmlOutput.htmlSuffix
        //                 for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
        //                   HtmlOutputFooter = HtmlOutputFooter.replace("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel)
        //                 }
        //               }


        //               if (pageActions.actions[i].action.hasOwnProperty('forceContentType')) {
        //                 response.headers['content-type'] = pageActions.actions[i].action.forceContentType;
        //               }

        //               var jsondata = "";

        //               if (pageActions.actions[i].action.hasOwnProperty('dataField')) {
        //                 if (debug) console.log("dataField property has been declared")
        //                 var $ = cheerio.load(htmlDoc)

        //                 // Generate the JSON data source from a value on an html element
        //                 if (pageActions.actions[i].action.dataField.hasOwnProperty("sourceElementSelector") && pageActions.actions[i].action.dataField.hasOwnProperty("sourceElementAttribute")) {
        //                   htmlDoc = $(pageActions.actions[i].action.dataField.sourceElementSelector).attr(pageActions.actions[i].action.dataField.sourceElementAttribute)
        //                   if (debug) console.log("dataField data extracted from: \n\tHTML element: " + pageActions.actions[i].action.dataField.sourceElementSelector + "\n\telement attribute: " + pageActions.actions[i].action.dataField.sourceElementAttribute)
        //                 } else {
        //                   if (debug) console.log("dataField elements not defined")
        //                 }
        //               }

        //               // It returns the result of the XHR call without performing any mappig or transformation
        //               if (pageActions.actions[i].action.hasOwnProperty('contentPassThrough')) {
        //                 actionPlaybookPassthrough = pageActions.actions[i].action.contentPassThrough;
        //                 if (debug && actionPlaybookPassthrough) console.log("DEBUG: pass-through delcared, value is " + actionPlaybookPassthrough);
        //               }

        //               if (response.headers['content-type'].indexOf('html') === -1 && actionPlaybookPassthrough === false) {

        //                 // If dataEndPoint is XML, converts to JSON
        //                 if (response.headers['content-type'].indexOf('xml') !== -1) {
        //                   jsondata = getJsonProperty(JSON.parse(xml2js.toJson(htmlDoc)), pageActions.actions[i].action.dataRoot)
        //                 }


        //                 // If dataEndPoint is JSON
        //                 // IMPORTANT: It tries to parse as JSON even documents returned as "text/plain"
        //                 if (response.headers['content-type'].indexOf('json') !== -1 || response.headers['content-type'].indexOf('javascript') !== -1 || response.headers['content-type'].indexOf('text/plain') !== -1) {
        //                   // htmlDoc = htmlDoc.replaceAll("\r\n", "")    // Removes carriage rteturns in Windows format 
        //                   if (pageActions.actions[i].action.hasOwnProperty('documentEnvelope')) {
        //                     var _prefixRe = new RegExp(pageActions.actions[i].action.documentEnvelope.prefix, "gmi");
        //                     var _suffixRe = new RegExp(pageActions.actions[i].action.documentEnvelope.suffix + "$", "gmi");
        //                     htmlDoc = htmlDoc.replace(_prefixRe, "");
        //                     htmlDoc = htmlDoc.replace(_suffixRe, "");
        //                   }

        //                   if (pageActions.actions[i].action.dataRoot !== ".") {
        //                     var _tempData = dottie.get(JSON.parse(htmlDoc), pageActions.actions[i].action.dataRoot);
        //                     if (typeof _tempData.length === 'undefined') {
        //                       jsondata = [_tempData]
        //                     } else {
        //                       jsondata = dottie.get(JSON.parse(htmlDoc), pageActions.actions[i].action.dataRoot)
        //                     }
        //                     // jsondata = getJsonProperty(JSON.parse(htmlDoc), pageActions.actions[i].action.dataRoot)
        //                   } else {
        //                     jsondata = JSON.parse(htmlDoc)
        //                   }
        //                 }

        //                 if (jsondata !== "") {

        //                   var _numElements
        //                   var singleRecord = false // Tells if the input json file is a single record without array
        //                   if (typeof jsondata.length === 'undefined' || typeof jsondata === 'string') {
        //                     _numElements = 1;
        //                     var _jsondata = [jsondata];
        //                     jsondata = _jsondata;
        //                     singleRecord = true;
        //                   } else {
        //                     _numElements = jsondata.length;
        //                   }

        //                   // var _numElements = jsondata.length;
        //                   // Check if there's a "getTopElements" value
        //                   if (typeof pageActions.actions[i].action.getTopElements !== 'undefined' && parseInt(pageActions.actions[i].action.getTopElements) < jsondata.length) {
        //                     _numElements = parseInt(pageActions.actions[i].action.getTopElements);
        //                   }

        //                   for (var t = 0; t < _numElements; t++) { // Loop on JSON data items

        //                     var fields = new Object()

        //                     // Check for data filters so to discard unwanted records before being processed                                  
        //                     var _filterSkip = false;
        //                     if (pageActions.actions[i].action.hasOwnProperty("dataFilters")) {
        //                       var _discardRecord = false;
        //                       for (var w = 0; w < pageActions.actions[i].action.dataFilters.length; w++) {
        //                         // Skips further checks in case the previous one failed
        //                         if (!_filterSkip) {
        //                           // if (getJsonProperty(jsondata[t], pageActions.actions[i].action.dataFilters[w].fieldName) !== pageActions.actions[i].action.dataFilters[w].fieldValue) {
        //                           if (typeof getJsonProperty(jsondata[t], pageActions.actions[i].action.dataFilters[w].fieldName) !== 'undefined') {
        //                             // TODO: Introduce field match value with regex support
        //                             var _fieldMatch = (getJsonProperty(jsondata[t], pageActions.actions[i].action.dataFilters[w].fieldName).indexOf(pageActions.actions[i].action.dataFilters[w].fieldValue)) != -1 ? true : false;
        //                           } else {
        //                             // non-existing field
        //                             var _fieldMatch = false;
        //                           }
        //                           switch (pageActions.actions[i].action.dataFilters[w].action) {
        //                             case "exclude":
        //                               if (_fieldMatch) {
        //                                 _discardRecord = true;
        //                                 _filterSkip = true;
        //                               } else {
        //                                 _discardRecord = false;
        //                               }
        //                               break;
        //                             case "include":
        //                               if (_fieldMatch) {
        //                                 _discardRecord = false;
        //                               } else {
        //                                 _discardRecord = true;
        //                                 _filterSkip = true;
        //                               }
        //                               break;
        //                             default:
        //                               _discardRecord = false;
        //                           }
        //                         }
        //                       }
        //                     }
        //                     if (!_discardRecord) {
        //                       for (var j = 0; j < pageActions.actions[i].action.fieldsMapping.length; j++) { // Loop on fields

        //                         // Check for a field transformation
        //                         // THIS IS MAINTAINED FOR RETRO-COMPATIBILITY WITH OLD SCRIPTS, PLEASE USE THE NEW TRANSFORMATIONS FEATURE
        //                         // TODO: Fix the transform for nested fields
        //                         var tempVal;
        //                         if (pageActions.actions[i].action.fieldsMapping[j].hasOwnProperty("fieldDecodeMethod")) {
        //                           switch (pageActions.actions[i].action.fieldsMapping[j].fieldDecodeMethod) {
        //                             case "jsonEscaped":
        //                               if (singleRecord) {
        //                                 tempVal = getJsonProperty(jsondata[t], pageActions.actions[i].action.fieldsMapping[j].sourceField)
        //                               } else {
        //                                 tempVal = JSON.parse(getJsonProperty(jsondata[t], pageActions.actions[i].action.fieldsMapping[j].sourceField.substring(0, pageActions.actions[i].action.fieldsMapping[j].sourceField.indexOf('.'))))
        //                                 tempVal = getJsonProperty(tempVal, pageActions.actions[i].action.fieldsMapping[j].sourceField.substring(pageActions.actions[i].action.fieldsMapping[j].sourceField.indexOf(".") + 1, pageActions.actions[i].action.fieldsMapping[j].sourceField.length))
        //                               }
        //                               break;

        //                             default:

        //                               break;


        //                           }
        //                         } else {

        //                           tempVal = getJsonProperty(jsondata[t], pageActions.actions[i].action.fieldsMapping[j].sourceField);
        //                           if (tempVal === null) tempVal = "";
        //                         }
        //                         if (typeof pageActions.actions[i].action.fieldsMapping[j].transformation !== 'undefined' && pageActions.actions[i].action.fieldsMapping[j].transformation.enabled === true) {
        //                           var rexData = pageActions.actions[i].action.fieldsMapping[j].transformation.find
        //                           var rexTransformation = new RegExp(rexData, "gmi");
        //                           tempVal = tempVal.toString().replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[j].transformation.replace)
        //                         }

        //                         // Multiple transformations supoport
        //                         if (typeof pageActions.actions[i].action.fieldsMapping[j].transformations !== 'undefined') {
        //                           for (var x = 0; x < pageActions.actions[i].action.fieldsMapping[j].transformations.length; x++) {
        //                             if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.enabled) {
        //                               if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.hasOwnProperty("replace")) {
        //                                 tempVal = tempVal.toString().replace(new RegExp(pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.find, "gmi"), pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.replace)
        //                               } else {
        //                                 if (tempVal === null) tempVal = "";
        //                                 var _tempVal = tempVal.toString().match(new RegExp(pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.find, "gmi"));
        //                                 if (_tempVal !== null) {
        //                                   tempVal = _tempVal[0];
        //                                 } else {    // TODO: Verify impact on existing scripts
        //                                   tempVal = "";
        //                                 }
        //                               }
        //                             }
        //                           }
        //                         }

        //                         switch (pageActions.actions[i].action.fieldsMapping[j].fieldQualificator) {

        //                           case "link":
        //                             fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = "<a href=\"" + tempVal + "\">Link</a>"
        //                             break

        //                           case "epochTime":
        //                             try {
        //                               var d = new Date(parseInt(tempVal) * 1000)
        //                               // d.setUTCSeconds(tempVal)
        //                               fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = d.toISOString()
        //                             } catch (e) {
        //                               fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = "";
        //                               if (debug) console.log("ERROR: epochTime conversione failed for value: " + tempVal)
        //                             }
        //                             break

        //                           default:
        //                             fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = tempVal
        //                             break

        //                         }

        //                       }
        //                       var record = pageActions.actions[i].action.htmlOutput.recordTemplate
        //                       var rex
        //                       for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
        //                         rex = new RegExp("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", "gi")
        //                         record = record.replace(rex, fields[pageActions.actions[i].action.fieldsMapping[s].fieldLabel])
        //                       }

        //                       tabledata = tabledata + record
        //                       tmptableRow = ""


        //                     }
        //                   }
        //                   // Build output document
        //                   tabledata = HtmlOutputHeader + tabledata + HtmlOutputFooter
        //                   htmlDoc = HTML5_TEMPLATE
        //                   htmlDoc = htmlDoc.replaceAll("__CODE_FRAGMENT__", tabledata)

        //                 }
        //               }

        //               actionPlaybookPlayed = true
        //               pageActions.actions[i].action.result = 'OK'

        //               execEnd = new Date();
        //               pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        //               if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))

        //               break;


        //             /*
        //              *
        //              * COMMON ACTIONS MANAGED BY THE actionProcessor CLASS
        //              *
        //              */

        //             case "grabInnerElementContent":
        //               htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

        //               $ = cheerio.load(htmlDoc);
        //               actionPlaybookPlayed = true;

        //               break;

        //             case "grabInnerHtmlContent":
        //               htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

        //               $ = cheerio.load(htmlDoc);
        //               actionPlaybookPlayed = true;

        //               break;

        //             case "alterHtmlElement":
        //               htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

        //               $ = cheerio.load(htmlDoc);
        //               actionPlaybookPlayed = true;

        //               break;

        //             case "removeHtmlElement":
        //               htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

        //               $ = cheerio.load(htmlDoc);
        //               actionPlaybookPlayed = true;

        //               break;

        //             case "htmlElementsToField":
        //               htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

        //               $ = cheerio.load(htmlDoc);
        //               actionPlaybookPlayed = true;

        //               break;


        //             case "mergeHtmlElements":
        //               htmlDoc = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

        //               $ = cheerio.load(htmlDoc);
        //               actionPlaybookPlayed = true;

        //               break;


        //             case "extractFieldValue":
        //               var _tempField = actionEngine.executeAction(pageActions, i, htmlDoc, HTML5_TEMPLATE, debug);

        //               extractedFields[Object.keys(_tempField)[0]] = _tempField[Object.keys(_tempField)[0]];

        //               // This action doens't set the actionPlaybookPlayed flag to true since it doesn't do anything on the html code
        //               // It adds a element to the JSON response only
        //               // actionPlaybookPlayed = true;

        //               break;

        //             default:
        //               pageActions.actions[i].action.result = 'NOT APPLIED. Check action definition'

        //               if (debug)
        //                 console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
        //               break
        //           }
        //         } catch (e) {
        //           pageActions.actions[i].action.result = 'FAILED'

        //           if (debug)
        //             console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
        //         }
        //       }
        //     }
        //   }

        //   // Creates the final page starting from the HTML5 template
        //   if (actionPlaybookPlayed) {
        //     // TODO: IMPORTANT !!! Verify conditions under which solve links, if content passThrough is enabled
        //     // in actionPlayboook the output format could be of any type including JSON and XML
        //     if (!actionPlaybookPassthrough) {
        //       if (skipLinkParametersParser === false) {
        //         htmlDoc = completeParameterLinks(htmlDoc, urlParams, jsParsingType);
        //         htmlDoc = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/") + 1))
        //       }
        //     }

        //     if (typeof pageActions.globals !== 'undefined' && pageActions.globals.hasOwnProperty('skipTidyOutput')) {
        //       htmlDoc = actionEngine.formatOutputPage(htmlDoc, landingUrl, pageActions.globals.skipTidyOutput);
        //     } else {
        //       // Split content-type to handle cases like "application/json; utf=8" that we will miss doing an exact match
        //       if (!["application/json", "application/xml", "text/xml", "text/html"].includes(response.headers["content-type"].split(";")[0])) {
        //         if (debug) console.log("Returning original response from server. Content-Type is " + response.headers["content-type"]);
        //         passThroughContentDelivered = true;
        //         res.writeHead(200, {
        //           'Content-Type': response.headers["content-type"]
        //         });

        //         res.write(body);
        //         res.end();

        //       } else {
        //         htmlDoc = actionEngine.formatOutputPage(htmlDoc, landingUrl, false);
        //       }
        //     }


        //   } else {

        //     // Skips the links manipulation in case of RSS response
        //     // if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
        //     if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
        //       if (!skipLinkParametersParser) {
        //         htmlDoc = completeParameterLinks(htmlDoc, urlParams, jsParsingType);
        //       } else {
        //         if (debug) console.log('DEBUG: completeParameterLinks step skipped');
        //       }
        //     }

        //   }


        //   if (!passThroughContentDelivered) {
        //     var $ = cheerio.load(htmlDoc)

        //     // *** Check if there's a <base> html element
        //     if (typeof $('base').attr('href') == 'undefined') {
        //       // *** Skips the links manipulation in case of RSS response
        //       // if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
        //       if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
        //         var bodyFixedURL = ""
        //         bodyFixedURL = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/") + 1))

        //       } else {
        //         bodyFixedURL = htmlDoc
        //       }
        //       //var bodyFixedURL = linkConverter.convert(htmldocOut, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")))
        //     } else {
        //       var docDom = new JSDOM(htmlDoc)
        //       var baseLink = ""
        //       baseLink = docDom.window.document.querySelector("base").getAttribute("href")
        //       if (baseLink === "/") { // Fix local base references
        //         var bodyFixedURL = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host)
        //       } else {
        //         // *** Skips the links manipulation in caso of RSS response
        //         if (response.headers['content-type'].indexOf("rss") === -1) {
        //           if (baseLink.indexOf("http") === -1) { // fix base url without protocol and host
        //             if (baseLink.substring(0, 1) === '/') baseLink = baseLink.substring(1, baseLink.length - 1) // Avoid doubble slashes
        //             var bodyFixedURL = linkConverter.convert(htmlDoc, urlParams.protocol + "//" + urlParams.host + "/" + baseLink)
        //           } else {
        //             var bodyFixedURL = linkConverter.convert(htmlDoc, baseLink)
        //           }
        //         }
        //       }
        //       docDom = undefined
        //     }



        //     /*
        //      * TODO: Unfortunately it's necessary to re-call the fixCharasetEncoding
        //      * again since, in the static navigation the response is a bytestream instead
        //      * of a string. Before it's necessary to convert the stream in utf-8 before
        //      * manipulating the resulting string.
        //      */
        //     // Skips the links manipulation in caso of RSS response
        //     // if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
        //     if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
        //       bodyFixedURL = fixCharsetEncoding(bodyFixedURL)
        //     }


        //     if (redirectChain.length > 1) {
        //       console.log(redirectChain[redirectChain.length - 1].httpUrl)
        //       landingUrl = redirectChain[redirectChain.length - 1].httpUrl
        //     } else {
        //       landingUrl = url
        //     }

        //     if (urlParams.port === null && urlParams.protocol === "http:") {
        //       urlParams.port = 80
        //     } else if (urlParams.port === null && urlParams.protocol === "https:") {
        //       urlParams.port = 443
        //     }

        //     if (!compareUrls(url, landingUrl)) {
        //       smartRedirect = true;
        //     }

        //     if ((url !== landingUrl)) {
        //       strictRedirect = true;
        //       if (!forceBody) {
        //         // TODO: Replace with htmlCode
        //         //contentBody = ""
        //       }
        //     }

        //     // Define queryparams if presents
        //     if (JSON.stringify(urlParams.query) === "{}") {
        //       var queryParams
        //     } else {
        //       var queryParams = urlParams.query
        //     }

        //     if (smartRedirect && forceBody === false) {
        //       var pageHtml = ""
        //     } else {
        //       // if (bodyFixedURL.indexOf("<base href") === -1 && typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("rss") === -1) {
        //       if (bodyFixedURL.indexOf("<base href") === -1 && typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf("html") !== -1) {
        //         var pageHtml = addBaseElement(bodyFixedURL, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")) + "/") // Add base html element for relative links
        //       } else {
        //         var pageHtml = bodyFixedURL
        //       }

        //     }



        //     if (removePageScripts && response.headers['content-type'].indexOf("html") !== -1) {
        //       pageHtml = removeScript(pageHtml)
        //     }

        //     // Fix page rendering problems or website coding errors if returned document is of html type

        //     if (actionPlaybookPlayed !== "") {
        //       // const tidy = require("tidy-html5").tidy_html5
        //       // var pageHtml = tidy(pageHtml, { "indent-spaces": 4 });

        //     }

        //     // Replace the page content with fragment extracted by actions
        //     /*
        //     if (actionPlaybookPlayed) {
        //       pageHtml = actionEngine.formatOutputPage(pageHtml, landingUrl);
        //     }
        //     */

        //     // Avoids to send the JSON structure if there are no fileds extracted
        //     if (Object.keys(extractedFields).length === 0) {
        //       extractedFields = undefined;
        //     }


        //     const finish = new Date()
        //     const executionTime = (finish.getTime() - start.getTime())


        //     if (redirectChain.length === 1) {
        //       redirectChain[0].httpCode = response.statusCode;
        //       redirectChain[0].httpDescription = response.statusMessage
        //     }


        //     if (checkForGoodHttpResponseCodes(response.statusCode)) {
        //       if (renderFormat === 'html') {
        //         // res.setHeader('content-type', 'text/html')
        //         if (tabledata !== "") {

        //           res.setHeader('content-type', "text/html")
        //         } else {
        //           if (typeof response.headers['content-type'] !== 'undefined') {
        //             res.setHeader('content-type', response.headers['content-type'])
        //           } else {
        //             // *** It assumes text/html
        //             res.setHeader('content-type', "text/html");
        //           }
        //         }
        //         res.send(pageHtml)

        //       } else {
        //         var json = JSON.stringify({
        //           "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
        //           "correlationId": uuid.v1(),
        //           "nodeServerPid": proc.pid,
        //           "hostname": hostname,
        //           "publicIp": publicHostIp,
        //           "privateIp": privateHostIp,
        //           "aws": { availabilityZone: process.env.AWS_AVAILABILITY_ZONE },
        //           "layoutEngine": "Static browser",
        //           "url": url,
        //           "landingUrl": landingUrl,
        //           "urlRedirectStrict": strictRedirect,
        //           "urlRedirectSmart": smartRedirect,
        //           "actionPlaybook": pageActions,
        //           "redirectionChain": cleanRedirectChain(redirectChain),
        //           "httpResponseHeaders": normalizeHttpResponseHeaders(response.headers),
        //           "remoteHost": urlParams.host,
        //           "remotePort": urlParams.port,
        //           "remoteUri": urlParams.pathname,
        //           "remoteQueryParams": queryParams,
        //           "urlFragment": urlParams.hash,
        //           "httpScheme": urlParams.protocol,
        //           "forceBody": forceBody,
        //           "renderFormat": renderFormat,
        //           "originalPageEncoding": encodingResults.pageEncoding,
        //           "hasFrames": hasFrames,
        //           "navigationViaProxy": proxyEnabled,
        //           "extractedFields": extractedFields,
        //           "pageBody": pageHtml,
        //           "originalHtml": _originalHtml
        //         }, null, 4)
        //         // if (err) console.log("AN ERROR OCCURED " + err)
        //         res.setHeader('Content-Type', 'application/json')
        //         res.send(json)

        //       }

        //     } else {

        //       var err = new Error();
        //       switch (response.statusCode) {
        //         // Good response
        //         // case 500:
        //         //   err.statusMessage = "Internal server error";
        //         //   err.statusCode = 500;
        //         //   generateErrorResponse(err, res, errorEnums.errors.http);
        //         //   break;

        //         // case 400:
        //         //   err.statusMessage = "Bad request";
        //         //   err.statusCode = 400;
        //         //   generateErrorResponse(err, res, errorEnums.errors.http);
        //         //   break;

        //         // case 403:
        //         //   err.statusMessage = "Forbidden";
        //         //   err.statusCode = 403;
        //         //   generateErrorResponse(err, res, errorEnums.errors.http);
        //         //   break;

        //         // case 404:
        //         //   err.statusMessage = "Not found";
        //         //   err.statusCode = 404;
        //         //   generateErrorResponse(err, res, errorEnums.errors.http);
        //         //   break;

        //         // ERROR: Return the specific HTTP error
        //         default:
        //           err.statusCode = response.statusCode;
        //           err.statusMessage = response.statusMessage;
        //           generateErrorResponse(err, res, errorEnums.errors.http);
        //           break;

        //       }
        //     }
        //   }
        //   /*
        //   var json = JSON.stringify({
        //     "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
        //     "correlationId": uuidv1(),
        //     "url": url,
        //     // "redirectionChain": cleanRedirectChain(redirectChain),
        //     "content-type": response.headers['content-type'],
        //     "content-length": response.headers['content-length'],
        //     "content-disposition": response.headers['content-disposition'],
        //     "last-modified": response.headers['last-modified']
        //   }, null, 4)
        //   if (err) console.log("AN ERROR OCCURED " + err)
        //   res.send(json)
        //   */
        // })


        //} else {
        // ERROR: An error occured
        // TODO: Keep in count the specific 'error' object
        //generateErrorResponse(error, res, errorEnums.errors.exception);
        //}

        // })

      }
    })
  } catch (error) {
    generateErrorResponse(error, res, errorEnums.errors.exception)
  }
})




/**
 * @api {post} /fileproperties Get file properties
 * @apiVersion 0.0.3
 * @apiName PostFileProperties
 * @apiGroup v1
 *
 * @apiExample {curl} CURL:
 *     curl -X POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/fileproperties
 *        -d "url=http://publicnow.com" 
 *        -H "Content-Type: application/x-www-form-urlencoded"
 * 
 * @apiExample {httpie} httpie:
 *     http POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/fileproperties
 *        -d "url=http://publicnow.com" 
 * 
 *  @apiErrorExample {json} Error-Response:
 * 
 * Example 1:
 *    HTTP/1.1. 200 OK 
 * {
 *     "error": {
 *         "type": "dns",
 *         "description": "queryA ENOTFOUND for url: www.presse.justice.go",
 *         "code": 3
 *     }
 * }
 * 
 * Example 2:
 *    HTTP/1.1. 200 OK
 * {
 *    "error": {
 *        "type": "http",
 *        "description": "Exceeded maxRedirects. Probably stuck in a redirect loop http://trilogiq.com/pubblication",
 *        "code": 500
 *    }
 * }
 * 
 * @apiDescription Return the mime-type of a remote resource with evidence of the redirects occurred to reach the resource.
 * Usage of this method in heavy load environment which makes large use of the fileproperties is not recommended, use the v1 version instead.
 * 
 * @apiParam {String} url The url of the remote resource
 * @apiParam {String} [httpMethod] The method to use to perform the HTTP request, it can be GET or HEAD
 *
 * @apiSuccess {Object[]} responseTime contains values for: startTime, endTime and elapsedTime in ms
 * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
 * @apiSuccess {String} url The url of the remote resource
 * @apiSuccess {String} redirectionChain A complete description of the redirects occurred while trying to get the provided url content-type.
 * @apiSuccess {String} content-type The mime content-type of the remote resource reached through the redirection chain
 * @apiSuccess {String} content-length The size in Kb of the documented returned (This value can be missing if not provided by the remote server)
 * @apiSuccess {String} content-disposition Indicates the suggested name for the remote resource to be saved locally (This value can be missing if not provided by the remote server)
 * @apiSuccess {String} etag Indicates if a file has changed. See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag for more info
 * 
 * @apiSuccessExample Success-Response:
 * 
 * Example 1:
 *     HTTP/1.1 200 OK
 *{
 *    "contentLength": "27",
 *    "contentType": "text/plain",
 *    "correlationId": "220f8f30-4457-11ea-9eee-cfd9cec96938",
 *    "etag": "41f0eea-1b-59d732e846e20",
 *    "lastModified": "Fri, 31 Jan 2020 17:48:30 GMT",
 *    "redirectionChain": [
 *        {
 *            "httpCode": 200,
 *            "httpDescription": "OK",
 *            "httpUrl": "http://www.caleidos.it/test.txt"
 *        }
 *    ],
 *    "responseTime": {
 *        "elapsedTime": 175,
 *        "endTime": "2020-01-31T18:26:01.250Z",
 *        "startTime": "2020-01-31T18:26:01.075Z"
 *    },
 *    "url": "http://www.caleidos.it/test.txt"
 *}
 *
 * 
 */

app.post('/api/v1/fileproperties', function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  const start = new Date()
  var resultingHeaders;
  var pageActions;
  var url = req.body.url
  var redirectChain = []
  var httpMethod = scaledraConf.helperMethods.fileproperties.defaultHttpMethod;
  var escaladeToV2 = scaledraConf.globals.filepropertiesEscaladeToV2;
  var userDefinedProxy = undefined;

  if (req.body.httpMethod && req.body.httpMethod !== null) {
    if (debug) console.log("DEBUG: Explict HTTP method declared: " + req.body.httpMethod);
    httpMethod = req.body.httpMethod
  }

  if (debug) console.log("method v1/fileproperties: " + url);
  if (debug) console.log("DEBUG: using http method: " + httpMethod);

  var urlParams = urlParser.parse(url, true)
  url = checkIfUrlEncoded(url)

  // Set HTTP request headers
  var defaultRequestHeaders = {
    // 'Cookie': cookies,
    'Host': urlParams.hostname
  }


  // Check for the sessionCookie parameter presence
  if (typeof req.body.sessionCookie !== 'undefined' && req.body.sessionCookie !== null) {
    if (debug) console.log("DEBUG: session cookie declared: " + req.body.sessionCookie);
    defaultRequestHeaders['Cookie'] = req.body.sessionCookie;
  }

  // sets the escaladeToV2 parameter
  if (typeof req.body.actionPlaybook !== 'undefined') {
    var _playbook = JSON.parse(req.body.actionPlaybook);
    if (typeof _playbook.globals !== "undefined") {
      if (_playbook.globals.hasOwnProperty('.filepropertiesEscaladeToV2')) {
        if (debug) console.log("DEBUG: fileproperties escalation property declared and set to : " + _playbook.globals.filepropertiesEscaladeToV2);
        escaladeToV2 = _playbook.globals.filepropertiesEscaladeToV2;
      }
    }
  }

  // *** If gzip support is active sends the Aceept-Encoding header
  if (scaledraConf.navigationEngines.static.enableGzipSupport) {
    defaultRequestHeaders['Accept-Encoding'] = 'gzip, deflate';
  }

  defaultRequestHeaders = Object.assign(defaultRequestHeaders, scaledraConf.globals.commonHttpHeaders);

  /*
   * IMPORTANT: request.js problem https://github.com/bitpay/node-bitpay-client/issues/84
   */

  // var pool = new https.Agent({ option.forever: true  });


  try {
    var pageActions = JSON.parse(req.body.actionPlaybook)
    if (typeof pageActions.globals !== 'undefined') {
      if (pageActions.globals.hasOwnProperty('overrideHttpHeaders')) {
        var resultingHeaders = Object.assign(defaultRequestHeaders, pageActions.globals.overrideHttpHeaders)
      }
      // Check if there's a user defined proxy in the actionPlaybook
      if (pageActions.globals.hasOwnProperty('useProxyServer')) {
        userDefinedProxy = Object()
        userDefinedProxy = pageActions.globals.useProxyServer;
      }
    } else {
      var resultingHeaders = Object.assign(defaultRequestHeaders)
    }
  } catch {
    // If no global section with http headers overrides exixsts
    resultingHeaders = defaultRequestHeaders
  }

  // Set the httpPoolMaxSockets value
  var httpPoolMaxSockets = evaluateHttpPoolMaxSockets(scaledraConf.globals.httpPoolMaxSockets, pageActions);


  var options = {
    timeout: scaledraConf.globals.responseTimeoutMs,
    maxRedirects: scaledraConf.navigationEngines.static.maxRedirects,
    followRedirect: true,
    followAllRedirects: true,
    followOriginalHttpMethod: true,
    agent: false,
    pool: { maxSockets: httpPoolMaxSockets },
    // pool: { maxSockets: 100 },
    gzip: scaledraConf.navigationEngines.static.enableGzipSupport,
    jar: true,
    headers: resultingHeaders,
    method: httpMethod,
    proxy: prepareProxyConfigUrl(userDefinedProxy)
  }

  if (debug) console.log("DEBUG: performing request with headers: " + JSON.stringify(options.headers, null, 2));


  /*
   * an HEAD request could be performed but some servers are configured to return the 
   * ['content-type'] only in case of GET requests
   */

  try {



    dns.resolve4(urlParams.hostname, function (err, addresses) { // Check if the domain exists
      if (err) {
        // ERROR: Unable to resolve url domain
        generateErrorResponse(err, res, errorEnums.errors.dns);
      } else {

        // Look for redirects loops
        // var request = require('request');

        try {

          request(url, options)
            .on('request', function (resourceReq) {

              var hostPort = "";
              // hostPort = ":" + resourceReq.agent.defaultPort;

              // if (!resourceReq.agent.defaultPort === 80 || !resourceReq.agent.defaultPort === 443) {
              if (!resourceReq._headers.defaultPort === 80 || !resourceReq._headers.defaultPort === 443) {
                hostPort = ":" + resourceReq._headers.defaultPort
                // hostPort = ":" + resourceReq.agent.defaultPort
              }
              try {
                if (typeof resourceReq._headers['referer'] === 'undefined') {
                  redirectChain.push({
                    httpCode: 301,
                    httpDescription: "Found",
                    httpUrl: resourceReq.protocol + "//" + resourceReq._headers.host + hostPort + resourceReq.path
                  })
                } else {
                  redirectChain.push({
                    httpCode: 200,
                    httpDescription: "OK",
                    httpUrl: resourceReq.protocol + "//" + resourceReq._headers.host + hostPort + resourceReq.path
                  })

                }
              } catch (e) {
                generateErrorResponse(e, res, errorEnums.errors.exception)
                // console.log("an error occured " + e)
              }

            })

            .on('error', function (err) {
              if (escaladeToV2 === true) {
                if (debug) console.log("DEBUG: Fall-back to v2/fileproperties method")
                executeV2fileproperties(req, res);
              } else {
                generateErrorResponse(err, res, errorEnums.errors.exception);
              }
            })

            .on('response', function (response) {
              // Class doesn't report all the intermediate http code statuses
              if (redirectChain.length === 1) {
                /*
                redirectChain[0].httpCode = 200
                redirectChain[0].httpDescription = "OK"
                */

                /* 
                 * In case of 200 OK httpCode sometimes it's null
                 * the same for the response.httpDescription
                 * THIS IS HORRIBLE !!!
                 */
                if (typeof response.httpCode === "undefined") {
                  redirectChain[0].httpCode = 200;
                } else {
                  redirectChain[0].httpCode = response.httpCode;
                }
                if (response.statusMessage === "") {
                  redirectChain[0].httpDescription = "OK";
                } else {
                  redirectChain[0].httpDescription = response.statusMessage;
                }
              } else {
                var i = 0
                for (i = 0; i < redirectChain.length - 1; i++) {
                  redirectChain[i].httpCode = 301
                  redirectChain[i].httpDescription = "Found"
                }
              }

              // force the last 200 code to the response.request.href value
              redirectChain[redirectChain.length - 1].httpUrl = response.request.href;

              // Evaluate for wrong content-type returned by misoconfigured servers
              const finish = new Date();
              const executionTime = (finish.getTime() - start.getTime());

              // if (response.statusCode === 200 && escaladeToV2 !== true) {


              var contentType = getContentType(response.headers);
              var etag;

              if (typeof response.headers['etag'] !== "undefined") {
                response.headers['etag'].replaceAll("\"", "")
              }


              if (redirectChain.length === 1) {
                redirectChain[0].httpCode = response.statusCode;
              }

              var json = JSON.stringify({
                "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
                "correlationId": uuid.v1(),
                "url": url,
                "redirectionChain": cleanRedirectChain(redirectChain),
                "contentType": contentType,
                "contentLength": response.headers['content-length'],
                "contentDisposition": response.headers['content-disposition'],
                "lastModified": response.headers['last-modified'],
                "etag": etag
              }, null, 4)
              // if (err) console.log("AN ERROR OCCURED " + err)
              res.send(json)



            })

        } catch (error) {

          // ERROR: An error occured
          // TODO: Keep in count the specific 'error' object
          generateErrorResponse(error, res, errorEnums.errors.exception);
        }




      }
    })


  } catch (error) {
    console.log("fileproperties: error occurred while retrieving file properties")
    generateErrorResponse(error, res, errorEnums.errors.exception);
  }
})







/**
 * @api {post} /render Render web page image
 * @apiName postRender
 * @apiVersion 0.0.3
 * @apiGroup v1
 * 
 * @apiExample {curl} CURL:
 *     curl -X POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/render
 *        -d "url=http://publicnow.com"
 *        -d "renderFormat=jpg"
 *        -d "imageWidth=800"
 *        -d "imageHeight=600"
 *        -d "imageQuality=75"
 *        -d "returnAsThumbnail=true"
 *        -d "thumbnailReduction=20"
 * 
 * @apiExample {httpie} httpie:
 *     http POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/render
 *        url="http://www.repubblica.it"
 *        renderFormat="jpg"
 *        imageWidth="800"
 *        imageHeight="600"
 *        imageQuality="75"
 *        returnAsThumbnail=true
 *        thumbnailReduction=20
 *
 * @apiDescription Returns a web page rendered image in different formats. Supported formats are: png. gif, jpg and pdf documents
 * 
 * @apiParam {String} url The url of the resource to be downloaded
 * @apiParam {String} renderFormat Indicates the image/document format returned. It can be png, gif, jpg or pdf
 * @apiParam {Integer} [imageWidth] Specifies the width of the image. The paramter is ignored in case of renderFormat pdf. In case 'imageWidth' or 'imageHeight' are missing the default view port size will be 800x600
 * @apiParam {Integer} [imageHeight] Specifies the height of the image. The paramter is ignored in case of renderFormat pdf
 * @apiParam {String} [imageQuality] Indicates the image quality (compression level) in case of renderFormat jpg, it's ingnored in all the other formats
 * @apiParam {Boolean} [returnAsThumbnail] If 'true' return the image which is the 30% of the original image size if the 'thumbnailReduction' parameter is not specified. Default value is 'false'
 * @apiParam {Integer} [thumbnailReduction] The value in percentage of the scale down factor for the thumbnail image. Default value is '30'. Image aspect ratio is preserved during downscaling
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * +-------------------------+
 * | Image / PDF binary data |
 * +-------------------------+
 
 *
 */

app.post('/api/v1/render', function (req, res) {

  var render = phantomStream()
  var quality = req.body.imageQuality
  var returnAsThumbnail = req.body.returnAsThumbnail
  var width = req.body.imageWidth
  var height = req.body.imageHeight
  var thumbnailReduction = req.body.thumbnailReduction
  var format = req.body.renderFormat  // can be png, gif, jpg or pdf
  var cropImage = req.body.cropImage

  var url = req.body.url
  var urlParams = urlParser.parse(url, true)
  var aspectRatio = width / height

  if (debug) console.log("method v1/render: " + url);

  if (req.body.returnThumbnail) {
    returnThumbnail = req.body.returnThumbnail
  }

  if (!width || !height) {  // Set default values for website viewport size
    width = 800
    height = 600
  }

  dns.resolve4(urlParams.hostname, function (err, addresses) { // Check if the domain exists
    if (err) {
      res.setHeader('Content-Type', 'application/json');
      var json = JSON.stringify({ "error": err })
      res.send(json)
    } else {


      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf')
        render(req.body.url, { format: 'pdf', quality: quality, paperFormat: 'A4', crop: true }).pipe(res)
      } else {
        res.setHeader('Content-Type', 'image/' + format);
        if (returnAsThumbnail === 'true') {
          if (!thumbnailReduction) {
            thumbnailReduction = 30
          }
          var thumbWidth = width * (thumbnailReduction / 100)
          var thumbHeight = thumbWidth / aspectRatio

          render(req.body.url, { format: format, quality: quality, width: width, height: height, crop: true })
            .on('error', function (err) {
              var json = JSON.stringify({ "error": err.message })
              res.send(json)
            }) // return thumbnail
            .pipe(resizer.contain({ height: thumbWidth, width: thumbHeight })).pipe(res)

        } else {

          render(req.body.url, { format: format, quality: quality, width: width, height: height, crop: true })
            .on('error', function (err) {
              var json = JSON.stringify({ "error": err.message })
              res.send(json)
            }) // return image
            .pipe(res)
        }

      }
    }
  })
})


/**
 * @api {post} /shutdown Shutdown service
 * @apiName postShutdown
 * @apiVersion 0.0.3
 * @apiGroup v1
 * 
 * @apiExample {curl} CURL:
 *     curl -X GET 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/shutdown
 *
 * @apiExample {httpie} httpie:
 *     http GET 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/shutdown
 * 
 * @apiDescription Shutdown the service. After the core the instance that responded will be no longer available
 * 
 * @apiSuccess {String} status The shutdown acknoledge status message
 * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "status":"shutdown acknowledged, good bye",
 *    "correlationId": "edb5c960-bb24-11e7-a7a7-f928230607a5"
 * }
 
 *
 */

app.post('/api/v1/shutdown', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200)

  var json = JSON.stringify({
    "status": "shutdown acknowledged, good bye",
    "correlationId": uuid.v1()
  })
  res.send(json)

  console.log('Process closed');
  process.exit();

});


/**
 * @api {get} /version Service version
 * @apiSampleRequest /version
 * @apiVersion 0.2.2
 * @apiName GetVersion
 * @apiGroup v1
 *
 * @apiExample {curl} CURL:
 *     curl -X GET
 *        http://us-va-phantomjs-1.noodls.net/api/v1/version
 * 
 * @apiExample {httpie} httpie:
 *     http GET
 *        http://us-va-phantomjs-1.noodls.net/api/v1/version
 * 
 * @apiDescription Returns the version and other service details
 * 
 * @apiSuccess {Object[]} responseTime contains values for: startTime, endTime and elapsedTime in ms
 * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
 * @apiSuccess {String} appName Application name
 * @apiSuccess {Object[]} engineVersion An array containing details about node versions 
 * @apiSuccess {String} phantomjsVersion The version of the phantomjs engine
 * @apiSuccess {String} appDescription  Application brief description
 * @apiSuccess {String} hostname The name of the host that served the request
 * @apiSuccess {String} nodejsPid The process id fo the nodejs server
 * @apiSuccess {String} publicIp The public IP the service uses to navigate pages
 * @apiSuccess {String} privateIp of the nodejs instance, multiple ip can be returned
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "responseTime": {
 *         "startTime": "2017-10-23T15:34:05.075Z",
 *         "endTime": "2017-10-23T15:34:05.122Z",
 *         "elapsedTime": 47
 *     },
 *     "correlationId": "26e52390-bb23-11e7-a5e7-87745a274b1e",
 *     "appName": "PHS",
 *     "appDescription": "Pubtech PHS (Charmander)",
 *     "appVersion": "0.0.3",
 *     "engineVersion": {
 *         "http_parser": "2.7.0",
 *         "node": "6.11.2",
 *         "v8": "5.1.281.103",
 *         "uv": "1.11.0",
 *         "zlib": "1.2.11",
 *         "ares": "1.10.1-DEV",
 *         "icu": "58.2",
 *         "modules": "48",
 *         "openssl": "1.0.2l"
 *     },
 *     "phantomVersion": "2.1.1",
 *    "puppeteerVersion": "1.0",
 *     "platform": "win32",
 *     "hostname": "lucignanir-w7",
 *     "nodejsPid": 1072,
 *     "publicIp": "84.14.71.226",
 *     "privateIp": [
 *         "10.3.1.101",
 *         "169.254.236.71",
 *         "192.168.65.1"
 *     ]
 * }
 *
 */

app.get('/api/v1/version', function (req, res) {
  const start = new Date();


  res.setHeader('Content-Type', 'application/json');
  var hostname = os.hostname();
  var pjson = require('./package.json');


  const finish = new Date();
  const executionTime = (finish.getTime() - start.getTime());

  platformOS(function (e, os) {
    var json = JSON.stringify({
      "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
      "correlationId": uuid.v1(),
      "productName": 'Scaledra Active Proxy',
      "appName": pjson.name,
      "appDescription": pjson.description,
      "appVersion": pjson.version,
      "engineVersion": process.versions,
      "phantomVersion": pjson.dependencies.phantom.replace('^', ""),
      "puppeteerVersion": pjson.dependencies.puppeteer.replace('^', ""),
      "platform": os,
      "hostname": hostname,
      "nodejsPid": proc.pid,
      "aws": { availabilityZone: process.env.AWS_AVAILABILITY_ZONE },
      "publicIp": publicHostIp,
      "privateIp": privateHostIp
    })

    res.end(json);
  })

});

/**
 * @api {post} /download Download file
 * @apiVersion 0.0.2
 * @apiName postDownload
 * @apiGroup v1
 *
 * @apiExample {curl} CURL:
 *     curl -X POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/download
 *        -d "url=www.tutorialspoint.com/java/java_tutorial.pdf"
 *        -d "sessioneCookie=AGREEMENT=yes; expires=Friday, January 10, 2048 at 4:59:23 PM" 
 *        -H "Content-Type: application/x-www-form-urlencoded"
 *
 * @apiExample {httpie} httpie:
 *     http POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/download
 *        url="www.tutorialspoint.com/java/java_tutorial.pdf" 
 *        sessioneCookie="AGREEMENT=yes; expires=Friday, January 10, 2048 at 4:59:23 PM" 
 * 
 *  @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Not found
 * {
 *     "error": {
 *         "description": "Not Found",
 *         "httpCode": 404
 *     }
 * }
 *
 *
 * @apiDescription Download a file via http or https
 * 
 * @apiParam {String} url The url of the resource to be downloaded
 * @apiParam {String} sessionCookie Specifies the Cookie values to inject into the request. Some pages requires a policy agreement in order to open properly, with this paramteres it's possibile to pass it directly into the request.
 * 
 * @apiSuccess {ByteStream} content The remote file content
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
 * <html xmlns="http://www.w3.org/1999/xhtml">
 * <head>
 * <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
 * <meta name="description" content="MyNetFone Media Releases for 2007 MyNetFone delivers voice & data services to enterprise, business and residential customers across Australia. Operating Australia's largest VoIP network, MyNetFone provides quality and value through future-proof, scalable communication solutions. Numerous awards attest to MyNetFone's performance, including the Forbes 'Best Under a Billion', BRW Fast 100, Deloitte Technology Fast 50 (multiple years), CeBIT 'Outstanding Project' Business Excellence Award and many others." />
 * <meta name="keywords" content="Media, Press,voip, voip provider, voice over ip, business voip, virtual pbx, business phone system, sip trunking, hosted pbx, ip pbx, home voip, voip call, naked adsl, adsl2+, broadband, broadband internet, broadband plans, cheap voip, voip solutions, MyNetPhone, MNF, My Net Fone, MyNetFone, Naked ADSL2+, home broadband, business broadband, high-speed internet, high-speed broadband, broadband line, ADSL2+ provider, broadband provider, Naked DSL provider, ADSL2+ service" />
 * <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"  />
 * <meta name="google-site-verification" content="ioJKAUM8XQoIv6FZ-_4CLTGPqCnUveyyJ_wTqv4l8F0" />
 * <meta name="google" content="nositelinkssearchbox" />
 * <title>Media Releases - MyNetFone</title> ...
 
 *
 */
app.post('/api/v1/download', function (req, res) {

  var defaultRequestHeaders = scaledraConf.globals.commonHttpHeaders;

  if (typeof req.body.sessionCookie !== 'undefined' && req.body.sessionCookie !== null) {
    if (debug) console.log("DEBUG: session cookie declared: " + req.body.sessionCookie);
    defaultRequestHeaders['Cookie'] = req.body.sessionCookie;
  }
  var pageActions;
  var resultingHeaders;
  var requestAdditionalHeaders
  var requestMethod = 'GET'
  // var url = checkIfUrlEncoded(req.body.url)
  var url = req.body.url;
  url = checkIfUrlEncoded(url);
  var urlParams = urlParser.parse(url, true);

  var port = 80

  if (debug) console.log("method v1/download: " + url);

  const start = new Date();

  if (urlParams.port === null) {
    if (urlParams.protocol == "https:") {
      port = 443
    }

  } else {
    port = urlParams.port
  }

  let localProxyConfig = Object;

  try {
    pageActions = JSON.parse(req.body.actionPlaybook);
    if (typeof pageActions.globals !== 'undefined') {
      if (pageActions.globals.hasOwnProperty('overrideHttpHeaders')) {
        var resultingHeaders = Object.assign(defaultRequestHeaders, requestAdditionalHeaders, pageActions.globals.overrideHttpHeaders)
      }
      if (pageActions.globals.hasOwnProperty("useProxyServer")) {
        localProxyConfig = pageActions.globals.useProxyServer;
      }
    } else {
      var resultingHeaders = Object.assign(defaultRequestHeaders, requestAdditionalHeaders);
    }

  } catch {
    if (scaledraConf.protocols.httpProxyConfig.proxyUrl !== "") {
      localProxyConfig = scaledraConf.protocols.httpProxyConfig;
    }
    // If no global section with http headers overrides exixsts
    defaultRequestHeaders['Host'] = urlParams.hostname;
    resultingHeaders = defaultRequestHeaders
  }

  var resultingHeaders = Object.assign(defaultRequestHeaders, requestAdditionalHeaders);
  var options;

  var httpMaxPoolSockets = evaluateHttpPoolMaxSockets(scaledraConf.globals.httpPoolMaxSockets, pageActions);

  // Check if proxy config is present
  if (localProxyConfig.proxyUrl !== undefined) {
    // Check if proxy auth is present
    var proxyUrl = urlParser.parse(localProxyConfig.proxyUrl, true)
    // Session cookie passed
    var options = {
      timeout: scaledraConf.globals.responseTimeoutMs,
      host: proxyUrl.hostname,
      port: proxyUrl.port,
      path: urlParams.href,    // url: url,
      gzip: scaledraConf.navigationEngines.static.enableGzipSupport,
      agent: false,
      jar: true,
      pool: { maxSockets: httpMaxPoolSockets },
      method: requestMethod,
      headers: resultingHeaders
    };
    if (localProxyConfig.proxyAuthUser !== "" && localProxyConfig.proxyAuthPassword !== "") {
      let auth = localProxyConfig.proxyAuthUser + ":" + localProxyConfig.proxyAuthPassword;
      // options.headers["Proxy-Authorization"] = "Basic " + (new Buffer.from("lum-customer-c_8964a7f6-zone-static:cb7131b10i7x").toString('base64'));
      options.headers["Proxy-Authorization"] = "Basic " + (new Buffer.from(auth).toString('base64'));
      options.headers["Authorization"] = "Basic " + (new Buffer.from(auth).toString('base64'));
    }

  } else {
    // Session cookie passed
    var options = {
      timeout: scaledraConf.globals.responseTimeoutMs,
      maxRedirects: scaledraConf.navigationEngines.static.maxRedirects,
      followRedirect: true,
      followAllRedirects: true,
      followOriginalHttpMethod: true,
      hostname: urlParams.hostname,
      host: urlParams.hostname,
      path: urlParams.path,
      port: port,
      gzip: scaledraConf.navigationEngines.static.enableGzipSupport,
      agent: false,
      jar: true,
      pool: { maxSockets: httpMaxPoolSockets },
      method: requestMethod,
      headers: resultingHeaders
    };


  }



  if (debug) console.log("DEBUG: performing request with headers: " + JSON.stringify(options.headers, null, 2));

  try {
    dns.resolve4(urlParams.hostname, function (err, addresses) { // Check if the domain exists
      if (err) {
        // ERROR DNS resolution
        generateErrorResponse(err, res, errorEnums.errors.dns);
      } else {

        if (urlParams.protocol === 'http:') { // resources over http

          var _httpRequest = http.get(options, function (response) {
            if (checkForGoodHttpResponseCodes(response.statusCode)) {
              // res.setHeader('Content-disposition', 'attachment; filename=' + req.params.file)

              var contentType = getContentType(response.headers);

              if (typeof contentType !== 'undefined') res.setHeader('Content-type', contentType)

              const finish = new Date();
              const executionTime = (finish.getTime() - start.getTime());

              response.pipe(res)
            } else {
              // ERROR: An error occured
              generateErrorResponse(response, res, errorEnums.errors.http);
            }

          }).on('error', function (err) {
            // ERROR
            generateErrorResponse(err, res, errorEnums.errors.http);
          })

          _httpRequest.on('error', function (err) {
            generateErrorResponse(err, res, errorEnums.errors.http);
          });

        } else if (urlParams.protocol === 'https:') { // resources over https

          var _httpsRequest = https.get(options, function (response) {

            var contentType = getContentType(response.headers);
            // res.setHeader('Content-disposition', 'attachment; filename=' + req.params.file)

            if (typeof contentType !== 'undefined') {
              res.setHeader('Content-type', contentType)
            } else {
              // If not specified it assumes text/html
              res.setHeader('Content-type', 'text/html')
              var tidy = require("tidy-html5").tidy_html5
              pageContent = pageContent.replace("__WEBSITE__", "<a href=\"" + landingUrl + "\">" + landingUrl + "</a>");
              // pageContent = tidy(response, { "indent-spaces": 4 });
              tidy = undefined
            }

            const finish = new Date();
            const executionTime = (finish.getTime() - start.getTime());


            response.pipe(res)

          }).on('error', function (err) {
            // ERROR
            // generateErrorResponse(err, res, errorEnums.errors.http);
          })

          _httpsRequest.on('error', function (err) {
            generateErrorResponse(err, res, errorEnums.errors.http);
          });

        } else {
          // CUSTOM ERROR: Other protocols are not currently supported        
          var json = JSON.stringify({
            "error": {
              "description": "unsupported protocol error",
              "code": "exception/unsupported protocol"
            }
          })
          res.status(520) // As per Cloudflare 5xx errors space
          res.setHeader('Content-Type', 'application/json');
          res.send(json)

        }
      }
    })
  } catch (error) {
    console.log("download: An error occurred while trying to download");
  }

})

/**
 * @api {post} /navigate Navigate page
 * @apiVersion 0.0.9
 * @apiName PostNavigate
 * @apiGroup v1
 *
 * @apiExample {curl} CURL:
 *     curl -X POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/navigate
 *        -d "url=http://publicnow.com"
 *        -d "forceBody=false" 
 *        -d "renderFormat=html"
 *        -H "Content-Type: application/x-www-form-urlencoded"
 * 
 * @apiExample {httpie} httpie:
 *     http POST 
 *        http://us-va-phantomjs-1.noodls.net/api/v1/navigate
 *        url="http://publicnow.com"
 *        forceBody="false"
 *        renderFormat=html
 * 
 * @apiDescription Return a JSON document containing the code of the page rendered via PhantomJS engine, the redirection chain occurred to reach the resource, all the response headers and all the query paramters
 * 
 * @apiParam {String} url The url of the remote resource
 * @apiParam {Boolean} [forceBody] Force the service to return the page body content even if a navigation redirection has occurred. Default is 'false'
 * @apiParam {String} [renderFormat] Set the pageBody content type, paramter can be 'plainText', 'json', 'content' or 'html'. If not specified default value is 'json'. html returns the raw content of the html page not emebdded inside a json document.
 * @apiParam {Integer} [waitForAjax] Set the time in ms to wait before returning the page. During this timme the rendering engine continues to execute the code page. It's useful on sites that loads content as AJAX action after the page has been loaded. If not specified default value is 0
 * @apiParam {Boolean} [removePageScripts] If true stripes-out all the 'script' elements from the page. Default is false
 * @apiParam {Integer} [getFrameContentId] Returns the code of the specified frame id
 * @apiParam {String} [forcePageEncoding] Allows to force a specific charset encoding for a given url, in case PHS is not able to properly detect it
 * @apiParam {Integer} [jsLinkParser] Speciifies if the javascript link resolver should be triggered or not. Possibile values are: 0:Off 3:Simple 5:Full. 'Simple' resolve simple windows.open scripts, 'Full' aims to resolve the output of any javascript output.
 *
 * 
 * @apiSuccess {Object[]} responseTime Contains values for: startTime, endTime and elapsedTime in ms
 * @apiSuccess {String} correlationId Universally Unique Identifier v1. Useful to correlate calls in a microservices architecture
 * @apiSuccess {String} nodeServerPid PID of the nodejs process that served the request
 * @apiSuccess {String} hostname Hostname of the host the PHS service is running on
 * @apiSuccess {String} publicIp Public IP used by the service to navigate the remote page
 * @apiSuccess {String} privateIp Private IP of the host running the service if initialized during process start, if not it will be not present
 * @apiSuccess {String} layoutEngine The framework used to render the page code
 * @apiSuccess {String} url Webpage URL provided in the 'url' parameter
 * @apiSuccess {String} landingUrl The landing url obtained aftyer navigating the web page. If a redirection occurred 'startingUrl' and 'finalUrl' will be different
 * @apiSuccess {Boolean} urlRedirectStrict 'True' if the comparsion of 'startingUrl' and 'finalUrl' reveals a difference at string level
 * @apiSuccess {Boolean} urlRedirectSmart A comparison of 'startingUrl' and 'finalUrl' performed by the compare-url function. For more info visit: https://www.npmjs.com/package/compare-urls
 * @apiSuccess {Object[]} redirectionChain An array containing all the redirection steps that may occur during the web page navigation
 * @apiSuccess {Object[]} httpResponseHeaders An array containing all the response headers
 * @apiSuccess {String} remoteHost Remote host name
 * @apiSuccess {String} remotePort Remote host port (default is 80)
 * @apiSuccess {String} remoteUri The rempte resource uri
 * @apiSuccess {Object[]} remoteQueryParams An array contaning all the query string paramters
 * @apiSuccess {String} urlFragment The "fragment" portion of the URL including the pound-sign (#)
 * @apiSuccess {String} httpScheme The remote server protocol, it can be http or https
 * @apiSuccess {Boolean} forceBody The value of the 'forceBody' parameter provided in the call
 * @apiSuccess {String} renderFormat The requested format to return the 'pageBody' field
 * @apiSuccess {String} orignalPageEncoding The page encoding of the page as received by 
 * @apiSuccess {Boolean} navigationViaProxy Indicates if navigation has been performed via an external proxy
 * @apiSuccess {Integer} hasFrames Indicates If the page contain frames. Frames content is not returned in the 'pageBody' field
 * @apiSuccess {String} pageBody The JSON escaped content of the web page 
 * 
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1. 301 Moved Permanently
 * {
 *     "responseTime": {
 *         "startTime": "2017-10-23T15:32:58.186Z",
 *         "endTime": "2017-10-23T15:33:01.129Z",
 *         "elapsedTime": 2943
 *     },
 *     "correlationId": "26e52390-bb23-11e7-a5e7-87745a274b1e",* 
 *     "nodeServerPid": 9392,
 *     "hostname": "lucignanir-w7",
 *     "publicIp": "84.14.71.226",
 *     "privateIp": "192.168.x.x",
 *     "layoutEngine": "PhantomJS",
 *     "url": "http://publicnow.com",
 *     "landingUrl": "https://www.publicnow.com/home",
 *     "urlRedirectStrict": true,
 *     "urlRedirectSmart": true,
 *     "redirectionChain": [
 *         {
 *             "httpCode": 301,
 *             "httpDescription": "Moved Permanently",
 *             "httpUrl": "http://publicnow.com/"
 *         },
 *         {
 *             "httpCode": 302,
 *             "httpDescription": "Found",
 *             "httpUrl": "https://www.publicnow.com/"
 *         },
 *         {
 *             "httpCode": 301,
 *             "httpDescription": "Moved Permanently",
 *             "httpUrl": "https://www.publicnow.com/home.aspx"
 *         },
 *         {
 *             "httpCode": 200,
 *             "httpDescription": "OK",
 *             "httpUrl": "https://www.publicnow.com/home"
 *         }
 *     ],
 *     "httpResponseHeaders": [
 *         {
 *             "name": "Date",
 *             "value": "Tue, 10 Oct 2017 10:55:02 GMT"
 *         },
 *         {
 *             "name": "Content-Type",
 *             "value": "text/html; charset=utf-8"
 *         },
 *         {
 *             "name": "Transfer-Encoding",
 *             "value": "chunked"
 *         },
 *         {
 *             "name": "Connection",
 *             "value": "keep-alive"
 *         },
 *         {
 *             "name": "Cache-Control",
 *             "value": "public"
 *         },
 *         {
 *             "name": "X-AspNet-Version",
 *             "value": "4.0.30319"
 *         },
 *         {
 *             "name": "X-Powered-By",
 *             "value": "ASP.NET"
 *         },
 *         {
 *             "name": "Server",
 *             "value": "cloudflare-nginx"
 *         },
 *         {
 *             "name": "CF-RAY",
 *             "value": "3ab90b876b3d3dbf-MXP"
 *         }
 *     ],
 *     "remoteHost": "www.publicnow.com",
 *     "remotePort": 80,
 *     "remoteUri": "/home",
 *     "remoteQueryParams": {},
 *     "httpScheme": "https:",
 *     "forceBody": false,
 *     "renderFormat": "json",
 *     "hasFrames": false,
 *     "pageBody": ""
 * }
 *
 */
app.post('/api/v1/navigate', function (req, res) {
  const start = new Date();
  var url = req.body.url
  var renderFormat = 'json'
  var waitForAjax = waitForAjaxBase_PHANTOMJS
  var pageBodyContent
  var removePageScripts = false
  var jsParsingType = jsLinkEnums.parser.simple
  var skipLinkParametersParser = false;
  var landingStatus;
  let localProxyConfig = Object;

  const statusCode = null

  if (debug) console.log("method v1/navigate (PhantomJS): " + url);

  res.setHeader('Content-Type', 'application/json')

  var jsonParams = JSON.parse(JSON.stringify(req.body, null, 2))
  var urlParts = urlParser.parse(url, true)

  if (typeof req.body.jsLinkParser !== 'undefined') {
    jsParsingType = parseInt(req.body.jsLinkParser)
  }

  if (typeof req.body.removePageScripts !== 'undefined') {
    removePageScripts = (req.body.removePageScripts === 'true')
  }

  if (typeof req.body.forceBody !== 'undefined') {
    var forceBody = (req.body.forceBody === 'true')
  } else {
    var forceBody = false
  }

  if (req.body.renderFormat) {
    renderFormat = req.body.renderFormat
  }

  if (req.body.waitForAjax) {
    waitForAjax = parseInt(req.body.waitForAjax) + waitForAjaxBase_PHANTOMJS // 1800
  }


  // Check proxy config
  try {
    var actionPlaybook = JSON.parse(req.body.actionPlaybook);
    localProxyConfig = actionPlaybook.globals.useProxyServer;
  } catch {
    localProxyConfig = scaledraConf.protocols.httpProxyConfig;
  }


  // specific method http headers
  var defaultRequestHeaders = {
    // "Cookie": cookies,
    "Accept-Encoding": "gzip, deflate"
  }

  if (typeof req.body.sessionCookie !== 'undefined') {
    defaultRequestHeaders['Cookie'] = req.body.sessionCookie
  }

  if (debug) console.log("==> waitForAjax value: " + waitForAjax)

  if (typeof url === 'undefined') { // url parameter missing
    res.status(520) // As per Cloudflare 5xx errors space
    var json = JSON.stringify({ "error": "missing URL parameter" })
    res.send(json)
  } else {
    const start = new Date();

    dns.resolve4(urlParts.hostname, function (err, addresses) { // Check if the domain exists
      if (err) {
        // ERROR: Unable to resolve url domain
        generateErrorResponse(err, res, errorEnums.errors.dns);
      } else {

        // phantom.create(['--config=' + __dirname + '/configuration.json', '--proxy=' + scaledraConf.protocols.httpProxy]).then(function (ph) {
        phantom.create(['--config=' + __dirname + '/configuration.json', '--proxy=' + localProxyConfig.proxyUrl, '--proxy-auth=' + localProxyConfig.proxyAuthUser + ":" + localProxyConfig.proxyAuthPassword]).then(function (ph) {
          ph.createPage().then(function (page) {

            // Set the page timeout
            page.on('resourceTimeout', scaledraConf.globals.responseTimeoutMs)



            defaultRequestHeaders = Object.assign(defaultRequestHeaders, scaledraConf.globals.commonHttpHeaders)

            // Set request custom headers
            // page.on('customHeaders',
            //{
            // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
            //"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36 OPR/48.0.2685.52",
            //"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            //"Cookie": cookies,
            //"Accept-Encoding": "gzip, deflate"

            //( "Accept-Language": "en-US,en;q=0.8"
            // "Cookie": "___utmvmRsuKNSEB=UPueEiWHjck; path=/; Max-Age=900\n___utmvaRsuKNSEB=wpy\u0001NqYP; path=/; Max-Age=900\n___utmvbRsuKNSEB=BZO XUHOmalV: wth; path=/; Max-Age=900"
            // "Cookie": "_icl_visitor_lang_js=en-us; expires=0; domain=.www.intrasense.fr; path=/"
            // });

            page.on('customerHeaders', defaultRequestHeaders);

            var redirectChain = [];
            var httpResponseHeaders
            var firstHttpStatusCode
            var landingUrl = null
            var tmp

            /* Set viewport size */
            page.on('viewportSize', { width: 1280, height: 4000 })

            // page.on('onConsoleMessage', function () { });

            page.on('onResourceRequested', function (requestData, request) {

              // var abortRequest = evaluateRequestBlockTerms(interceptedRequest._url)
              if (debug) console.log(' -- requested url ' + requestData['url'])

            })

            page.on('onResourceReceived', function (resource) {

              if (typeof httpResponseHeaders === 'undefined') {
                if (typeof firstHttpStatusCode === 'undefined') {
                  firstHttpStatusCode = resource.status
                  if (firstHttpStatusCode === 403 || firstHttpStatusCode === 404) {
                    landingUrl = url
                  }
                  // console.log("First http return code: " + firstHttpStatusCode)
                }
                if (tmp !== resource.url) {
                  // console.log(resource.url)
                  tmp = "Valore resource URL: " + resource.url
                  redirectChain.push({ httpCode: resource.status, httpDescription: resource.statusText, httpUrl: resource.url })
                }

                if (typeof httpResponseHeaders === 'undefined' && resource.status === 200) {
                  httpResponseHeaders = resource.headers
                  landingUrl = resource.url
                  landingStatus = resource.status

                }
              }

            })

            /*            
            page.on('onResourceTimeout', function (request) {
              console.log('Response (#' + request.id + '): ' + JSON.stringify(request));
            })
            */


            url = checkIfUrlEncoded(url)

            page.open(url).then(function (status) {

              // console.log('*** STATUS:' + status)

              if (status === 'fail') {
                // if (1 === 0) {
                // ERROR: Unable to open page
                var json = JSON.stringify({
                  "error": {
                    "description": "unable to open page",
                    "httpCode": status
                  }
                })
                res.send(json);
                ph.exit();

              } else {


                // Check if a specific frame has been specified in the request
                if (req.body.getFrameContentId !== '0') {
                  //if (true) {
                  if (debug) console.log('DEBUG: Rendering for frame: ' + req.body.getFrameContentId)
                  page.switchToFrame(req.body.getFrameContentId, 10)
                  var contentProperty = 'frameContent'
                } else {
                  var contentProperty = 'content'
                }

                // console.log('Returning content for: ' + contentProperty)

                setTimeout(function () {
                  page.property(contentProperty).then(function (content) {


                    // If navigation succeded
                    if (status === 'success') {

                      // const finish = new Date();
                      // const executionTime = (finish.getTime() - start.getTime());

                      // console.log("PAGE LOADED " + status);

                      // This in case the last item in the redirect chain returns a code different from HTTP/200
                      if (landingUrl === null) {
                        landingUrl = redirectChain[redirectChain.length - 1].httpUrl
                      }

                      var urlParams = urlParser.parse(landingUrl, true)

                      if (urlParams.port === null && urlParams.protocol === "http:") {
                        urlParams.port = 80
                      } else if (urlParams.port === null && urlParams.protocol === "https:") {
                        urlParams.port = 443
                      }

                      var urlPath = urlParams.pathname
                      // var contentBody = addBaseElement(content, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/"))) // Add base html element for relative links
                      // var contentBody = addBaseElement(content, urlParams.protocol + "//" + urlParams.host) // Add base html element for relative links
                      var contentBody = content

                      /*
                        Evaluate redirection flags
                      */
                      var smartRedirect = false
                      var strictRedirect = false
                      var hasFrames = 0


                      // Evaluate redirect flgags
                      url = decodeURIComponent(url)
                      landingUrl = decodeURIComponent(landingUrl)

                      if (!compareUrls(url, landingUrl)) {
                        smartRedirect = true;
                      }

                      if ((url !== landingUrl)) {
                        strictRedirect = true;
                        if (!forceBody) {
                          contentBody = ""
                        }
                      }

                      // Evaluate presence of frames and iframes in the page
                      hasFrames = (contentBody.match(/(<iframe.+?<\/iframe>)/gi) || []).length;

                      var headIndex
                      var headersArray = []
                      // Fix charset encoding problems
                      for (headIndex in httpResponseHeaders) {
                        headersArray[httpResponseHeaders[headIndex].name.toLowerCase()] = httpResponseHeaders[headIndex].value
                      }


                      var encodingResults = getPageEncoding(req, headersArray['content-type'], contentBody)


                      encodingResults.pageContent = completeParameterLinks(encodingResults.pageContent, urlParams, jsParsingType)


                      var $ = cheerio.load(encodingResults.pageContent);
                      // Check if there is a "base" element declared for the links
                      if (typeof $('base').attr('href') == 'undefined') {
                        // If NOT assumes the website root to complete links
                        var baseElementBody = addBaseElement(encodingResults.pageContent, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/")) + "/") // Add base html element for relative links
                        var contentBody = linkConverter.convert(baseElementBody, urlParams.protocol + "//" + urlParams.host + urlPath.substring(0, urlPath.lastIndexOf("/") + 1))
                      } else {
                        // If DECLARED uses the base element declaration

                        var baseLink = $('base').attr('href');
                        // var baseLink = docDom.window.document.querySelector("base").getAttribute("href")
                        if (baseLink === "/") { // Fix local base references
                          var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + "//" + urlParams.host)
                        } else {
                          if (baseLink.indexOf("http") === -1) { // fix base url without protocol and host
                            if (baseLink.substring(0, 1) === '/') baseLink = baseLink.substring(1, baseLink.length - 1) // Avoid doubble slashes
                            var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + "//" + urlParams.host + "/" + baseLink)
                          } else {
                            // var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + '//' + urlParams.hostname)
                            var contentBody = linkConverter.convert(encodingResults.pageContent, baseLink)
                          }
                        }
                        // docDom = null
                      }


                      // var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + '//' + urlParams.hostname)
                      // var contentBody = linkConverter.convert(encodingResults.pageContent, urlParams.protocol + "//" + urlParams.hostname + urlPath.substring(0, urlPath.lastIndexOf("/")) + "/")

                      /* In case of specific http codes, avoids to return the page contant */

                      var err = new Error();
                      err.statusCode = 200;
                      var redirectionChain = cleanRedirectChain(redirectChain)


                      if (!checkForGoodHttpResponseCodes(redirectionChain[redirectionChain.length - 1].httpCode)) {

                        switch (redirectionChain[redirectionChain.length - 1].httpCode) {

                          case 400:       // Bad request
                            err.statusMessage = "Bad Request";
                            err.statusCode = 400;
                            generateErrorResponse(err, res, errorEnums.errors.http);
                            break;

                          // TODO: Keep enabled in scaledra
                          case 404:       // Not found
                            err.statusMessage = "Not Found";
                            err.statusCode = 404;
                            generateErrorResponse(err, res, errorEnums.errors.http);
                            break;

                          case 403:       // Forbidden
                            err.statusMessage = "Forbidden";
                            err.statusCode = 403;
                            generateErrorResponse(err, res, errorEnums.errors.http);

                            break;
                          case 500:       // Internal server error
                            err.statusMessage = "Internal Server Error";
                            err.statusCode = 500;
                            generateErrorResponse(err, res, errorEnums.errors.http);
                            break;
                          case 301:       // Moved permanently
                            if (!forceBody) {
                              contentBody = "";
                            }
                            // httpErrorDoc = new errorClasses.http(301, "moved permanently");
                            break;
                          case 302:       // Moved temporairly (Found)
                            if (!forceBody) {
                              contentBody = "";
                            }
                            // httpErrorDoc = new errorClasses.http(301, "moved temporairly");
                            break;
                        }

                      } else {


                        var hostname = os.hostname()

                        if (JSON.stringify(urlParams.query) === "{}") {
                          var queryParams
                        } else {
                          var queryParams = urlParams.query
                        }

                        const finish = new Date();
                        const executionTime = (finish.getTime() - start.getTime());

                        // Set the content return type accordingly to the renderFormat parameter
                        if (renderFormat === 'plainText') {
                          const dom = new JSDOM(sanitizeHtml(contentBody))

                          pageBodyContent = dom.window.document.querySelector("body").textContent

                        } else if (renderFormat === 'content') {
                          htmlContent(contentBody, function (err, article, meta) {
                            var json = JSON.stringify({
                              "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
                              "correlationId": uuid.v1(),
                              "nodeServerPid": proc.pid,
                              "hostname": hostname,
                              "publicIp": publicHostIp,
                              "privateIp": privateHostIp,
                              "aws": { availabilityZone: process.env.AWS_AVAILABILITY_ZONE },
                              "layoutEngine": "PhantomJS",
                              "url": req.body.url,
                              "landingUrl": landingUrl,
                              "urlRedirectStrict": strictRedirect,
                              "urlRedirectSmart": smartRedirect,
                              "redirectionChain": redirectionChain,
                              "httpResponseHeaders": httpResponseHeaders,
                              "remoteHost": urlParams.host,
                              "remotePort": urlParams.port,
                              "remoteUri": urlParams.pathname,
                              "remoteQueryParams": queryParams,
                              "urlFragment": urlParams.hash,
                              "httpScheme": urlParams.protocol,
                              "forceBody": forceBody,
                              "renderFormat": renderFormat,
                              "originalPageEncoding": encodingResults.pageEncoding,
                              "hasFrames": hasFrames,
                              "navigationViaProxy": proxyEnabled,
                              "pageBody": article.content
                            });
                            // console.log(content)   
                            res.setHeader('X-Powered-By', "Scaledra Active Proxy")
                            res.setHeader('Content-Length', json.length)
                            res.status(200)
                            // res.status(firstHttpStatusCode)

                            res.send(json);
                            ph.exit()
                          })
                        } else if (renderFormat === 'html') {
                          res.setHeader('X-Powered-By', "Scaledra Active Proxy")
                          res.setHeader('Content-Length', contentBody.length)
                          res.status(200)
                          res.setHeader('Content-Type', 'text/html')
                          if (removePageScripts) {
                            // if (req.body.removePageScripts) {
                            res.send(removeScript(contentBody))

                          } else {
                            res.send(contentBody)
                          }
                          ph.exit()
                        } else { // return html
                          // pageBodyContent = contentBody
                        }

                        if (renderFormat === 'json' || renderFormat === 'plainText') {
                          /*
                          var decode = require('unescape');
                          var fs = require('fs');
                          */


                          if (removePageScripts) {
                            pageBodyContent = removeScript(contentBody)
                          } else {
                            pageBodyContent = contentBody
                          }

                          var json = JSON.stringify({
                            "responseTime": { startTime: start, endTime: finish, elapsedTime: executionTime },
                            "correlationId": uuid.v1(),
                            "nodeServerPid": proc.pid,
                            "hostname": hostname,
                            "publicIp": publicHostIp,
                            "privateIp": privateHostIp,
                            "aws": { availabilityZone: process.env.AWS_AVAILABILITY_ZONE },
                            "layoutEngine": "PhantomJS",
                            "url": req.body.url,
                            "landingUrl": landingUrl,
                            "urlRedirectStrict": strictRedirect,
                            "urlRedirectSmart": smartRedirect,
                            "redirectionChain": cleanRedirectChain(redirectChain),
                            "httpResponseHeaders": httpResponseHeaders,
                            "remoteHost": urlParams.host,
                            "remotePort": urlParams.port,
                            "remoteUri": urlParams.pathname,
                            "remoteQueryParams": queryParams,
                            "urlFragment": urlParams.hash,
                            "httpScheme": urlParams.protocol,
                            "forceBody": forceBody,
                            "renderFormat": renderFormat,
                            "originalPageEncoding": encodingResults.pageEncoding,
                            "hasFrames": hasFrames,
                            "navigationViaProxy": proxyEnabled,
                            "pageBody": pageBodyContent
                          })
                          // console.log(content)   
                          if (err.statusCode !== 200) {
                            generateErrorResponse(err, res, errorEnums.errors.http);

                          } else {
                            res.setHeader('X-Powered-By', "Scaledra Active Proxy")
                            res.setHeader('Content-Length', json.length)
                            // NOTE: Set 200 as PHS response 
                            res.status(200);
                            // res.status(firstHttpStatusCode)

                            /*
                            fs.writeFile("c:/temp/pageBodyContent.html", decode(pageBodyContent), function(err) {
                              if(err) {
                                  return console.log(err);
                              }
                            })
                            console.log("File save completed")
                            */

                            res.send(json)

                          }
                          ph.exit();

                        }
                      }



                    }

                    // console.log("PhantomJS process id after exit: " + ph.process.pid);

                    // exec = require('child_process').exec;
                    // exec('kill -9 ' + pjpid, cb);
                    // console.log("PhantomJS process id: " + pjpid);

                    // }, waitForAjax)


                    //}

                  })
                }, waitForAjax)

              }
              // })

            })
            //ph.exit()
          })
        })
      }
    })
  }
})


/**
 *  BEGIN VERSION 3 API
 *
 */

app.post('/api/v3/navigate', async (req, res) => {
  const {
    url,
    renderFormat = "html",
    includeOriginalHtml,
    jsLinkParser,
    getFrameContentId,
    sessionCookie,
    forceBody,
    removePageScripts,
    actionPlaybook,
    waitForAjax } = req.body;

  switch (renderFormat) {
    case 'html':
      res.set('Content-Type', 'text/html');
      break;
    case 'json':
      res.set('Content-Type', 'application/json');
      break;
    default:
      return res.status(400).send(`Unrecognized render format: ${renderFormat}`);
  }

  if (!url) {
    return res.status(400).send('Missing required parameter: url'); // If URL is missing
  }

  const responseTimeStart = new Date(); // Record the start time of the response
  const correlationId = uuid.v1(); // Generate a correlation ID
  const nodeServerPid = process.pid; // Get the current process ID
  const hostname = os.hostname(); // Get the hostname
  const publicIp = publicHostIp; // Get the public IP address
  const privateIp = privateHostIp; // Get the private IP address
  const aws = { availabilityZone: process.env.AWS_AVAILABILITY_ZONE }; // AWS information placeholder
  const layoutEngine = 'Selenium web driver (chrome)'; // Layout engine information
  var urlRedirectStrict = false; // URL redirect strict flag
  var urlRedirectSmart = false; // URL redirect smart flag
  var landingUrl; // Store the landing URL
  var urlParams; // URL Params
  var httpResponseHeaders;
  var jsParsingType = jsLinkEnums.parser.simple, frameId = -1, cookies, isOriginalHtml = false;

  if (typeof jsLinkParser !== "undefined")
        jsParsingType = parseInt(jsLinkParser);

  isOriginalHtml = (typeof includeOriginalHtml !== "undefined") && (includeOriginalHtml === true);

  frameId = typeof getFrameContentId !== "undefined" ? parseInt(getFrameContentId) : undefined;

  if (typeof sessionCookie !== "undefined") {
    if (debug)
      console.log("DEBUG: session cookie declared: " + sessionCookie);
    cookies = sessionCookie;
  }

  if (waitForAjax) {
    delayForAjax = parseInt(waitForAjax) + waitForAjaxBase_PUPPETEER;
  }

  const forceBodyValue = (typeof forceBody !== 'undefined') ? (forceBody === 'true') : false;

  const removeScripts = (removePageScripts === "true");

  const redirectionChain = []; // Create an empty redirectionChain array

  let driver = undefined;
  var pageActions;
  var jsParsingType;
  var userDefinedProxy;

  const {proxyUrl, proxyAuthUser, proxyAuthPassword} = scaledraConf.protocols.httpProxyConfig;
  const { host, port } = scaledraConf.protocols.seleniumProxyConfig;
  const { Builder, proxy, chrome } = require('selenium-webdriver');

  if (actionPlaybook) {
    try {
      pageActions = JSON.parse(actionPlaybook); // Parse the actionPlaybook from the request body
    } catch (error) {
      console.log(`Error parsing action playbook: ${error}`);
    }

    if (pageActions && pageActions.globals) {
        const {
            jsLinkParserStrategy,
            useProxyServer
         }= pageActions.globals;

       if (jsLinkParserStrategy) jsParsingType = jsLinkParserStrategy; // Get the JS link parser strategy

       if (useProxyServer) {
         userDefinedProxy = {
           proxyUrl: proxyUrl || useProxyServer.proxyUrl, // Get the proxy URL from scaledraConf or override with useProxyServer value
           proxyAuthUser: proxyAuthUser || useProxyServer.proxyAuthUser, // Get the proxy authentication user from scaledraConf or override with useProxyServer value
           proxyAuthPassword: proxyAuthPassword || useProxyServer.proxyAuthPassword, // Get the proxy authentication password from scaledraConf or override with useProxyServer value
         };

         useProxyServer = userDefinedProxy; // Update the useProxyServer object in the pageActions
      }
    }

    if (pageActions && pageActions.actions) {
      const mappingActions = pageActions.actions.filter(
        (action) => action.type === 'jsonDocumentToHtmlMapping' || action.type === 'jsonArrayToHtmlMapping'
      ); // Filter mapping actions

      if (mappingActions.length > 0) {
        const mappingAction = mappingActions[0]; // Assume only one mapping action for simplicity

        if (mappingAction.dataEndpoint) {
          url = mappingAction.dataEndpoint; // Update the URL with the dataEndpoint value from the mapping action
        }

        if (mappingAction.useMainUrlAsDataEndpoint) {
          console.log('Using main URL as data endpoint.');
          // Do something with the main URL as the data endpoint
        } else {
          url = actionEngine.parseDynamicParams(url); // Parse dynamic parameters in the URL
        }

        if (mappingAction.payload) {
          // Replace dynamic fields in the payload with actual values
          mappingAction.payload = actionEngine.replaceDynamicFieldsFromUrl(mappingAction.payload);
        }

        // Perform the actual HTTP request and process the response
        // ...
      }
    }
  }

  let proxyConfig = {}; // Proxy configuration object initialization
  console.log("proxy started");

/**
 * Setting Proxy From Scaledra Config
 *
 */

  if (proxyUrl !== "") {
    const pageActions = JSON.parse(actionPlaybook || "{}");
  
    if (pageActions.globals?.useProxyServer) {
      const useProxyServer = pageActions.globals.useProxyServer;
      proxyConfig = {
        proxyType: 'manual',
        proxyUrl: useProxyServer.proxyUrl || proxyUrl,
        proxyAuthUser: useProxyServer.proxyAuthUser || proxyAuthUser,
        proxyAuthPassword: useProxyServer.proxyAuthPassword || proxyAuthPassword,
      };
    } else {
      proxyConfig = {
        proxyType: 'manual',
        proxyUrl,
        proxyAuthUser,
        proxyAuthPassword,
      };
    }
  
    console.log("Proxy Config:", proxyConfig);
    
    const proxyAddr = proxyConfig.proxyUrl;
  
    const chromeOptions = new chrome.Options(),
      driverProxyConfig = proxy.manual({
        http: proxyAddr,
        https: proxyAddr
      });
  
    chromeOptions.setProxy(driverProxyConfig);
    chromeOptions.setLoggingPrefs({ performance: 'ALL' });
  
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  
    const pageCdpConnection = await driver.createCDPConnection('page');
  
    await driver.register(proxyAuthUser || proxyConfig.proxyAuthUser, proxyAuthPassword || proxyConfig.proxyAuthPassword, pageCdpConnection);
    await driver.sleep(10_000);
  } else if (host !== "") {
    const proxyAddr = `${host}:${port}`;
  
    const chromeOptions = new chrome.Options(),
      driverProxyConfig = proxy.manual({
        http: proxyAddr,
        https: proxyAddr
      });
  
    chromeOptions.setProxy(driverProxyConfig);
    chromeOptions.setLoggingPrefs({ performance: 'ALL' });
  
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  
    const pageCdpConnection = await driver.createCDPConnection('page');
    await driver.register(proxyAuthUser || proxyConfig.proxyAuthUser, proxyAuthPassword || proxyConfig.proxyAuthPassword, pageCdpConnection);
    await driver.sleep(10_000);
  } else {
    driver = await new Builder().forBrowser('chrome').build();
  }

/**
 * Parse Cookie,
 * Make Head
 * Get Page Content
 */

  try {
    await driver.get(url); // Navigate to the URL using the driver
    // Set cookie data into web driver

    const parseCookie = (cookieStr) => {
        const cookieArr = cookieStr.split('; ');
        const cookieObj = {};
      
        for (let i = 0; i < cookieArr.length; i++) {
          const [key, value] = cookieArr[i].split('=');
      
          if (key.toLowerCase() === 'expires') {
            cookieObj.expiry = new Date(value).getTime() / 1000; // Convert to Unix timestamp
          } else if (key.toLowerCase() === 'path') {
            cookieObj.path = value;
          } else {
            cookieObj.name = key;
            cookieObj.value = value;
          }
        }
      
        return cookieObj;
      }

    if(cookies){
      await driver.manage().deleteAllCookies();
      await driver.manage().addCookie(parseCookie(cookies));
      // await driver.navigate().refresh();
    }

    urlParams = URLParse(url, true);     // Get the httpResponseHeaders by http module

    let logs = await driver.manage().logs().get('performance');

    httpResponseHeaders = logs
        .map(log => JSON.parse(log.message).message)
        .find(message => message.method === 'Network.responseReceived')
        .params.response.headers;

    const initialUrl = await driver.getCurrentUrl(); // Get the initial URL and add it to the redirectionChain

    landingUrl = initialUrl; // Init landing URL into initialUrl

    urlParams = URLParse(landingUrl, true); // Parse LandingURL into urlParams

    var currentUrl = initialUrl; // Follow redirects and update the redirectionChain

    redirectionChain.push({
      httpCode: 301,
      httpDescription: 301,
      httpUrl: url,
    });

    urlRedirectStrict = true; // URL redirect strict flag
    urlRedirectSmart = true; // URL redirect smart flag
    
    while (true) {
      const entries = await driver.executeScript(() => window.performance.getEntries());
      
      if (!entries || entries.length === 0) // No more redirects or no entries found
        break;

      const entry = entries[0];
      
      if (!entry.responseStatus && redirectionChain.length > 1) // No response available
          break;

      const { responseStatus: httpCode, name: nextUrl } = entry;
      const httpDescription = entry.responseStatus;

      if (!nextUrl || (nextUrl === currentUrl && redirectionChain.length > 1)) // No more redirects or cyclic redirect
        break;

      redirectionChain.push({
        httpCode,
        httpDescription,
        httpUrl: nextUrl,
      });

      if (httpCode !== 200) {
        console.log(`Error: ${httpCode} ${httpDescription}`);
        break;
      }

      if(nextUrl != currentUrl) {
        await driver.get(nextUrl);
        currentUrl = nextUrl;
      }
    }

    // Add base tag on top of the head section
    await driver.executeScript(`
       var base = document.createElement('base');
       base.href = '${urlParams.protocol + "//" + urlParams.host}';
       document.head.insertBefore(base, document.head.firstChild);
    `);

    const delay = ms => new Promise(res => setTimeout(res, ms)); // Delay some time for ajax loading

    if(delayForAjax) {
      await delay(delayForAjax);
    }

    let originPage = ''; // Declare originPage variable
    const pageBody = await driver.getPageSource(); // Save originPage HTML

    if(isOriginalHtml)
        originPage = pageBody;

/**
 * Page Encodeing and Frame Count
 *
 */

    const originalPageEncoding = await driver.executeScript("return document.characterSet");
    const frameData = await driver.findElements(By.tagName('iframe'));
    const hasFrames = frameData.length;

    const extractIframe = async (driver, mainPage) => {
      const $ = cheerio.load(mainPage);
      await processIframes(driver, $, $('body'), 0);
      return $.html();
    }

    const processIframes = async (driver, $, root, count) => {
        count++;

        if (count > 20) return;

        const iframes = root.find('iframe').toArray();

        for (const iframe of iframes) {
          try {
            const iframeElem = $(iframe);

            // Find the iframe WebElement and switch to it
            const frameElement = await driver.findElement(By.css('iframe'));
            await driver.switchTo().frame(frameElement);

            let page = await driver.getPageSource();
            let pageURL = iframeElem.attr('src');
            let pageParams;

            if (pageURL) {
              pageParams = URLParse(pageURL, true);
              page = linkConverter.convert(page, `${pageParams.protocol}//${pageParams.host}`);
            }

            const $nested = cheerio.load(page); // Recursively process nested iframes

            await processIframes(driver, $nested, $nested('body'), count + 1);

            iframeElem.html($nested.html()); // Insert the iframe content directly into the iframe element in the Cheerio context

            await driver.switchTo().defaultContent();
          } catch (error) {
            console.error(error);
          }
        }
    }

    const setIframeSrcdoc = pageHTML => {
      const $ = cheerio.load(pageHTML);
    
      const processIframeElem = iframeElem => {
        // Parse the srcdoc attribute or inner HTML into a new Cheerio context
        const srcdoc = iframeElem.attr('srcdoc') || iframeElem.html();
        const $srcdoc = cheerio.load(srcdoc);
    
        // Find all iframes in the srcdoc and process them
        $srcdoc('iframe').each((i, nestedIframe) => {
          processIframeElem($srcdoc(nestedIframe));
        });
    
        // Update the srcdoc attribute with the processed HTML
        iframeElem.empty();
        iframeElem.attr('srcdoc', $srcdoc.html());
      }
    
      // Process all iframes in the HTML
      $('iframe').each((i, iframe) => {
        processIframeElem($(iframe));
      });
    
      return $.html();
    }

    const extractNthIframeSrcdoc = (pageHTML, n) => {
      const $ = cheerio.load(pageHTML);
      let count = 0;
      let srcdocContent;
    
      const processIframeElem = iframeElem => {
        if (srcdocContent !== undefined) { // If we've already found the nth iframe, no need to continue
          return;
        }

        if (count === n) { // If this is the nth iframe, extract the srcdoc content and stop
          srcdocContent = iframeElem.attr('srcdoc');
          return;
        }

        count++;

        // Parse the srcdoc attribute or inner HTML into a new Cheerio context
        const srcdoc = iframeElem.attr('srcdoc') || iframeElem.html();
        const $srcdoc = cheerio.load(srcdoc);

        // Find all iframes in the srcdoc and process them
        $srcdoc('iframe').each((i, nestedIframe) => {
          processIframeElem($srcdoc(nestedIframe));
        });
      }

      // Process all iframes in the HTML
      $('iframe').each((i, iframe) => {
        processIframeElem($(iframe));
      });

      return srcdocContent;
    }

    // Call the function
    pageBody = await extractIframe(driver, pageBody);
    pageBody = setIframeSrcdoc(pageBody);

    // Get Frame HTML content
    if(frameId > 0){
      pageBody = extractNthIframeSrcdoc(pageBody, frameId - 1);
      // let pageURL = await frameData[frameId - 1].getAttribute('src');
      // let pageParams = URLParse(pageURL, true);
      // console.log(pageURL);
      // await driver.switchTo().frame(frameId - 1);
      // await delay(3000);
      // let currentFrame = await driver.findElement(By.tagName('html')).getAttribute('outerHTML');
      // //output name of current frame
      // pageBody = await driver.getPageSource();
      // pageBody = linkConverter.convert(pageBody, pageParams.protocol + "//" + pageParams.host);
    }
    // Apply jsLinkParser to the page body
    if(jsParsingType)
      pageBody = completeParameterLinks(
        pageBody,
        urlParams,
        jsParsingType
      );

    // Construct the response object
    const responseTimeEnd = new Date();
    const responseTimeElapsed = responseTimeEnd - responseTimeStart;

    // Remove scripts on the pages.
    if(removeScripts == true)
      pageBody = removeScript(pageBody);
    // pageBody = linkConverter.convert(pageBody, urlParams.protocol + "//" + urlParams.host);

/**
 * Return the Final Response
 *
 */

    if (renderFormat === 'html') {
        res.status(200).send(pageBody); // Send the page body as HTML response
    } else if (renderFormat === 'json') {
        if(forceBodyValue == false)
            pageBody = '';

        const responseObj = JSON.stringify({
            responseTime: { startTime: responseTimeStart, endTime: responseTimeEnd, elapsedTime: responseTimeElapsed },
            correlationId: correlationId,
            nodeServerPid: nodeServerPid,
            hostname: hostname,
            publicIp: publicIp,
            privateIp: privateIp,
            aws: aws,
            layoutEngine: layoutEngine,
            url: url,
            landingUrl: landingUrl,
            urlRedirectStrict: urlRedirectStrict,
            urlRedirectSmart: urlRedirectSmart,
            redirectionChain: redirectionChain,
            httpResponseHeaders: normalizeHttpResponseHeaders(httpResponseHeaders),
            remoteHost: urlParams.host,
            remotePort: urlParams.port,
            remoteUri: urlParams.pathname,
            urlFragment: urlParams.hash,
            httpScheme: urlParams.protocol,
            forceBody: forceBodyValue,
            renderFormat: renderFormat,
            originalPageEncoding: originalPageEncoding,
            hasFrames: hasFrames,
            navigationViaProxy: proxyEnabled,
            pageBody: pageBody,
            originalHtml: originPage
      });

      res.status(200).send(responseObj); // Send the response object as JSON response
    }
  } catch (error) {
    res.status(500).send(`Error navigating to ${url}: ${error.message}`); // Send an error response if an exception occurs
  } finally {
    // Close the driver
    await driver.quit();
  }
});

/**
 * END VERSION 3 API
 *
 */




/*
 *
 * Service functions
 * 
 */

function checkDNS(hostname) {
  var dnsResponse = false
  dns.resolve4(hostname, function (err, addresses) {
    if (err) {
      dnsResponse = false
    } else {
      dnsResponse = true
    }
  })
  return dnsResponse
}

/*
 *
 * Prepare JSON response for file properties method
 * 
 */
function fileJsonResponse(headers, url, startTime, endTime, response) {

  var etag;
  var executionTime = endTime.getTime() - startTime.getTime();

  if (typeof headers['etag'] !== "undefined") {
    etag = headers['etag'].replaceAll("\"", "")
  }

  var json = JSON.stringify({
    "responseTime": { startTime: startTime, endTime: endTime, elapsedTime: executionTime },
    "correlationId": uuid.v1(),
    "url": url,
    "redirectionChain": [
      {
        "httpCode": response.statusCode,
        "httpDescription": response.statusMessage,
        "httpUrl": url
      }
    ],
    "contentType": headers['content-type'],
    "contentLength": headers['content-length'],
    "etag": etag,
    "contentDisposition": headers['content-disposition'],
    "lastModified": headers['last-modified']
  }, null, 4)

  return json

}


/* 
 * 
 * Prepare the error json response
 * 
 */
function generateErrorResponse(errObj, res, errType) {
  try {
    var httpStatusCode = 200;

    switch (errType) {

      case 1: // HTTP(S) errors
        var json = JSON.stringify({
          "error": {
            "type": "http",
            "description": errObj.statusMessage.toLowerCase(),
            "code": errObj.statusCode
          }
        })
        // httpStatusCode = errObj.code;
        break;

      case 3: // DNS errors. Reference: https://support.umbrella.com/hc/en-us/articles/232254248-Common-DNS-return-codes-for-any-DNS-service-and-Umbrella-
        var json = JSON.stringify({
          "error": {
            "type": "dns",
            "description": errObj.syscall + " " + errObj.code + " for url: " + errObj.hostname,
            "code": 3
          }
        })
        break;

      case 5: // Exceptions
        var json = JSON.stringify({
          "error": {
            "type": "exception",
            "description": errObj.message + "\n " + errObj.stack + " for url: " + errObj.hostname,
            "code": -1
          }
        })

      case 7: // Custom errors
        var json = JSON.stringify({
          "error": {
            "type": "customError",
            "description": errObj.stack,
            "code": -1
          }
        })


        break;

    }

  } catch (e) {
    var json = JSON.stringify({
      "error": {
        "type": "customError",
        "description": e.toString(),
        "code": -1
      }
    })
  } finally {
    res.setHeader('Content-Type', 'application/json')
    res.status(httpStatusCode);
    res.send(json);
  }
}



/* 
 * 
 * Clean up the redirection chain from duplicate entries
 * 
 */
function cleanRedirectChain(redirectChain) {
  var i = 0
  var skipElement = false
  var redirectChainClean = []

  redirectChain.forEach(function (element) {

    if (redirectChainClean.length === 0) {
      redirectChainClean.push(element)
    } else if (
      redirectChainClean[redirectChainClean.length - 1].httpCode !== element.httpCode ||
      redirectChainClean[redirectChainClean.length - 1].httpDescription !== element.httpDescription ||
      redirectChainClean[redirectChainClean.length - 1].httpUrl !== element.httpUrl
    ) {

      for (i = 0; i < redirectChainClean.length; i++) {
        if (redirectChainClean[i].httpCode === 403 || redirectChainClean[i].httpCode === 404 || redirectChainClean[i].httpCode === 500) {
          skipElement = true
          break
        }
      }

      if (!skipElement) {
        redirectChainClean.push(element)
      }
    }

  })
  return redirectChainClean
}

/*
 *
 * Perform an XHR call
 * 
 */
function executeXhrRequest(url, method, headers) {

  var options = {
    method: method,
    uri: url,
    headers: headers,
    timeout: 30000,
    maxRedirects: 4,
    followRedirect: true,
    followAllRedirects: true,
    followOriginalHttpMethod: true,
    agent: false,
    pool: { maxSockets: Infinity }
  }

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error) {
        reject(JSON.stringify({
          "error": {
            "type": "http",
            "description": "error performing xhr request to: " + url,
            "code": 3
          }
        })
        )
      }
      resolve(JSON.stringify(body));
    })
  })

}

/* 
 * 
 * Evaluate the httpPoolMaxSockets
 * 
 */
function evaluateHttpPoolMaxSockets(defaultHttpPoolMaxSockets, pageActions) {

  var httpPoolMaxSockets;

  if (defaultHttpPoolMaxSockets == 0) {
    httpPoolMaxSockets = Infinity;
  } else {
    httpPoolMaxSockets = defaultHttpPoolMaxSockets;
  }

  // Overrides the  pool maxSockets value from actionPlaybook
  if (typeof pageActions !== 'undefined') {
    if (typeof pageActions.globals !== 'undefined') {
      if (pageActions.globals.hasOwnProperty("httpPoolMaxSockets")) {
        httpPoolMaxSockets = pageActions.globals.httpPoolMaxSockets;
      }
    }
  }
  return httpPoolMaxSockets;
}

/* 
 * 
 * Evaluate if a url contains requestBlockTerms
 * 
 */
function evaluateRequestBlockTerms(url) {
  if (scaledraConf.globals.requestAbortTerms.length > 0) {
    if (new RegExp(scaledraConf.globals.requestAbortTerms.join('|')).test(url)) {
      return true
    }
    return false
  } else {
    return false
  }

}

/* 
 * 
 * Check the hgttp codes the response is considered good
 * 
 */

function checkForGoodHttpResponseCodes(httpCode) {
  var _state = false;

  scaledraConf.protocols.http.goodHttpCodesForResponse.forEach(function (_httpCode, index) {

    if (httpCode === _httpCode) {
      _state = true;
    }
  });

  if (_state) {
    return true;
  } else {
    return false;
  }
}

/* 
 * 
 * Get e JSON property value for a given path
 * 
 */                                                                                                                                                                       
function getJsonProperty(json, path,) {
  try {
    var tokens = path.split(".");
    var obj = json;
    for (var i = 0; i < tokens.length; i++) {
      obj = obj[tokens[i]];
    }
    return obj;
  } catch {
    return "";
  }
}


/* 
 * 
 * Clean up html code and remove script
 * 
 */
function removeScript(htmlCode) {

  const dom = new JSDOM(sanitizeHtml(htmlCode))
  var pageBodyContent = sanitizeHtml(htmlCode, {
    allowedTags: false,
    allowedAttributes: false,
    exclusiveFilter: function (frame) {
      return frame.tag === 'script'
    }
  })
  if (debug) console.log('==> removing script elements')

  return pageBodyContent
}



/*
 *
 * Checks if a variable is a byte array
 * 
 */
function isByteArray(array) {
  if (array && array.byteLength !== undefined) return true;
  return false;
}

/*
 *
 * Try to figure out the content-type from responses
 * from server configured by mentally disturbed people
 * 
 */
function getContentType(resHeaders) {

  var contentType;


  if (typeof resHeaders['content-disposition'] !== 'undefined') {
    var fileExtetions = resHeaders['content-disposition'].match(/\.([a-zA-Z0-9]){2,4}/gmi);

    if (typeof resHeaders['content-type'] === 'undefined') {
      // content-disposition present and content-type missing
      if (debug) console.log("DEBUG: content-type missing in server response. A content-disposition header is present, trying to get extension for that header")


      if (typeof fileExtetions !== 'undefined') {

        // TODO: Complete with mime-type the response
        contentType = mime.lookup(fileExtetions[fileExtetions.length - 1])

        if (contentType === null) {
          // TODO: Try to idenitfy the mime-type using the magic numbers

        }

        if (debug) console.log("DEBUG: detected mime-type is: " + contentType)
      } else {
        console.log("DEBUG: No content-type and useful data found inside content-disposition, unable to determine the correct content-type. Assume text/html")
        contentType = "text/html"
      }
    } else {
      // CASE content-disposition present and content-type present
      if (typeof resHeaders['content-type'] !== 'undefined') {

        if (mime.extension(resHeaders['content-type'])) {
          // content-type returned by server is valid
          contentType = resHeaders['content-type'].replaceAll("\"", "");
          if (debug) console.log("DEBUG: mime-type declared by server is: " + contentType)
        } else {
          // content-type returned by the server is wrong
          if (debug) console.log("DEBUG: content-type declared is invalid: " + resHeaders['content-type']);
          contentType = mime.lookup(fileExtetions[fileExtetions.length - 1])
          if (debug) console.log("DEBUG: content-type inferred from content-disposition (" + resHeaders['content-disposition'] + "): " + contentType)

        }
      } else {
        // If missing it assumes text/html
        contentType = "text/html"
        if (debug) console.log("DEBUG: content-type missing in response assumes 'text/html'")
      }
    }
  } else {
    // CASE no content-disposition
    if (mime.extension(resHeaders['content-type'])) {
      // content-type returned by server is valid
      contentType = resHeaders['content-type'].replaceAll("\"", "");
      if (debug) console.log("DEBUG: mime-type declared by server is: " + contentType)
    } else {
      // content-type returned by the server is wrong
      if (debug) console.log("DEBUG: content-type declared is invalid: " + resHeaders['content-type'] + " we assune text/html");
      contentType = "text/html";

    }

  }
  return contentType;
}

/*
 *
 * Converts string to binary data
 * 
 */
function stringToBinary(input) {
  var characters = input.split('');

  return characters.map(function (char) {
    const binary = char.charCodeAt(0).toString(2)
    const pad = Math.max(8 - binary.length, 0);
    // Just to make sure it is 8 bits long.
    return '0'.repeat(pad) + binary;
  }).join('');
}


/*
 *
 * Normalize the http response headers from pupeeteer to be
 * in the same format as which one returned by PhantomJS
 * 
 */
function normalizeHttpResponseHeaders(httpResponseHeaders) {
  var header;
  var headersArray = [];
  for (header in httpResponseHeaders) {
    headersArray.push({ name: header, value: httpResponseHeaders[header] })
  }

  return headersArray;
}

/*
 *
 * Replace anchor links with paramters only ( href='?i=578')
 * with the reference to the current path (href='events.php?i=578')
 * This function must be used before the resolution from relative to 
 * absolute links
 * 
 */
function completeParameterLinks(htmldoc, urlParams, jsParsingType) {

  // hyperlinks inside a generic string
  const rHyperlinks = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/gi;

  // This will slow down page parsing but it will cover upper case tag and attribute names
  const $ = cheerio.load(htmldoc, { lowerCaseTags: true, lowerCaseAttributeNames: true })


  var htmldocOut = htmldoc
  const start = new Date()

  if (debug) console.log("**\n*\n* LOGGING: completeParametersLinks & javascript link resolver\n*\n**")

  /*
   *
   * Tries to resolve hyperlinks inside javascripts (href and onclick events)
   * 
   */
  if (jsParsingType === jsLinkEnums.parser.simple) {

    const startParseJs = new Date()



    var hyperlink = ""

    // Tries to extract hyperlinks from onclick scripts in anchors
    $("a[onclick]").each(function () {
      if (debug) console.log("DEBUG: Found 'OnClick' event in anchor: " + $.html(this));

      hyperlink = parseLink($(this), rHyperlinks, 'onclick', debug)

      if (hyperlink !== "") {
        $(this).attr('href', hyperlink);
        $(this).removeAttr('onclick')
      }

    })

    // Tries to extract hyperlinks from href with javascripts inside
    // Cherrio doens't support case-insensitive matching of attribute values, some cases may be 
    // not covered

    var _rexStartHrefChars = RegExp("^(%20|&nbsp;)+", "gmi");

    $("a[href*='avascript']").each(function () {
      if (debug) console.log("DEBUG: Found javascript 'href' attribute in anchor: " + $.html(this));

      hyperlink = parseLink($(this), rHyperlinks, 'href', debug)

      if (hyperlink !== "") {
        if (typeof hyperlink === "object") {
          hyperlink = hyperlink[0].replace(_rexStartHrefChars, "");
        } else {
          hyperlink = hyperlink.replace(_rexStartHrefChars, "");
        }
        $(this).attr('href', hyperlink);
      }

    })

    const finishParseJs = new Date()
    if (debug) console.log("DEBUG: Parse Javascript links took: " + (finishParseJs.getTime() - startParseJs.getTime() + "ms"))

  }


  // Look for links starting with '?'
  $("a[href^='?']").each(function () {
    if (debug) console.log("DEBUG: Found parameter link: " + $(this).attr('href'));
    $(this).attr('href', urlParams.pathname + $(this).attr('href'));
    if (debug) console.log("DEBUG: Resolved relative link is: " + $(this).attr('href'));
  })

  htmldocOut = $.html();

  const finish = new Date();
  var executionTime = finish.getTime() - start.getTime()


  if (debug) console.log("*\n* DEBUG: completeParametersLinks check took: " + executionTime + "ms\n*")

  return htmldocOut


  function parseLink(htmlElement, rHyperlinks, attribute, debug) {

    var hyperlink = htmlElement.attr(attribute).match(rHyperlinks);
    if (hyperlink !== null) {
      if (debug)
        console.log("DEBUG: Extracting (" + attribute + ") and replacing absolute hyperlink: " + hyperlink);
      return hyperlink
    }
    else {
      // TODO: Rewrite this
      /*
      if (htmlElement.attr(attribute).indexOf("window.open") !== -1) {
        // Link could be relative and not absolute ex '/mylink?param1=value1'
        hyperlink = htmlElement.attr(attribute);
        hyperlink = hyperlink.replace(new RegExp(/.*window.open\((["|']?)/g), '').replace("\"", "'");
        hyperlink = hyperlink.substring(0, hyperlink.indexOf("'"));
        if (debug)
          console.log("DEBUG: Extracting (href) and replacing relative hyperlink: " + hyperlink);
        return hyperlink;
      */
      if (htmlElement.attr(attribute).indexOf("(") !== -1) {
        var tmpLink = ""
        // Link could be relative and not absolute ex '/mylink?param1=value1'
        tmpLink = htmlElement.attr(attribute).substring(htmlElement.attr(attribute).indexOf('(') + 2, htmlElement.attr(attribute).lastIndexOf(')')).replace("'", "\"")
        tmpLink = tmpLink.split(",")[0]
        hyperlink = tmpLink.substring(0, tmpLink.lastIndexOf('"'))
        if (debug)
          console.log("DEBUG: Extracting (href) and replacing relative hyperlink: " + hyperlink);
        return hyperlink;

      } else {
        // javascript contains e path without javascript in front or window.open
        hyperlink = htmlElement.attr(attribute).match(/\(['|"]\/*(.*)['|"]\)/gi)
        if (hyperlink !== null) {
          return hyperlink[0].substring(2, hyperlink[0].length - 2)
        } else {


          if (debug)
            console.log("DEBUG: Script doesn't contain a valid hyperlink");
          return ""
        }
      }
    }

  }


}


/*
 *
 * Implement replaceAll function for strings 
 * replace is performed case insensitive
 * 
 */
String.prototype.replaceAll = function (search, replacement) {
  var target = this;


  /*  
    var regEx = new RegExp(search, "ig");
    var replacement = "as";
    
    var result = 'This iS IIS'.replace(regEx, replacement);
  */
  return target.replace(new RegExp(search, 'ig'), replacement);
};


/*
 *
 * Append a base element to the html code structure
 * 
 */
function addBaseElement(htmlCode, baseURL) {
  const dom = new JSDOM(htmlCode)
  var baseElement = dom.window.document.createElement('base')

  if (baseURL.substring(baseURL.length - 1) !== '/') {
    baseElement.setAttribute('href', baseURL + "/")
  } else {
    baseElement.setAttribute('href', baseURL)
  }

  dom.window.document.head.insertBefore(baseElement, dom.window.document.head.children[0]) // Insert as first head element
  return dom.serialize('html')
}

/*
 *
 * Check redirection information
 * 
 */
function check_redirect(url) {
  var req = request.head(url, function (err, resp, body) {
    if (url != resp.request.uri.href) {
      console.log('Landing page is different from provided one: ' + resp.request.uri.href);
      // landingUrl = resp.request.uri.href;
    } else {
      console.log('\n No redirection occured \n');
    }
  });

}

/*
 *
 * Check if the original url has been passed already encoded
 * in rto avoid encding it again
 * 
 */
function checkIfUrlEncoded(url) {

  /*
  if (url.indexOf('%') != -1) {
    return checkIfUrlEncoded(decodeURIComponent(url));
  }
  var urlParams = urlParser.parse(url, true)

  if (urlParams.pathname === null) urlParams.pathname = ""
  if (urlParams.search === null) urlParams.search = ""
  url = urlParams.protocol + "//" + urlParams.hostname + "/" + encodeURIComponent(urlParams.pathname.substring(1, urlParams.path.length)) + urlParams.search
  return url;
  */

  // var specialChars = [ "'", "’"];
  // var specialReplacement = [ "%92", "%92"];
  // var _url = url

  // for (var i = 0; i < specialChars.length; i++) {
  //   if (url.indexOf(specialChars[i]) !== -1) {
  //     _url = encodeUrl(url);
  //   }
  // }


  if (url.indexOf('%') !== -1) {
    return url;
    // return decodeURI(encodeUrl(url))
  } else {
    return encodeUrl(url)
  }

  //      return encodeURI(url);

}

/*
 *
 * Check if a list contains an entry
 * 
 */
function containsObject(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i] === obj) {
      console.log("Found: " + JSON.stringify(obj))
      return true;
    }
  }
  console.log("Not Found: " + JSON.stringify(obj))
  return false;
}

/*
 *
 * Check for the process list (GNU/Linux only)
 * 
 */
function cpid(pjpid) {
  find('pid', pjpid).then(function (list) {
    console.log(list);
    if (list.length > 0) {
      exec = require('child_process').exec;
      exec('kill -9 ' + pjpid, cb);
    } else {
      console.log("PhantomJS process already closed");
    }
  }, function (err) {
    console.log(err.stack || err);
  })
}


/*
 *
 * Reads the list of all the supported encodings in Iconv
 * 
 */
function readCharsets() {

  var fs = require("fs");
  ICONV_SUPPORTED_CHARSETS = fs.readFileSync(__dirname + "/res/iconv/encodings").toString().split('\n');

}

function readHtml5Template() {

  var fs = require("fs");
  HTML5_TEMPLATE = fs.readFileSync(__dirname + "/res/templates/html5.tmpl").toString();

}

function cb() {
  console.log('PhantomJS process forcibly killed');
}

/*
 *
 * Tries to extract the content encoding from the page and page reuqest
 * It assumes utf-8 in case no specific indication
 * 
 */
function getPageEncoding(request, responseHeader, pageBody) {

  var pageContent = pageBody

  if (typeof (request.body.forcePageEncoding) !== 'undefined' && request.body.forcePageEncoding !== "") {
    var responseEncoding = request.body.forcePageEncoding.toLowerCase()

  } else {
    if (responseHeader) {
      var responseEncoding = charset(responseHeader)

      if (responseEncoding === null) {
        // Look for a content type definition in the page
        responseEncoding = charset(pageBody.toString())
        if (responseEncoding === null) {
          // If fails set a default to utf-8
          var responseEncoding = 'utf-8'
        } else {
          pageContent = fixCharsetEncoding(pageBody)
        }
      } else {
        if (responseEncoding.toLowerCase() === 'utf8') responseEncoding = 'utf-8'

        if (responseEncoding === null) {
          // If fails set a default to utf-8
          var responseEncoding = 'utf-8'
        }
      }
    }



  }
  return {
    pageEncoding: responseEncoding,
    pageContent: pageContent
  };
}

/*
 *
 * Fix charset encoding fro output page
 * 
 */

function fixCharsetEncoding(pageBody) {
  var domDoc = new JSDOM(pageBody)
  try {
    var element = domDoc.window.document.querySelector("meta[charset]")
    if (element !== null) {
      element.setAttribute("charset", "utf-8")
    } else {
      var element = domDoc.window.document.querySelector("meta[http-equiv='Content-Type'][content]")
      if (element) element.setAttribute("content", "text/html; charset=utf-8")
    }
    var pageContent = domDoc.window.document.documentElement.outerHTML.toString()
    // var pageContent = domDoc.window.document.querySelector("html").outerHTML
    // pageContent = pageContent.replace(/&amp;/g, "&")
    return pageContent
  } catch (err) {
    console.log("error: header extraction and replacement failed")
  }
}

/*
 *
 * 
 * 
 */
function prepareProxyConfigUrl(proxy) {

  var proxyConfig

  // check if a proxy string has been defined in the playbook
  if (proxy != undefined) {
    if (proxy.proxyUrl != "") {
      let localProxy = urlParser.parse(proxy.proxyUrl)
      proxyConfig = localProxy.protocol + "//" + proxy.proxyAuthUser + ":" + proxy.proxyAuthPassword + "@" + localProxy.host;
    } else {
      proxyConfig = "";
    }
    if (debug) console.log("INFO: proxy declared in the actionPlaybook, using: " + proxy);
  } else {

    if (scaledraConf.protocols.httpProxyConfig.proxyUrl !== "") {
      var proxyData = urlParser.parse(scaledraConf.protocols.httpProxyConfig.proxyUrl, true)
      if (scaledraConf.protocols.httpProxyConfig.proxyAuthUser !== "" && scaledraConf.protocols.httpProxyConfig.proxyAuthPassword !== "") {
        proxyConfig = proxyData.protocol + "//" + scaledraConf.protocols.httpProxyConfig.proxyAuthUser + ":" + scaledraConf.protocols.httpProxyConfig.proxyAuthPassword + "@" + proxyData.hostname + ":" + proxyData.port
      } else {
        proxyConfig = scaledraConf.protocols.httpProxyConfig.proxyUrl
      }
    } else {
      proxyConfig = ""
    }
  }
  return proxyConfig

}



/*
 *
 * Intialize an elasticsearch index if not existing
 * 
 */
function intializeESIndex() {

  client.indices.create({
    index: 'phs'
  }, function (err, resp, status) {
    if (err) {
      console.log("Index already exists");
    }
    else {
      console.log("create", resp);
    }
  });
}


/*
 *
 * Start the server main process
 * 
 */

var port = process.env.PHS_PORT || 3000;
var server = app.listen(port, function () {
  // var server = app.listen(process.argv[2], function () {

  process.setMaxListeners(0);


  var pjson = require('./package.json');
  var fs = require('fs');
  fs.readFile(__dirname + "/res/build_banner.txt", 'utf8', function (err, data) {
    if (err) throw err;
    console.log(data.replace("__VERSION__", pjson.version));
  });

  // intializeESIndex();

  publicIp.v4().then(ip => {

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          addresses.push(address.address);
        }
      }
    }

    if (scaledraConf.protocols.httpProxyConfig) {
      proxyEnabled = true
      var rq = require('request');
      try {
        console.log("Proxy config URL is: " + prepareProxyConfigUrl());
        rq({ "url": "https://api.ipify.org?format=json", "method": "GET", "proxy": prepareProxyConfigUrl() }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var res = JSON.parse(body)

            publicHostIp = res.ip
            console.log("Scaledra proxy public ip (proxied): " + publicHostIp)
          }
        })
      } catch (e) {
        console.log("ERROR: " + e)
      }
    } else {
      publicHostIp = ip
      console.log("Scaledra proxy public ip: " + publicHostIp)
    }

    privateHostIp = addresses
    hostname = os.hostname()

    console.log("Loading extended charsets support")
    readCharsets()

    console.log("Loading HTML 5 document template")
    readHtml5Template()

    if (scaledraConf.extensions.mercuryReaderApiKey) {
      console.log("Initializing extension Mercury Reader with API KEY: " + scaledraConf.extensions.mercuryReaderApiKey)
    }
  });

  var host = server.address().address
  var port = server.address().port

  console.log("Scaledra API endpoint: http://%s:%s", host, port)

  console.log("EDGE proxy endpoint: " + scaledraConf.protocols.httpProxyConfig.proxyUrl)

  console.log("Setting waiForAjax_PHANTOMJS base value to: " + scaledraConf.navigationEngines.phantomjs.waitForAjaxBase)
  waitForAjaxBase_PHANTOMJS = scaledraConf.navigationEngines.phantomjs.waitForAjaxBase
  console.log("Setting waiForAjax_PUPPETEER base value to: " + scaledraConf.navigationEngines.puppeteer.waitForAjaxBase)
  waitForAjaxBase_PUPPETEER = scaledraConf.navigationEngines.puppeteer.waitForAjaxBase

  if (process.env.SCALEDRA_DEBUG) {
    debug = (process.env.SCALEDRA_DEBUG === 'true')
  }
  console.log("debugging: " + debug);

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = scaledraConf.protocols.https.NodeTlsRejectUnauthorized
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED == 0) {
    console.log("SSL certificates: Ignoring invalid certificates")
  } else {
    console.log("SSL certificates: Check for invalid certificates")
  }

  // process.env.UV_THREADPOOL_SIZE  = 128;

})

