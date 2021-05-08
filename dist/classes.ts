import { StringDecoder } from "string_decoder"

export const vars: { count: number, aliases: { [id: string]: string }, setAlias: (v: string, a: string) => void, reset: () => void, get: () => string } = {
	count: 0,
	aliases: {},
	setAlias: function (v, a) {
		this.aliases[a] = v
		this.aliases[v] = a

	},
	get: function () {
		if (this.count == 16) {
			this.count++
		}
		if (this.count > 15) {
			throw 'not enough vars :('
		}
		return 'r' + this.count++
	},
	reset: function () {
		this.count = 0
		this.aliases = {}
	}
}
export const whiles: { count: number, reset: () => void, get: () => string } = {
	count: 0,
	reset: function () {
		this.count = 0
	},
	get: function () {
		return 'while' + this.count++
	}
}

export const ifs: { count: number, reset: () => void, get: () => string } = {
	count: 0,
	reset: function () {
		this.count = 0
	},
	get: function () {
		return 'if' + this.count++
	}
}

export const functions: { fn: string[], add: (str: string) => void, get: () => string } = {
	fn: [],
	add: function (str) {
		this.fn.push(str)
	},
	get: function () {
		return this.fn.join('\n')
	}
}

export class icXElem { //инструкция
	public originalPosition: number
	public originalText: string
	public scope: icXElem | null
	public command: { command: string, args: string[], empty: boolean } = { command: '', args: [], empty: true };
	public args: string = ""
	public rule: RegExpExecArray | null = null
	public re: RegExp[] = []

	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		this.scope = scope
		this.originalPosition = pos
		this.originalText = text
	}

	setCommand(e: { command: string, args: string[], empty: boolean }) {
		this.command = e
		if (!this.originalText) {
			this.originalText = this.command.command + ' ' + this.command.args.join(' ')
		}
		this.args = this.command.args.join(' ')
	}

	compile(): string | null {
		var re: RegExp
		var byDots = this.originalText.split('.')
		if (byDots.length > 1) {
			if (byDots[0].trim() in vars.aliases) {
				re = /\b([\w\d]+)\.([\w\d]+)\s{0,}(=)\s{0,}([\w\d]+)\b/i
				if (re.test(this.originalText)) {
					var a = re.exec(this.originalText)
					if (a == null) return null
					return `s ${a[1]} ${a[2]} ${a[4]}`
				}

			}
			re = /\b([\w\d]+)\s{0,}(=)\s{0,}([\w\d]+)\.([\w\d]+)\s{0,}$/i
			if (re.test(this.originalText)) {
				var a = re.exec(this.originalText)
				if (a == null) return null
				return `l ${a[1]} ${a[3]} ${a[4]}`
			}
			re = /\b([\w\d]+)\s{0,}(=)\s{0,}([\w\d]+)\.slot\(([\w\d]+)\).([\w\d]+)\b/i
			if (re.test(this.originalText)) {
				var a = re.exec(this.originalText)
				if (a == null) return null
				return `ls ${a[1]} ${a[3]} ${a[4]} ${a[5]}`
			}
			re = /\b([\w\d]+)\s{0,}(=)\s{0,}d\(([\w\d]+)\).([\w\d]+)\(([\w\d]+)\b/i
			if (re.test(this.originalText)) {
				var a = re.exec(this.originalText)
				if (a == null) return null
				return `lb ${a[1]} ${a[3]} ${a[4]} ${a[5]}`
			}
		}

		re = /\b([\.\d\w]+)\s{0,}(=)\s{0,}([\s\.\d\w]+?\b)/i
		if (re.test(this.originalText)) {
			var a = re.exec(this.originalText)
			if (a == null) return null
			return `move ${a[1]} ${a[3]}\n`
		}
		re = /\b([\w\d]+)?\(\)/i
		if (re.test(this.originalText)) {
			var a = re.exec(this.originalText)
			if (a == null) return null
			return `jal ${a[1]}\n`
		}

		return this.originalText
	}

	parseRules() {
		var re = /\b([\.\d\w]+)\s{0,}(<|==|>|<=|>=|\||!=|\&|\~\=)\s{0,}([\s\.\d\w]+?\b)(\,[\s\.\d\w]+){0,}/i
		if (re.test(this.args)) {
			this.rule = re.exec(this.args)
			if (this.rule == null) return null
			switch (this.rule[2]) {
				case '<':
					if (parseInt(this.rule[3]) === 0) {
						return `sltz icxTempVar ${this.rule[1]}`
					} else {
						return `slt icxTempVar ${this.rule[1]} ${this.rule[3]}`
					}
				case '==':
					if (parseInt(this.rule[3]) === 0) {
						return `seqz icxTempVar ${this.rule[1]}`
					} else {
						return `seq icxTempVar ${this.rule[1]} ${this.rule[3]}`
					}
				case '>':
					if (parseInt(this.rule[3]) === 0) {
						return `sgtz icxTempVar ${this.rule[1]}`
					} else {
						return `sgt icxTempVar ${this.rule[1]} ${this.rule[3]}`
					}
				case '<=':
					if (parseInt(this.rule[3]) === 0) {
						return `slez icxTempVar ${this.rule[1]}`
					} else {
						return `sle icxTempVar ${this.rule[1]} ${this.rule[3]}`
					}
				case '>=':
					if (parseInt(this.rule[3]) === 0) {
						return `sgez icxTempVar ${this.rule[1]}`
					} else {
						return `sge icxTempVar ${this.rule[1]} ${this.rule[3]}`
					}
				case '|':
					return `or icxTempVar ${this.rule[1]} ${this.rule[3]}`
				case '&':
					return `and icxTempVar ${this.rule[1]} ${this.rule[3]}`
				case '~=':
					if (parseInt(this.rule[3]) === 0) {
						return `sapz icxTempVar ${this.rule[1]} ${this.rule[4]}`
					} else {
						return `sap icxTempVar ${this.rule[1]} ${this.rule[3]} ${this.rule[4]}`
					}
				case '!=':
					if (parseInt(this.rule[3]) === 0) {
						return `snez icxTempVar ${this.rule[1]}`
					} else {
						return `sne icxTempVar ${this.rule[1]} ${this.rule[3]}`
					}
			}
		}

	}
}

export class icXBlock extends icXElem { //блок инструкций
	public end: number | undefined
	public start: number | undefined
	public content: { [id: number]: icXElem } = {};
	public endKeys: RegExp = /\bend\b/i

	addElem(e: icXElem) {
		this.content[e.originalPosition] = e
	}

	setStart(line: number) {
		this.start = line
		return this
	}

	setEnd(line: number) {
		this.end = line
		return this.scope
	}

	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)

	}

	compile() {
		const txt: string[] = []
		for (const contentKey in this.content) {
			const text = this.content[contentKey].compile()
			if (text !== null)
				txt.push(text)
		}
		return txt.join("\n") + "\n"
	}
}

export class icXFunction extends icXBlock {
	public name: string | null = null
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\bfunction\b/i)
		this.re.push(/\bdef\b/i)
	}

	setCommand(e: { command: string, args: string[], empty: boolean }) {
		super.setCommand(e)
		this.name = e.args[0]
	}

	compile() {
		var txt = `${this.name}:\n`
		txt += super.compile()
		txt += 'j ra\n'

		functions.add(txt)
		return ''
	}
}

export class icXIf extends icXBlock {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\bif\b/i)

	}

	compile() {
		var isElse = false
		var r = this.parseRules()
		var l = ifs.get()
		var txt = []
		var _txt = []
		for (const contentKey in this.content) {
			if (this.content[contentKey].originalText.trim().toLowerCase() == 'else') {
				_txt.push(`j ${l}exit`)
				_txt.push(`${l}else:`)
				isElse = true
			} else {
				_txt.push(this.content[contentKey].compile())
			}
		}
		txt.push(r)
		if (!isElse) {
			txt.push(`beqz icxTempVar ${l}exit`)
			txt.push(`beq icxTempVar 1 ${l}`)
		} else {
			txt.push(`beqz icxTempVar ${l}else`)
			txt.push(`beq icxTempVar 1 ${l}`)
		}
		txt.push(`${l}:`)
		txt.push(_txt.join('\n'))
		txt.push(`${l}exit:`)
		return txt.join('\n') + '\n'
	}
}

export class icXWhile extends icXBlock {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\bfor\b/i)
		this.re.push(/\bwhile\b/i)
	}

	compile() {


		var r = this.parseRules()
		var l = whiles.get()
		var txt = []
		txt.push(`${l}:`)
		txt.push(r)
		txt.push(`beqz icxTempVar ${l}exit`)
		txt.push(super.compile())
		txt.push(`j ${l}`)
		txt.push(`${l}exit:`)
		return txt.join('\n') + '\n'
	}
}

export class icXVar extends icXElem {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\bvar\b/i)
		
	}

	compile() {
		var txt = ''
		var v = vars.get()
		if (0 in this.command.args) {
			var a = this.command.args[0]
			vars.setAlias(v, a)
			txt += `alias ${a} ${v}\n`
		}
		var b = this.originalText.split('=')
		if (1 in b) {
			txt += `move ${v} ${b[1].trim()}\n`
		}
		return txt
	}
}

export class icXConst extends icXElem {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\bconst\b/i)
	}

	compile() {
		var txt = ''
		if (this.command.args.length >= 2) {
			var a = this.command.args.join('')
			var b = a.split('=')
			b[0] = b[0].trim()
			vars.setAlias(b[0], b[0])
			txt += `define ${b[0]} ${b[1]}\n`
		}
		return txt
	}
}

export class icXIncrement extends icXElem {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\b(\S+\b)\+\+/i)
	}

	compile() {
		var a = /\b(\S+\b)\+\+/i.exec(this.originalText)
		if (a !== null)
			var txt = `add ${a[1]} ${a[1]} 1\n`
		else return null
		return txt
	}
}

export class icXAlias extends icXElem {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\balias\b/i)
	}

	compile() {
		vars.setAlias(this.command.args[0], this.command.args[1])
		return super.compile()
	}
}

export class icXLog extends icXElem {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\blog\b/i)
	}

	compile() {
		return `#log ${this.args}`
	}
}

export class icXLog2 extends icXElem {
	constructor(scope: icXElem | null, pos: number = 0, text: string = "") {
		super(scope, pos, text)
		this.re.push(/\blog2\b/i)
	}

	compile() {
		return `#log2 ${this.args}`
	}
}
