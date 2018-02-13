const util = require('util');
const fs= require('fs');

const t = require('tap');
const yaml = require('js-yaml');

const IBT = require('..');

const fsReadFile = util.promisify(fs.readFile);

const ibt = new IBT();

// Test defaults
t.equal(ibt.tag, '!include');
t.equal(ibt.parser.parse, JSON.parse);

t.test('Read comprehensive file', t => {
    return Promise.all([
        ibt.read('./test/data/partial/rybz-nyjw.json'),
        fsReadFile('./test/data/complete/rybz-nyjw.json', 'utf8')
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

// Test with another parser
ibt.parser = { parse: yaml.safeLoad };
t.test('Read YAML file', t => {
    return Promise.all([
        ibt.read('./test/data/partial/rybz-nyjw.yml'),
        fsReadFile('./test/data/complete/rybz-nyjw.yml', 'utf8')
            .then(yaml.safeLoad)
    ]).then(([withIncludes, comprehensive]) =>  {
        return t.test('Compare complete and partial', t => {
            t.same(withIncludes, comprehensive);
            t.end();
        });
    });
}).catch(t.threw);
