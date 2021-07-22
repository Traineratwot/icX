import fs from "fs";
import {icX} from "../index";

export class ResultContainer {
    name: string
    result: boolean
    current?: string
    expected?: string

    constructor(name: string, result: boolean, current?: string, expected?: string) {
        this.name = name;
        this.result = result;
        this.current = current;
        this.expected = expected;
    }

}

export abstract class TestContainer {
    public abstract readonly icXName: string
    public skip?: boolean

    public test(): ResultContainer {
        if (!this.skip) {
            console.log("\x1b[36m", `Test [${this.icXName}] is start...`)
            var text = fs.readFileSync(`./tests/files/${this.icXName}.icX`, 'utf8');
            return this.run(text)
        }
        console.log("\x1b[36m", `Test [${this.icXName}] was skipped`)
        return new ResultContainer(this.icXName, true)
    }

    protected abstract run(code: string): ResultContainer;
}

export class CompileExpectedTest extends TestContainer {
    public icXName: string;
    private readonly testFolderPath: string = './tests/files';
    private readonly compileFolderPath: string = `${this.testFolderPath}/compile`;
    private readonly ic10Expected: string;

    constructor(icXName: string, ic10Expected: string, skip?: boolean) {
        super();
        this.icXName = icXName;
        this.ic10Expected = ic10Expected;
        this.skip = skip === undefined ? true : skip;
    }

    run(code: string): ResultContainer {
        var a = new icX(code)
        var r = {}
        for (const key in a?.structure?.content) {
            if (Object.prototype.hasOwnProperty.call(a?.structure?.content, key)) {
                // @ts-ignore
                const element = a?.structure?.content[key];
                // @ts-ignore
                r[key] = element.constructor.name;
            }
        }
        var b: string | boolean = a.getCompiled()
        if (b) {
            let current = String(b);
            if (!fs.existsSync(this.compileFolderPath)){
                fs.mkdirSync(this.compileFolderPath);
            }
            fs.writeFileSync(`${this.compileFolderPath}/_${this.icXName}.ic10`, String(b));
            let expected = String(
                fs.readFileSync(`${this.testFolderPath}/${this.ic10Expected}.ic10`, 'utf8').replace(/\r/g, ''));
            return new ResultContainer(this.icXName, current === expected, current, expected)
        } else {
            return new ResultContainer(this.icXName, false, String(b))
        }
    }

}