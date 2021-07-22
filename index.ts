import * as classes from "./src/classes"
import {icXElem} from "./src/classes"
import {functions, ifs, use, vars, varsClass, whiles} from "./src/lists"
import modules from "./src/modules"
import {Err} from "./src/err";

export const regexes = {
	'rr1': new RegExp("[rd]{1,}(r(0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|a))$"),
	'r1': new RegExp("^r(0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|a)$"),
	'd1': new RegExp("^d(0|1|2|3|4|5|b)$"),
	'rr': new RegExp("^d(0|1|2|3|4|5|b)$"),
	'strStart': new RegExp("^\".+$"),
	'strEnd': new RegExp(".+\"$"),
}

export class icX {
	public text: string
	public keyFirstWord: { class: string, re: RegExp }[] = []
	public lines: string[] | undefined
	public position: number = 0;
	public commands: { command: string, args: string[], empty: boolean }[] = [];
	public structure: classes.icXBlock | null = null
	public currentBlock: classes.icXBlock | null = null
	public operators: { [id: string]: icXElem } = {}
	private icxOptions: { [p: string]: boolean } | null;

	constructor(text: string, icxOptions: { [key: string]: boolean } | null = null) {
		this.icxOptions = icxOptions
		for (const key in classes) {
			try {
				if (Object.prototype.hasOwnProperty.call(classes, key)) {
					// @ts-ignore
					const element: classes.icXElem = classes[key]
					try {
						// @ts-ignore
						var x = new element
						if (x instanceof classes.icXElem) {
							x.re.forEach(re => {
								this.keyFirstWord.push({class: key, re})
								// @ts-ignore
								this.operators[key] = classes[key]
							})
						}
					} catch {
					}
				}
			} catch {
			}
		}
		for (const key in modules) {
			try {
				if (Object.prototype.hasOwnProperty.call(modules, key)) {
					// @ts-ignore
					const element: classes.icXElem = modules[key]
					try {
						// @ts-ignore
						var x = new element
						if (x instanceof classes.icXElem) {
							x.re.forEach(re => {
								this.keyFirstWord.push({class: key, re})
								// @ts-ignore
								this.operators[key] = modules[key]
							})
						}
					} catch {
					}
				}
			} catch {
			}
		}
		vars.reset()
		this.position = 0
		this.text = text
		// this.text = 'var _r0 = 0\n' + text
		this.init(this.text)
	}

	init(text: string) {
		this.lines = text.split(/\r?\n/)
		var commands: { command: string, args: string[], empty: boolean }[] = this.lines
			.map((line) => {
				const args: Array<string> = line.trim().split(/\s+/)
				const command = args.shift() ?? ""
				const empty = !command
				return {command, args, empty}
			})
		commands.forEach(command => {
			var newArgs: any = {}
			var mode = 0
			var argNumber: number = 0
			command.args.forEach(arg => {
				if (arg.startsWith("#")) {
					return
				}
				if (mode === 0) {
					argNumber++
				}
				if (regexes.strStart.test(arg)) {
					mode = 1
				}
				if (argNumber in newArgs) {
					newArgs[argNumber] += ' ' + arg
				} else {
					newArgs[argNumber] = arg
				}
				if (regexes.strEnd.test(arg)) {
					mode = 0
				}
				command.args = Object.values(newArgs)
			})
		})
		this.commands = commands
		this.position = 0
		var blockLvl = 0
		var startBlock = {}
		this.structure = new classes.icXBlock(null, 0, this.text)
		this.currentBlock = this.structure
		for (let position: number = 0; position < this.lines.length; position++) {
			if (this.commands.hasOwnProperty(position) && this.commands[position].empty == false) {
				var line = this.lines[position]
				var c = this.commands[position]
				var r = ''

				for (const keyFirstWordKey in this.keyFirstWord) {
					var key = this.keyFirstWord[keyFirstWordKey]
					if (key.re.test(line)) {
						r = key.class
					}
				}
				if (r) {
					try {
						//@ts-ignore
						var a = new this.operators[r](this.currentBlock, position, line)
						a.setCommand(c)
						a.originalPosition = position
						this.currentBlock.addElem(a)
						if (a instanceof classes.icXBlock) {
							this.currentBlock = a.setStart(a.originalPosition + 1)
						}
					} catch {
					}
				} else {
					if (this.currentBlock.endKeys.test(line)) {
						var block = this.currentBlock.setEnd(position - 1)
						if (block instanceof classes.icXBlock) {
							this.currentBlock = block
						}
					} else {
						var elem = new classes.icXElem(this.currentBlock, position, line)
						elem.setCommand(c)
						this.currentBlock.addElem(elem)
					}
				}
			}
		}
	}

	getCompiled(): string {
		vars.reset()
		ifs.reset()
		whiles.reset()
		functions.reset()
		use.reset()
		if (this.icxOptions) {
			for (const key in this.icxOptions) {
				if (this.icxOptions.hasOwnProperty(key) && this.icxOptions[key]) {
					use.add(key)
				}
			}
		}
		try {
			const code = (this.structure?.compile() ?? "") + "\n"
			var txt = "# ---icX User code start---\n"
			if (use.has("aliases")) {
				txt += vars.getAliases()
			}
			txt += code
			txt += "# ---icX User code end---\n"
			if (functions.fn.length != 0) {
				if (!use.has("loop")) {
					var a = functions.get()
					var t = a.split("\n").length
					txt += `jr ${t}\n`
					txt += a
				} else {
					txt += "j 0\n"
					txt += functions.get()
				}
			}else{
				if (use.has("loop")) {
					txt += "j 0\n"
				}
			}
			txt = txt
				.split("\n")
				.map((str) => {
					return str.trim()
				}).filter((str) => {
					if (!use.has("comments") && str.startsWith("#")) return false
					else return str !== ""
				}).join('\n')
			return txt
		} catch (e) {
			throw e
		}

	}

	alalize(): {
		vars: varsClass
		ifs: { count: number; reset: () => void; get: () => string }
		whiles: { count: number; reset: () => void; get: () => string }
		functions: { fn: string[]; add: (str: string) => void; get: () => string; reset: () => void }
		use: { arg: string[]; add: (...str: string[]) => void; has: (str: string) => boolean; reset: () => void }
		error: Err | null
		result: string | null
	} {
		vars.reset()
		ifs.reset()
		whiles.reset()
		functions.reset()
		use.reset()
		if (this.icxOptions) {
			for (const key in this.icxOptions) {
				if (this.icxOptions.hasOwnProperty(key) && this.icxOptions[key]) {
					use.add(key)
				}
			}
		}
		var error = null
		var result = null
		try {
			const code = (this.structure?.compile() ?? "") + "\n"
			var txt = "# ---icX User code start---\n"
			txt += code
			txt += "# ---icX User code end---\n"
			if (functions.fn.length != 0) {
				if (!use.has("loop")) {
					var a = functions.get()
					var t = a.split("\n").length
					txt += `jr ${t}\n`
					txt += a
				} else {
					txt += "j 0\n"
					txt += functions.get()
				}
			}else{
				if (use.has("loop")) {
					txt += "j 0\n"
				}
			}
			txt = txt
				.split("\n")
				.map((str) => {
					return str.trim()
				}).filter((str) => {
					if (!use.has("comments") && str.startsWith("#")) return false
					else return str !== ""
				}).join('\n')
			result = txt
		} catch (e) {
			error = e
		}

		return {
			vars: vars,
			ifs: ifs,
			whiles: whiles,
			functions: functions,
			use: use,
			error: error,
			result: result,
		}
	}

}