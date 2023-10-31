"use strict"
var PDFJS = require("pdfjs-dist");


exports.getPDFMetaDataFromUrl = async function (url, callback) {

    var retrievalTask = PDFJS.getDocument(url);

    retrievalTask.promise.then(function (pdf) {

        var pdfDoc = pdf;
        pdfDoc.getMetadata().then(function (stuff) {
            /*
            console.log("Raw metadata date is: " + stuff["info"]["CreationDate"]); // Metadata object here
            console.log("Parsed date is: " + convertPDFDateTimeToISO(stuff["info"]["CreationDate"]));
            */
            return convertPDFDateTimeToISO(stuff["info"]["CreationDate"]);
        }).catch(function (err) {
            console.log('Error getting meta data');
            console.log(err);
        });

        // Render the first page or whatever here
        // More code . . . 
    }).catch(function (err) {
        console.log('Error getting PDF from ' + url);
        console.log(err);
    }, function (reason) {
        // PDF loading error
        console.error(reason);
    });


}

function convertPDFDateTimeToISO(pdfDateTime) {

    var rex = new RegExp("\[0-9]{8}", "gmi");
    var _tempVal = pdfDateTime.match(rex);

    if (typeof _tempVal !== 'undefined' || _tempVal !== "") {
        return _tempVal[0].substring(0, 4) + "-" + _tempVal[0].substring(4, 6) + "-" + _tempVal[0].substring(6, 8);
    } else {
        return "";
    }
}