const util = require('util');
const fs = require('fs');
const path = require('path');

const glob = require('glob');

const fsReadFile = util.promisify(fs.readFile);
const pGlob = util.promisify(glob);

module.exports = (mainFilePath, tag, parser) => {
    const basename = path.basename(mainFilePath);
    const dirname = path.dirname(mainFilePath);
    const initContent = `${tag} ${basename}`;
    const initReadIncludesList = composePromiseList(initContent, tag, parser, dirname);
    const readAllIncludes = iterateAllIncludes(initReadIncludesList, tag, parser);
    return Promise.all(readAllIncludes)
        .then(result => {
            return composeCompleteDoc(result[0].file, result[0].includes);
        });
};

function composePromiseList(obj, tag, parser, dirname) {
    const promiseList = [];
    const diveInObject = (value, prop) => {
        if (value instanceof Object) {
            for (const [key, val] of Object.entries(value)) {
                diveInObject(val, [...prop, key]);
            }
        }
        if (typeof value === 'string' && value.startsWith(tag)) {
            const relPath = value.replace(tag, '').trim();
            const absPath = path.join(dirname, relPath);
            const objPromise = absPath => {
                return fsReadFile(absPath, 'utf8')
                    .then(fileContent => ({
                        content: parser.parse(fileContent),
                        basename: path.basename(absPath),
                        dirname: path.dirname(absPath),
                        prop
                    }));
            };
            const listPromise = absPath => {
                return pGlob(absPath, {})
                    .then(matchedPaths => {
                        const readMatchedFiles = matchedPaths.map(absPath => {
                            return fsReadFile(absPath, 'utf8')
                                .then(fileContent => parser.parse(fileContent));
                        });
                        return Promise.all(readMatchedFiles)
                            .then(fileContentList => ({
                                content: fileContentList,
                                basename: path.basename(absPath),
                                dirname: path.dirname(absPath),
                                prop 
                            }));
                    });
            };
            promiseList.push(
                glob.hasMagic(absPath) ?
                listPromise(absPath) :
                objPromise(absPath)
            );
        }
        return value;
    };
    diveInObject(obj, []);
    return promiseList;
}
function iterateAllIncludes(promiseList, tag, parser) {
    return promiseList.map(promise => {
        return promise.then(file => {
            const promiseList = composePromiseList(file.content, tag, parser, file.dirname);
            const readIncludes = iterateAllIncludes(promiseList, tag, parser);
            return Promise.all(readIncludes).then(includes => ({ file, includes }));
        });
    });
}
function composeCompleteDoc(file, includes) {
    return includes.reduce((content, { file, includes }) => {
        /* istanbul ignore else */
        if (file.prop.length > 0) {
            const lastProp = file.prop.pop();
            const parentRef = file.prop.reduce((value, key) => value[key], content);
            parentRef[lastProp] = composeCompleteDoc(file, includes);
        }
        return content;
    }, file.content);
}
