/* jshint node: true */
"use strict";

var cheerio = require('cheerio');
var urlParser = require('url');
const tidy = require("tidy-html5").tidy_html5;
const moment = require('moment');
// var PDFToolkit = require(__dirname + "/pdfMetadataGather.js");

exports.executeAction = function (pageActions, i, pageContent, HTML5_TEMPLATE, debug) {

  try {
    var execStart = new Date();
    var execEnd;

    switch (pageActions.actions[i].action.type) {

      case "grabInnerElementContent": // TODO: port this action in thre v0/navigate too

        var $ = cheerio.load(pageContent);

        var wrappingTagOpen = "";
        var wrappingTagClose = "";

        var tmpData = $(pageActions.actions[i].action.selector).text();


        if (pageActions.actions[i].action.wrappingTag) {
          wrappingTagOpen = "<" + pageActions.actions[i].action.wrappingTag + ">";
          wrappingTagClose = "</" + pageActions.actions[i].action.wrappingTag + ">";
        }

        pageContent = HTML5_TEMPLATE;
        pageContent = pageContent.replaceAll("__CODE_FRAGMENT__", wrappingTagOpen + tmpData + wrappingTagClose);

        $ = cheerio.load(pageContent);
        // actionPlaybookPlayed = true
        pageActions.actions[i].action.result = 'OK';

        execEnd = new Date();
        pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4));

        break;

      /*
       *
       * action name  : grabInnerHtmlContent
       * action family: content
       *
       */
      case "grabInnerHtmlContent":  // TODO: port this action in the v0/navigate too

        var $ = cheerio.load(pageContent);

        var wrappingTagOpen = "";
        var wrappingTagClose = "";

        if (pageActions.actions[i].action.selector) {
          tmpData = $(pageActions.actions[i].action.selector).html();
        } else {
          tmpData = $.html();
        }

        // transformHtmlTag (DEPRECATED)
        if (pageActions.actions[i].action.transformHtmlTag && pageActions.actions[i].action.transformHtmlTag.enabled === true) {
          tmpData = tmpData.replace(new RegExp(pageActions.actions[i].action.transformHtmlTag.begin.from, "gmi"), pageActions.actions[i].action.transformHtmlTag.begin.to);
          tmpData = tmpData.replace(new RegExp(pageActions.actions[i].action.transformHtmlTag.end.from, "gmi"), pageActions.actions[i].action.transformHtmlTag.end.to);
        }

        // trasnformations
        if (pageActions.actions[i].action.transformations) {
          for (var x = 0; x < pageActions.actions[i].action.transformations.length; x++) {
            if (pageActions.actions[i].action.transformations[x].transformation.enabled) {
              tmpData = tmpData.replace(new RegExp(pageActions.actions[i].action.transformations[x].transformation.find, "gmi"), pageActions.actions[i].action.transformations[x].transformation.replace);
            }
          }
        }

        // wrappingTag
        if (pageActions.actions[i].action.wrappingTag) {
          wrappingTagOpen = "<" + pageActions.actions[i].action.wrappingTag + ">";
          wrappingTagClose = "</" + pageActions.actions[i].action.wrappingTag + ">";
        }

        if (pageActions.actions[i].action.selector) {
          pageContent = HTML5_TEMPLATE;
          pageContent = pageContent.replaceAll("__CODE_FRAGMENT__", wrappingTagOpen + tmpData + wrappingTagClose);
        } else {
          // In case the action selector is not present it returns the entire original page
          pageContent = tmpData;
        }

        $ = cheerio.load(pageContent);
        // actionPlaybookPlayed = true
        pageActions.actions[i].action.result = 'OK';

        execEnd = new Date();
        pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4));

        break;

      /*
       *
       * action name  : removeHtmlElement
       * action family: content
       *
       */
      case "removeHtmlElement":

        var $ = cheerio.load(pageContent);
        $(pageActions.actions[i].action.selector).remove();

        pageContent = $.html();

        // $ = cheerio.load(pageContent);   
        // actionPlaybookPlayed = true
        pageActions.actions[i].action.result = 'OK';


        execEnd = new Date();
        pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4));

        break;

      /*
       *
       * action name  : altherHtmlElement
       * action family: content
       *
       */
      case "alterHtmlElement":

        var $ = cheerio.load(pageContent);
        var _origVal = "";


        $(pageActions.actions[i].action.findElementSelector).each(function (index, element) {
          if (pageActions.actions[i].action.elementAttributeName === '@text') {
            var _tempVal = pageActions.actions[i].action.replaceElementExpression.replaceAll(new RegExp("\\{\\$self\\}", "gmi"), $(element).text());
          } else {
            var _tempVal = pageActions.actions[i].action.replaceElementExpression.replaceAll(new RegExp("\\{\\$self\\}", "gmi"), $(element).attr(pageActions.actions[i].action.elementAttributeName));
          }

          _origVal = _tempVal;

          // element transofmations
          if (pageActions.actions[i].action.transformations) {
            for (var x = 0; x < pageActions.actions[i].action.transformations.length; x++) {
              if (pageActions.actions[i].action.transformations[x].transformation.enabled) {
                // Check if a replace clause exists
                if (pageActions.actions[i].action.transformations[x].transformation.hasOwnProperty("replace")) {
                  var _tempValCopy = _tempVal.replaceAll(new RegExp(pageActions.actions[i].action.transformations[x].transformation.find, "gmi"), pageActions.actions[i].action.transformations[x].transformation.replace);
                  if (_tempValCopy !== null) {
                    _tempVal = _tempValCopy;
                  }
                  if (pageActions.actions[i].action.elementAttributeName === '@text') {
                    $(element).text(_tempVal);
                  } else {
                    $(element).attr(pageActions.actions[i].action.elementAttributeName, _tempVal);
                  }

                } else {
                  if (pageActions.actions[i].action.elementAttributeName === '@text') {
                    var _tempVal = $(element).text().match(new RegExp(pageActions.actions[i].action.transformations[x].transformation.find, "gmi"));
                  } else {
                    var _tempVal = $(element).attr(pageActions.actions[i].action.elementAttributeName).match(new RegExp(pageActions.actions[i].action.transformations[x].transformation.find, "gmi"));
                  }
                  if (_tempVal !== null) {
                    _tempVal = _tempVal[0];
                    if (pageActions.actions[i].action.elementAttributeName === '@text') {
                      $(element).text(_tempVal);
                    } else {
                      $(element).attr(pageActions.actions[i].action.elementAttributeName, _tempVal);
                    }
                  }
                }
              } else {
                if (pageActions.actions[i].action.elementAttributeName === '@text') {
                  $(element).html(_origVal);
                } else {
                  $(element).attr(pageActions.actions[i].action.elementAttributeName, _origVal);
                }
              }



              // If not match in the transformation original value is preserved
              if (_tempVal === null || _tempVal === '') {
                if (pageActions.actions[i].action.elementAttributeName === '@text') {
                  $(element).html(_origVal);
                } else {
                  $(element).attr(pageActions.actions[i].action.elementAttributeName, _origVal);
                }
                // If there are further transformation they will be applied on the original value
                _tempVal = _origVal;
              }

            }
          } else {
            if (pageActions.actions[i].action.elementAttributeName === '@text') {
              $(element).html(_tempVal);
            } else {
              $(element).attr(pageActions.actions[i].action.elementAttributeName, _tempVal);
            }
          }
        });

        pageContent = $.html();
        // $ = cheerio.load(pageContent);   
        // actionPlaybookPlayed = true
        pageActions.actions[i].action.result = 'OK';


        execEnd = new Date();
        pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4));

        break;


      /*
       *
       * action name  : htmlElementsToField
       * action family: content
       *
       */
      case "htmlElementsToField":  // TODO: port this action in thre v0/navigate too

        var wrappingTagOpen = "";
        var wrappingTagClose = "";
        // Render the header with parameter replacement if any
        var HtmlOutputHeader = "";
        var HtmlOutputFooter = "";
        if (pageActions.actions[i].action.htmlOutput.htmlPrefix) {
          HtmlOutputHeader = pageActions.actions[i].action.htmlOutput.htmlPrefix;
          for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
            HtmlOutputHeader = HtmlOutputHeader.replace("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel);
          }
        }

        // Render the footer with parameter repalcement if any
        if (pageActions.actions[i].action.htmlOutput.htmlSuffix) {
          HtmlOutputFooter = pageActions.actions[i].action.htmlOutput.htmlSuffix;
          for (var s = 0; s < pageActions.actions[i].action.fieldsMapping.length; s++) {
            HtmlOutputFooter = HtmlOutputFooter.replace("{" + pageActions.actions[i].action.fieldsMapping[s].fieldLabel + "}", pageActions.actions[i].action.fieldsMapping[s].fieldLabel);
          }
        }

        var $ = cheerio.load(pageContent);

        var tempVal;
        var tabledata = "";
        var record;
        var rex;
        var fields = new Object();

        // Switches between vertical logic to item logic
        if (pageActions.actions[i].action.hasOwnProperty("itemSelector") || pageActions.actions[i].action.hasOwnProperty("itemSelectorMulti")) {


          // Experimental
          var items;
          var _itemsBuffer = "";
          var itemsArray;

          if (pageActions.actions[i].action.hasOwnProperty("itemSelector")) {
            items = $(pageActions.actions[i].action.itemSelector);
          } else {
            items = $(pageActions.actions[i].action.itemSelectorMulti);
          }

          // If returned items is even and selector is composed
          if ((items.length % 2 == 0) && pageActions.actions[i].action.hasOwnProperty("itemSelectorMulti")) {
            // if (pageActions.actions[i].action.hasOwnProperty("itemSelectorMulti")) {

            var _selectors = pageActions.actions[i].action.itemSelectorMulti.split(",");
            var _tempItem = "";
            var _numOfSelectors = _selectors.length;


            for (var _icounter = 0; _icounter < items.length; _icounter += _numOfSelectors) {

              for (var _selectorNum = 0; _selectorNum < _numOfSelectors; _selectorNum++) {
                _tempItem = _tempItem + $(items[_icounter + _selectorNum]);
              }

              _itemsBuffer = _itemsBuffer + "<itemdivider>" + _tempItem + "</itemdivider>";
              _tempItem = "";
            }

            itemsArray = cheerio.load(_itemsBuffer);

          } else {
            // TODO: Test this part for itemSelectorMulti in case of even or odd elements in the selector array
            ///      The difference is that there's no _numOfSelectors in the increment inside the array cycle  
            for (var _icounter = 0; _icounter < items.length; _icounter++) {
              // _itemsBuffer = _itemsBuffer + "<itemdivider>" + $(items[_icounter]).html() + "</itemdivider>";
              _itemsBuffer = _itemsBuffer + $(items[_icounter]);
            }

            // itemsArray = $;
            itemsArray = cheerio.load(_itemsBuffer);

          }

          // itemsArray = cheerio.load(_itemsBuffer);

          // End epxerimental


          // Fields cycle
          for (var j = 0; j < pageActions.actions[i].action.fieldsMapping.length; j++) {

            var list = [];
            var _selector;

            // Iterates on items and apply field queries to each single item
            // Iterates on items and apply field queries to each single item
            $(pageActions.actions[i].action.itemSelector).each(function (index, element) {

              // Qualifies the field value
              tempVal = qualifyFieldValue($, element, pageActions.actions[i].action.fieldsMapping[j], true, debug);


              // TODO: Externalize transformation and make it accessible to all actions
              // Check for a field transformation
              if (typeof pageActions.actions[i].action.fieldsMapping[j].transformation !== 'undefined' && pageActions.actions[i].action.fieldsMapping[j].transformation.enabled === true && tempVal !== "") {
                var rexData = pageActions.actions[i].action.fieldsMapping[j].transformation.find;
                var rexTransformation = new RegExp(rexData, "gmi");

                // Check if replace clause is present
                if (pageActions.actions[i].action.fieldsMapping[j].transformation.hasOwnProperty("replace")) {
                  tempVal = tempVal.replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[j].transformation.replace);
                } else {
                  var _tempVal = tempVal.match(rexTransformation);
                  if (_tempVal !== null) {
                    tempVal = _tempVal[0];
                  } else {
                  }
                }
              }

              // Check for  multiple transofrmations. Skips if the value is an empty string
              if (typeof pageActions.actions[i].action.fieldsMapping[j].transformations !== 'undefined' && tempVal !== "") {
                for (var x = 0; x < pageActions.actions[i].action.fieldsMapping[j].transformations.length; x++) {
                  if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.enabled) {
                    var rexData = pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.find;
                    var rexTransformation = new RegExp(rexData, "gmi");

                    // Check if replace clause is present
                    if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.hasOwnProperty("replace")) {
                      tempVal = tempVal.replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.replace);
                    } else {
                      var _tempVal = tempVal.match(rexTransformation);
                      if (_tempVal !== null) {
                        tempVal = _tempVal[0];
                      } else {
                      }
                    }
                  }

                }
              }


              list.push(tempVal);

            })
            fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = list;

          }


        } else {



          // Iterates on fields and assign JSON arrays to an associative array
          for (var j = 0; j < pageActions.actions[i].action.fieldsMapping.length; j++) {

            var list = [];
            $(pageActions.actions[i].action.fieldsMapping[j].sourceElementSelector).each(function (index, element) {





              // TODO: Check with Cheerio if element values satisfies regex otherwise skipp the value
              // Qualifies the field value

              if (pageActions.actions[i].action.fieldsMapping[j].hasOwnProperty("filterByContent")) {
                // extractFilteredElementValue(element, actionPlaybookSnippet)

                tempVal = extractFilteredElementValue($, element, pageActions.actions[i].action.fieldsMapping[j]).trim();

              } else {

                tempVal = qualifyFieldValue($, element, pageActions.actions[i].action.fieldsMapping[j], false, debug);

              }



              // Check for a field transformation
              if (typeof pageActions.actions[i].action.fieldsMapping[j].transformation !== 'undefined' && pageActions.actions[i].action.fieldsMapping[j].transformation.enabled === true) {
                var rexData = pageActions.actions[i].action.fieldsMapping[j].transformation.find;
                var rexTransformation = new RegExp(rexData, "gmi");

                // Check if replace clause is present
                if (pageActions.actions[i].action.fieldsMapping[j].transformation.hasOwnProperty("replace")) {
                  tempVal = tempVal.replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[j].transformation.replace);
                } else {
                  var _tempVal = tempVal.match(rexTransformation);
                  if (_tempVal !== null) {
                    tempVal = _tempVal[0];
                  } else {
                  }
                }
              }

              // Check for  multiple transofrmations
              if (typeof pageActions.actions[i].action.fieldsMapping[j].transformations !== 'undefined') {
                for (var x = 0; x < pageActions.actions[i].action.fieldsMapping[j].transformations.length; x++) {
                  if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.enabled) {
                    var rexData = pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.find;
                    var rexTransformation = new RegExp(rexData, "gmi");

                    // Check if replace clause is present
                    if (pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.hasOwnProperty("replace")) {
                      tempVal = tempVal.replace(rexTransformation, pageActions.actions[i].action.fieldsMapping[j].transformations[x].transformation.replace);
                    } else {
                      var _tempVal = tempVal.match(rexTransformation);
                      if (_tempVal !== null) {
                        tempVal = _tempVal[0];
                      } else {
                      }
                    }
                  }

                }
              }

              // TODO: Check behavior on depth
              if (!pageActions.actions[i].action.fieldsMapping[j].hasOwnProperty("filterByContent")) {
                list.push(tempVal);
              } else {
                if (tempVal !== "") {
                  list.push(tempVal);
                }
              }
            });

            if (list.length === 0) {
              list[0] = ""
            }

            // TODO: Try to check consistency of data the arrays
            fields[pageActions.actions[i].action.fieldsMapping[j].fieldLabel] = list;


          }

        }
        // Build the html table

        var _numElements = fields[pageActions.actions[i].action.fieldsMapping[0].fieldLabel].length;
        // Check if there's a "getTopElements" value
        if (typeof pageActions.actions[i].action.getTopElements !== 'undefined' && parseInt(pageActions.actions[i].action.getTopElements) < fields[pageActions.actions[i].action.fieldsMapping[0].fieldLabel].length) {
          _numElements = parseInt(pageActions.actions[i].action.getTopElements);
        }

        for (var j = 0; j < _numElements; j++) {
          record = pageActions.actions[i].action.htmlOutput.recordTemplate;
          for (var t = 0; t < pageActions.actions[i].action.fieldsMapping.length; t++) {
            rex = new RegExp("{" + pageActions.actions[i].action.fieldsMapping[t].fieldLabel + "}", "gi");

            switch (pageActions.actions[i].action.fieldsMapping[t].fieldQualificator) {
              case "constant":
                record = record.replace(rex, fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][0]);
                break;

              case "hyperlink":
                if (fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j] === "") {
                  record = record.replace(rex, fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j]);
                } else {
                  record = record.replace(rex, "<a href=\"" + fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j] + "\">link</a>");
                }
                break;

              default:
                record = record.replace(rex, fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j]);
                break;
            }

            /*
            if (pageActions.actions[i].action.fieldsMapping[t].fieldQualificator === 'constant') {
              record = record.replace(rex, fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][0]);
            } else {
              record = record.replace(rex, fields[pageActions.actions[i].action.fieldsMapping[t].fieldLabel][j]);
            }
            */

          }
          tabledata = tabledata + record;
        }

        // Build output document
        tabledata = HtmlOutputHeader + tabledata + HtmlOutputFooter;


        // wrappingTag
        if (pageActions.actions[i].action.wrappingTag) {
          wrappingTagOpen = "<" + pageActions.actions[i].action.wrappingTag + ">";
          wrappingTagClose = "</" + pageActions.actions[i].action.wrappingTag + ">";
        }


        if (fields[pageActions.actions[i].action.fieldsMapping[0].fieldLabel].length > 0) {
          pageContent = HTML5_TEMPLATE;
          pageContent = pageContent.replaceAll("__CODE_FRAGMENT__", wrappingTagOpen + tabledata + wrappingTagClose);

          $ = cheerio.load(pageContent);
          // actionPlaybookPlayed = true
          pageActions.actions[i].action.result = 'OK';
        } else {
          pageActions.actions[i].action.result = 'FAILED';
        }

        execEnd = new Date();
        pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4));

        break;

      /*
       *
       * action name  : mergeHtmlElements
       * action family: content
       *
       */
      case "mergeHtmlElements":  // TODO: port this action in thre v0/navigate too

        var wrappingTagOpen = "";
        var wrappingTagClose = "";
        // Render the header with parameter replacement if any

        var $ = cheerio.load(pageContent);

        var tempVal;
        var tabledata = "";
        var record;
        var rex;
        var fields = new Object();


        // Step #1: Iterates on fields and assign JSON arrays to an associative array
        for (var j = 0; j < pageActions.actions[i].action.fields.length; j++) {

          var list = [];
          $(pageActions.actions[i].action.fields[j].sourceElementSelector).each(function (index, element) {

            var _transformOccurred = false;

            if (pageActions.actions[i].action.fields[j].sourceElementAttribute !== '@text') {
              // Get the speciified attribute value
              tempVal = $(element).attr(pageActions.actions[i].action.fields[j].sourceElementAttribute);
            } else {
              // Get the innertext of the element
              tempVal = $(element).text();
            }

            // Check for a field transformation
            if (typeof pageActions.actions[i].action.fields[j].transformation !== 'undefined' && pageActions.actions[i].action.fields[j].transformation.enabled === true) {
              var rexData = pageActions.actions[i].action.fields[j].transformation.find;
              var rexTransformation = new RegExp(rexData, "gmi");

              if (pageActions.actions[i].action.fields[j].transformation.hasOwnProperty("replace")) {
                tempVal = tempVal.replace(rexTransformation, pageActions.actions[i].action.fields[j].transformation.replace);
              } else {
                var _tempVal = tempVal.match(rexTransformation);
                if (_tempVal !== null) {
                  tempVal = _tempVal;
                }
              }
              list.push(tempVal);
              _transformOccurred = true;
            }

            // Check for transformations (supported since >= 0.3.5)
            if (pageActions.actions[i].action.fields[j].transformations) {
              for (var x = 0; x < pageActions.actions[i].action.fields[j].transformations.length; x++) {
                if (pageActions.actions[i].action.fields[j].transformations[x].transformation.enabled) {
                  // Check if a replace clause exists
                  if (pageActions.actions[i].action.fields[j].transformations[x].transformation.hasOwnProperty("replace")) {
                    tempVal = tempVal.replace(new RegExp(pageActions.actions[i].action.fields[j].transformations[x].transformation.find, "gmi"), pageActions.actions[i].action.fields[j].transformations[x].transformation.replace);
                  } else {
                    var _tempVal = tempVal.match(new RegExp(pageActions.actions[i].action.fields[j].transformations[x].transformation.find, "gmi"));
                    if (_tempVal !== null) {
                      tempVal = _tempVal[0];
                    }
                  }
                }
              }
              list.push(tempVal);
              _transformOccurred = true;
            }

            if (!_transformOccurred) {
              list.push(tempVal);
            }

          });

          fields[pageActions.actions[i].action.fields[j].fieldName] = list;

        }

        // Step #2: Build the new merged field array
        var mergedFields = [];
        for (var j = 0; j < fields[pageActions.actions[i].action.fields[0].fieldName].length; j++) {
          record = pageActions.actions[i].action.htmlOutput.recordTemplate;
          for (var t = 0; t < pageActions.actions[i].action.fields.length; t++) {
            rex = new RegExp("{" + pageActions.actions[i].action.fields[t].fieldName + "}", "gi");
            if (pageActions.actions[i].action.fields[t].fieldQualificator === 'constant') {
              record = record.replace(rex, fields[pageActions.actions[i].action.fields[t].fieldName][0]);
            } else {
              record = record.replace(rex, fields[pageActions.actions[i].action.fields[t].fieldName][j]);
            }
          }
          mergedFields.push(record);
        }

        // Step #3: Destination field replacement
        var mf_index = 0;
        $(pageActions.actions[i].action.htmlOutput.destinationElementSelector).each(function (index, element) {


          $(element).html(mergedFields[mf_index]);
          mf_index++;


        });


        pageContent = $.html();

        /* 
        $ = cheerio.load(pageContent);
        actionPlaybookPlayed = true
        */

        pageActions.actions[i].action.result = 'OK';

        execEnd = new Date();
        pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());

        if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4));

        break;

      /*
       *
       * action name  : extractFieldValue
       * action family: content
       *
       */
      case "extractFieldValue":

        var $ = cheerio.load(pageContent);
        var extractedFields = {};

        var extractedField;
        var element = $(pageActions.actions[i].action.selector);

        if (pageActions.actions[i].action.hasOwnProperty("sourceElementAttribute")) {
          if (pageActions.actions[i].action.sourceElementAttribute === '@text') {
            extractedField = element.text();
          } else {
            extractedField = element.attr(pageActions.actions[i].action.sourceElementAttribute);
          }
        } else {
          extractedField = element.text();
        }

        var _extractedFieldmpVal;
        // Transformation goes here
        if (typeof pageActions.actions[i].action.transformations !== 'undefined' && tempVal !== "") {
          for (var x = 0; x < pageActions.actions[i].action.transformations.length; x++) {
            if (pageActions.actions[i].action.transformations[x].transformation.enabled) {
              var rexData = pageActions.actions[i].action.transformations[x].transformation.find;
              var rexTransformation = new RegExp(rexData, "gmi");

              // Check if replace clause is present
              if (pageActions.actions[i].action.transformations[x].transformation.hasOwnProperty("replace")) {
                _extractedFieldmpVal = extractedField.replace(rexTransformation, pageActions.actions[i].action.transformations[x].transformation.replace);
              } else {
                _extractedFieldmpVal = extractedField.match(rexTransformation);
                if (_extractedFieldmpVal !== null) {
                  extractedField = _extractedFieldmpVal[0];
                } else {
                }
              }
            }

          }
        }



        if (typeof extractedField !== 'undefined') {
          extractedFields[pageActions.actions[i].action.fieldName] = extractedField.trim();
          pageActions.actions[i].action.result = 'OK';
          execEnd = new Date();
          pageActions.actions[i].action.executionTime = (execEnd.getTime() - execStart.getTime());
        } else {
          pageActions.actions[i].action.result = 'FAILED';

        }



        if (debug) console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))

        return extractedFields;

        break


      default:
        pageActions.actions[i].action.result = 'NOT APPLIED. Check action definition'

        if (debug)
          console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4))
        break

    }
    return pageContent;
  } catch (e) {
    pageActions.actions[i].action.result = 'FAILED';

    if (debug)
      console.log("DEBUG: Performing action " + pageActions.actions[i].action.type + ": " + JSON.stringify(pageActions.actions[i].action, null, 4));

    return pageContent;
  }
};

exports.formatOutputPage = function (pageContent, landingUrl, skipTidy) {

  pageContent = pageContent.replace("__WEBSITE__", "<a href=\"" + landingUrl + "\">" + landingUrl + "</a>");

  if (skipTidy) {
    return pageContent;
  } else {
    return (tidy(pageContent, { "indent-spaces": 4 }));
  }

};


/*
 * SERVICE FUNCTIONS
 */

/*
 *
 * Extracts the query string parameter value for a given url 
 * and a parameter name
 * 
 */
function getQueryStringParameterValue(url, parameterName) {

  try {

    if (url.trim().substring(0, 1) === "&") {
      url = url.replace(new RegExp("^\&", "gmi"), "http://www.dummy.com/action.do?");
    }

    if (url.trim().substring(0, 1) === "?") {
      url = "http://www.dummy.com/action.do" + url;
    }

    return urlParser.parse(url, true).query[parameterName]

  } catch (e) {

    return "[ERROR!]"

  }

}



/*
 *
 * Extracts a field value accordingly to the field mapping definition
 * consntantFieldGlobal specifies where to search for the element.
 * in case an itemSelector has been specified and the value is true
 * it looks for the value outside the document portion identified by the itemSelector.
 * It searches in whole page document
 * 
 */
function qualifyFieldValue($, element, ruleDescriptor, constantFieldGlobal, debug) {

  var _tempVal;

  switch (ruleDescriptor.fieldQualificator) {

    // This case has been introduced for backward compatibility, it will be removed in future versions
    case "string":

      if (debug)
        console.log("ACTIONPLAYBOOK DEPRECATION: fieldQualificator (string) has beed deprected, please use (text) instead");

      if (constantFieldGlobal) {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          if (ruleDescriptor.sourceElementSelector === "{$self}") {
            _tempVal = $(element).text();
          } else {
            _tempVal = $(ruleDescriptor.sourceElementSelector, element).text();
          }
        } else {
          if (ruleDescriptor.sourceElementAttribute === "@innerHtml") {
            _tempVal = $(ruleDescriptor.sourceElementSelector, element).html();
          } else {
            _tempVal = $(ruleDescriptor.sourceElementSelector, element).attr(ruleDescriptor.sourceElementAttribute);
          }
        }
      } else {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          _tempVal = $(element).text();
        } else {
          if (ruleDescriptor.sourceElementAttribute === "@innerHtml") {
            _tempVal = $(element).html();
          } else {
            _tempVal = $(element).attr(ruleDescriptor.sourceElementAttribute);
          }
        }

      }

      break;

    case "text":
      if (constantFieldGlobal) {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          if (ruleDescriptor.sourceElementSelector === "{$self}") {
            _tempVal = $(element).text();
          } else {
            _tempVal = $(ruleDescriptor.sourceElementSelector, element).text();
          }
        } else {
          if (ruleDescriptor.sourceElementAttribute === "@innerHtml") {
            _tempVal = $(ruleDescriptor.sourceElementSelector, element).html();
          } else {
            _tempVal = $(ruleDescriptor.sourceElementSelector, element).attr(ruleDescriptor.sourceElementAttribute);
          }
        }
      } else {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          _tempVal = $(element).text();
        } else {
          if (ruleDescriptor.sourceElementAttribute === "@innerHtml") {
            _tempVal = $(element).html();
          } else {
            _tempVal = $(element).attr(ruleDescriptor.sourceElementAttribute);
          }
        }

      }

      break;

    case "hyperlink":
      if (constantFieldGlobal) {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          _tempVal = $(ruleDescriptor.sourceElementSelector, element).text();
        } else {
          _tempVal = $(ruleDescriptor.sourceElementSelector, element).attr(ruleDescriptor.sourceElementAttribute);
        }


      } else {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          _tempVal = $(element).text();
        } else {
          _tempVal = $(element).attr(ruleDescriptor.sourceElementAttribute);
        }


      }
      if (ruleDescriptor.hasOwnProperty("extractQueryStringParameterValue")) {
        _tempVal = getQueryStringParameterValue(_tempVal, ruleDescriptor.extractQueryStringParameterValue);
      }
      break;

    case "constant":
      if (constantFieldGlobal) {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          _tempVal = $(ruleDescriptor.sourceElementSelector).text();
        } else {
          _tempVal = $(ruleDescriptor.sourceElementSelector).attr(ruleDescriptor.sourceElementAttribute);
        }

      } else {
        if (ruleDescriptor.sourceElementAttribute === "@text") {
          _tempVal = $(element).text();
        } else {
          _tempVal = $(ruleDescriptor.sourceElementSelector, element).attr(ruleDescriptor.sourceElementAttribute);
        }
      }
      break;

    // case "pdfcreationdate":
    //   if (constantFieldGlobal) {
    //     if (ruleDescriptor.sourceElementAttribute === "@text") {
    //       _tempVal = $(ruleDescriptor.sourceElementSelector).text();
    //     } else {
    //       _tempVal = $(ruleDescriptor.sourceElementSelector).attr(ruleDescriptor.sourceElementAttribute);
    //     }

    //   } else {
    //     if (ruleDescriptor.sourceElementAttribute === "@text") {
    //       _tempVal = $(element).text();
    //     } else {
    //       _tempVal = $(ruleDescriptor.sourceElementSelector, element).attr(ruleDescriptor.sourceElementAttribute);
    //     }
    //   }
    //   if (typeof _tempVal !== 'undeifned' || _tempVal !== "") {
    //     _tempVal = getPDFMetaDataFromUrl("https://teekayoffshore.com/" + _tempVal);

    //   }

    //   break;


    default:
      if (ruleDescriptor.sourceElementAttribute === "@text") {
        _tempVal = $(element).text();
      } else {
        _tempVal = $(ruleDescriptor.sourceElementSelector, element).attr(ruleDescriptor.sourceElementAttribute);
      }

      break;
  }

  if (typeof _tempVal === 'undefined' || _tempVal === null) {
    _tempVal = "";
  } else {
    if (ruleDescriptor.fieldQualificator === "text") _tempVal = _tempVal.trim();
  }

  return _tempVal;

}


/*
 *
 * Extracts a field value accordingly filter set to another element
 * This is currently supported in htmlElementsToField only and it is 
 * used on pages which has all th elements in a list without a clear
 * item structure
 * 
 */

function extractFilteredElementValue($, element, actionPlaybookSnippet) {

  var rx = new RegExp(actionPlaybookSnippet.filterByContent.contentRegex);

  if (actionPlaybookSnippet.filterByContent.filterElementAttribute === "@text") {


    if ($(element).find(actionPlaybookSnippet.filterByContent.filterElementSelector).text().match(rx)) {
      return extractFilteredOutputValue($(element).find(actionPlaybookSnippet.filterByContent.outputElementSelector), actionPlaybookSnippet);
    } else {
      return "";
    }

  } else {
    if ($(element).find(actionPlaybookSnippet.filterByContent.filterElementSelector).attr(actionPlaybookSnippet.filterByContent.filterElementAttribute).match(rx)) {
      return extractFilteredOutputValue($(element).find(actionPlaybookSnippet.filterByContent.outputElementSelector), actionPlaybookSnippet);
    } else {
      return "";
    }
  }

}

function extractFilteredOutputValue(filtereOutpueElement, actionPlaybookSnippet) {

  if (actionPlaybookSnippet.sourceElementAttribute === "@text") {
    return filtereOutpueElement.text();
  } else {
    return filtereOutpueElement.attr(actionPlaybookSnippet.sourceElementAttribute).text()
  }

}

// **************************************
// Public service functions
// **************************************


exports.replaceDynamicFieldsFromUrl = function (urlParams, strData) {

  var fields = Object.keys(urlParams.query);
  var newStrData = strData;

  fields.forEach(function (item, index) {
    if (typeof strData === 'string') {
      newStrData = newStrData.replaceAll("{" + item + "}", urlParams.query[item]);
    }

  });

  return newStrData;

}


exports.replaceDynamicHeadersFromUrl = function (urlParams, strData) {

  var fields = Object.keys(urlParams.query);
  var newStrData = strData;

  var keyLabels = Object.keys(strData);

  fields.forEach(function (item, index) {
    keyLabels.forEach(function (key, idx) {
      if (typeof newStrData[key] === 'string') {
        newStrData[key] = newStrData[key].replaceAll("{" + item + "}", urlParams.query[item]);;
      }
    });


  });

  return newStrData;

}

exports.parseDynamicParams = function (url, debug) {

  // Compatible date patterns: https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/

  var localUrl = url;
  var variables = url.match(/\{\{(.*?)\}\}/gm)

  if (variables) {

    variables.forEach(element => {

      var returnValue;
      var rValue;
      var fname = element.match(/{{.*\(/gm)[0].replace('{{', '').replace('(', '');




      switch (fname) {
        case 'f:now':
          var paramsString = element.match(/\(.*\)/gm)[0].replace('(', '').replace(')', '');

          var params = paramsString.split(',');

          params[0] = params[0].replace(/('|")/g, "");


          // Allow to specify an offset in terms of date time and set output format
          if (params.length == 3) {
            params[1] = params[1].replace(/'/g, "").trim();
            rValue = moment().add(parseInt(params[2]), params[1]);
            returnValue = rValue.format(params[0].toString());

            localUrl = localUrl.replace(element, returnValue);

          }

          // Set output format only
          if (params.length == 1) {
            returnValue = moment().format(params[0].toString());

            localUrl = localUrl.replace(element, returnValue);

          }

          if (debug) console.log("DEBUG: function: " + fname + " pattern: " + params[0] + " offset: " + params[1] + " unit: " + parseInt(params[2]));
          if (debug) console.log("DEBUG: new URL values is: " + returnValue);



          break;



        default:
          break;
      }
    });
  }
  return (localUrl);

}

// async function getPDFMetaDataFromUrl(url) {

//   var retrievalTask = PDFJS.getDocument(url);

//   retrievalTask.promise.then(async function (pdf) {

//       var pdfDoc = pdf;
//       pdfDoc.getMetadata().then(async function (stuff) {
//           /*
//           console.log("Raw metadata date is: " + stuff["info"]["CreationDate"]); // Metadata object here
//           console.log("Parsed date is: " + convertPDFDateTimeToISO(stuff["info"]["CreationDate"]));
//           */
//           return convertPDFDateTimeToISO(stuff["info"]["CreationDate"]);
//       }).catch(function (err) {
//           console.log('Error getting meta data');
//           console.log(err);
//       });

//       // Render the first page or whatever here
//       // More code . . . 
//   }).catch(function (err) {
//       console.log('Error getting PDF from ' + url);
//       console.log(err);
//   }, function (reason) {
//       // PDF loading error
//       console.error(reason);
//   });


// }

// function convertPDFDateTimeToISO(pdfDateTime) {

//   var rex = new RegExp("\[0-9]{8}", "gmi");
//   var _tempVal = pdfDateTime.match(rex);

//   if (typeof _tempVal !== 'undefined' || _tempVal !== "") {
//       return _tempVal[0].substring(0, 4) + "-" + _tempVal[0].substring(4, 6) + "-" + _tempVal[0].substring(6, 8);
//   } else {
//       return "";
//   }
// }