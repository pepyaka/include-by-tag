const util = require('util');
const fs= require('fs');

const t = require('tap');

const IBT = require('..');

const fsReadFile = util.promisify(fs.readFile);

const readAndParseOrig = fsReadFile('./test/data/nodejs-api-docs.json', 'utf8').then(JSON.parse);
const ibt = new IBT();
t.test('Read original and with includes files', t => {
    return Promise.all([
        ibt.read('./test/data/nodejs-api-docs/index.json'),
        readAndParseOrig
    ]).then(([withIncludes, comprehensive]) =>  {
        return t.test('Compare comprehensive and withIncludes', t => {
            t.same(withIncludes, comprehensive);
            t.end();
        });
    });
}).catch(t.threw);
