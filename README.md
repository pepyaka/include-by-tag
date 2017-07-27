# Include by tag
Library to include a file(s) within another file. It will **not** work on
circular imports due to recursive strategy.

For example we have some configuration hierarchy of JSON configuration files:
```
config
├── main.json
├── entries.json
├── colors.json
└── templates
    ├── number.json
    ├── string.json
    └── boolean.json
```
With content

main.json
```json
{
    "name": "ibt",
    "date": "2000-01-01T00:00+02:00",
    "entries": "!include entries.json",
    "templates": "!include templates/*.json"
}
```
entries.json
```json
{
    "actions": [ "To be", "Not to be" ],
    "colors": "!include colors.json"
}
```
colors.json
```json
[
    { "name": "black", "type": "boolean" },
    { "name": "white", "type": "boolean" },
    { "name": "red", "type": "number" },
    { "name": "blue", "type": "string" },
    { "name": "green", "type": "string" }
]
```
number.json
```json
{
    "name": "number",
    "prop": "Final countdown"
}
```
string.json
```json
{
    "name": "string",
    "prop": "A word is enough to the wise"
}
```
boolean.json
```json
{
    "name": "boolean",
    "prop": "Bisected world"
}
```

And if we will reading main.json config we can asynchronously read included
files:
```
main.json ->| entries.json ->| colors.json ->|
            |         number.json          ->|
            |         string.json          ->|
            |         boolean.json         ->|
-------------------------------------------->| Full config
```

Final JSON will look like:
```json
{
    "name": "ibt",
    "date": "2000-01-01T00:00+02:00",
    "entries": {
        "actions": [ "To be", "Not to be" ],
        "colors": [
            { "name": "black", "type": "boolean" },
            { "name": "white", "type": "boolean" },
            { "name": "red", "type": "number" },
            { "name": "blue", "type": "string" },
            { "name": "green", "type": "string" }
        ]
    },
    "templates": [
        { "name": "number", "prop": "Final countdown" },
        { "name": "string", "prop": "A word is enough to the wise" },
        { "name": "boolean", "prop": "Bisected world" }
    ]
}
```
## Usage

```javascript
const IBT = require('include-by-tag');

const options = {
    parser: JSON.parser,
    includeTag: '!include'
};

const ibt = new IBT(options);

ibt.read('/etc/superapp/config.json', '/usr/lib/superapp/config.json')
    .then(config => {
        console.log(config);
    });
```
Include string recognize [globs](https://www.npmjs.com/package/glob). All globs interpreted like array. So value `!inlude tests/*.json` and file `test/first.json` with content `{ "first": "test" }` will be recognized as
```json
{
  "tests": [{ "first": "test" }]
}
```
## API

#### new IBT(options);
##### Options
- `parser` *(Object, default: `JSON`)*: Any object that has `.parse` method. It
  must return parsed Object. For example, to use YAML parser options must look
  like `{ parser: { parse: require('js-yaml').safeLoad }}`
- `includeTag` *(String, default: `!include`)*: Tag for include. Filepath
  followed by tag, ex. `!include ext/file.json`

#### Methods
##### ibt.read(filepath, [...filepath])
read() is a primary method to read file includes. If method call with multiple
filepaths, it will be merged after full files reading and composing like `Object.assign(parsedFile0, parsedFile1,
...)`.
Method return promise, with object as argument.
