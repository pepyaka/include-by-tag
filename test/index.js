const util = require('util');
const fs= require('fs');

const t = require('tap');

const IBT = require('..');

const fsReadFile = util.promisify(fs.readFile);

const ibt = new IBT();

// Test defaults
t.equal(ibt.tag, '!include');
t.equal(ibt.parser.parse, JSON.parse);

t.test('Read comprehensive file', t => {
    return Promise.all([
        ibt.read('./test/data/conf/main.json'),
        fsReadFile('./test/data/conf.json', 'utf8')
            .then(JSON.parse)
    ]).then(([withIncludes, comprehensive]) =>  {
        //console.dir(withIncludes);
        //console.dir(comprehensive);
        return t.test('Compare comprehensive and withIncludes', t => {
            t.same(withIncludes, comprehensive);
            t.end();
        });
    });
}).catch(t.threw);
