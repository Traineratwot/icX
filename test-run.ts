import {Err, Errors} from "./src/err";
import {CompileExpectedTest, ResultContainer} from "./tests/tests";

const testCases = [
    {icX: '_', ic10: '_', skip: false},
    {icX: 'useCommentsTrue', ic10: 'useCommentsTrue', skip: false},
    {icX: 'useCommentsFalse', ic10: 'useCommentsFalse', skip: false},
    {icX: 'example', ic10: 'example', skip: false},
    {icX: 'devices', ic10: 'devices', skip: false}
]

let getLog = (result: boolean, name: string, current?: string, expected?: string) => {
    let text: string = result ? `Test passed: [${name}]` : `Test failed: [${name}]`;
    if (current) {
        text += `\nCurrent result:\n${current}`
            .split("\n")
            .map((str) => {
                return `\t${str}`
            }).join("\n")
    }
    if (expected) {
        text += `\n\nExpected result:\n${expected}`
            .split("\n")
            .map((str) => {
                return `\t${str}`
            }).join("\n")
    }
    return text
}

try {
    testCases.forEach(function (testCase) {
        let tr: ResultContainer = new CompileExpectedTest(testCase.icX, testCase.ic10, testCase.skip).test();
        let text = tr.result
            ? {color: '\x1b[32m', text: getLog(tr.result, tr.name)}
            : {color: '\x1b[31m', text: getLog(tr.result, tr.name, tr.current, tr.expected)}
        if (testCase.skip !== undefined && !testCase.skip) {
            console.log(text.color, text.text);
        }
    });
} catch (e: Err | Errors | any) {
    console.log("\x1b[31m","")
    if (e instanceof Err || e instanceof Errors) {
        console.error(e.getUserMessage())
    } else {
        console.error(e)
    }
}

