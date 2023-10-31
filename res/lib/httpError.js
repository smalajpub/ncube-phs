module.exports = {

    http: class httpError {
        constructor(errorCode, errorMessage) {
            this.statusCode = errorCode;
            this.statusMessage = errorMessage.toString();
        }
    }

}