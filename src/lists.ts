import {Err} from "./err"

export class variable {
	temp: boolean
	to: string
	from: string
	ready: boolean    = true
	constant: boolean = false

	constructor(from: string, to: string, temp = false, constant = false) {
		this.temp     = temp
		this.to       = to
		this.from     = from
		this.constant = constant
	}

	release() {
		this.ready = true
		return this
	}

	get() {
		this.ready = false
		return this
	}

	toString(n: boolean = true) {
		if (this.constant) {
			if (use.has('constants')) {
				return this.from
			} else {
				return this.to
			}
		}
		if (use.has("aliases") && this.temp === false && n) return this.from
		else return this.to
	}
}

export class devices extends variable {
	constructor(from: string, to: string, temp = false, constant = false) {
		super(from, to, temp, constant)
		this.temp     = false
		this.to       = to
		this.from     = from
		this.constant = true
	}

	get() {
		this.ready = true
		return this
	}
}

export class varsClass {
	aliases: variable[] = []
	temps: variable[]   = []
	empty: string[]     = []

	constructor() {
		this.reset()
	}

	reset() {
		this.temps   = []
		this.aliases = []
		this.empty   = []
		for (let i = 0; i <= 15; i++) {
			this.empty.push("r" + i)
		}
		this.aliases.push(new variable('sp', 'r16'))
		this.aliases.push(new variable('ra', 'r17'))
	}

	set(from: string, temp = false) {
		var result
		if (!/^[a-zA-Z_]\w*/.test(from))
			//TODO             ↓
			throw new Err(205, 0, from)
		if (this.exists(from))
			//TODO             ↓
			throw new Err(204, 0, from)
		else
			result = new variable(from, this.empty.shift() ?? "null", temp)
		this.aliases.push(result)
		return result
	}

	setDevice(from: string, to: string) {
		var result = new devices(from, to, false)
		this.aliases.push(result)
		return result
	}

	setCustom(from: string, to: number | string, temp = false, constant = false) {
		var result
		if (!/^[a-zA-Z_]\w*/.test(from))
			//TODO             ↓
			throw new Err(205, 0, from)
		if (this.exists(from))
			//TODO             ↓
			throw new Err(204, 0, from)
		else
			result = new variable(from, String(to), temp, constant)
		this.aliases.push(result)
		return result
	}

	exists(from: string) {
		var found = false
		this.aliases.forEach((variable) => {
			if (from === variable.from)
				found = true
		})
		return found
	}

	find(from: string): false | variable {
		var found: boolean | variable = false
		this.aliases.forEach((variable) => {
			if (from === variable.from)
				found = variable
		})
		return found
	}

	get(from: string | variable, n: boolean = true): string {
		if (from instanceof variable) return from.toString()
		var re = /d\[(\w+)\]/
		if (re.test(from)) {
			var a = re.exec(from)
			if (a != null) {
				return 'd' + this.get(a[1], false)
			}
		}
		const find = this.find(from)
		if (find === false) return from
		return find.toString(n)
	}

	getTemp() {
		var found: undefined | variable
		this.temps.forEach(function (variable) {
			if (variable.ready) {
				found = variable
			}
		})
		if (found === undefined) return this.newTemp().get()
		return found.get()

	}

	newTemp() {
		const newTemp = new variable("", this.empty.pop() ?? "null", true)
		this.temps.unshift(newTemp)
		// console.log('46846514567432157984+98', this.temps)
		return newTemp
	}

	getAliases() {
		var txt = ''
		for (const aliasesKey in this.aliases) {
			if (this.aliases[aliasesKey].temp == false && this.aliases[aliasesKey].constant == false) {
				if (this.aliases[aliasesKey].from == 'sp' || this.aliases[aliasesKey].from == 'ra') {
					continue
				}
				txt += `alias ${this.aliases[aliasesKey].from} ${this.aliases[aliasesKey].to}\n`
			}
		}
		return txt
	}
}

const vars = new varsClass
export {vars}
export const whiles: { count: number; reset: () => void; get: () => string }                                              = {
	count: 0,
	reset: function () {
		this.count = 0
	},
	get  : function () {
		return 'while' + this.count++
	}
}
export const ifs: { count: number; reset: () => void; get: () => string }                                                 = {
	count: 0,
	reset: function () {
		this.count = 0
	},
	get  : function () {
		return 'if' + this.count++
	}

}
export const functions: { fn: string[]; add: (str: string) => void; get: () => string; reset: () => void }                = {
	fn   : [],
	add  : function (str) {
		this.fn.push(str)
	},
	get  : function () {
		return this.fn.join('\n')
	},
	reset: function () {
		this.fn = []
	}
}
export const use: { arg: Set<string>; add: (...str: string[]) => void; has: (str: string) => boolean; reset: () => void } = {
	arg  : new Set(),
	add  : function (str) {
		this.arg.add(str)
	},
	has  : function (str) {
		if (this.arg.has(str) === false)
			return false
		else
			return true
	},
	reset: function () {
		this.arg = new Set()
	}
}
