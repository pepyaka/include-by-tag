const path = require('path');

const readIncludes = require('./lib/read');

const defaultIncludeTag = '!include';

class IBT {
    constructor({ parser, includeTag } = {}) {
        this.tag = includeTag || defaultIncludeTag;
        this.parser = parser || { parse: JSON.parse };
    }
    read(...mainFilePath) {
        const tag = this.tag;
        const parser = this.parser;
        const mainFilePathList = [].concat(...mainFilePath);
        const readMainFileList = mainFilePathList.map(mainFilePath => {
            const absMainFilePath = path.resolve(mainFilePath);
            //return mainFunction(absMainFilePath, tag, parser);
            return readIncludes(absMainFilePath, tag, parser);
        });
        return Promise.all(readMainFileList)
            .then(mainFileList => Object.assign({}, ...mainFileList))
            .catch(console.error);
    }
}
module.exports = IBT;
