export const ErrorCodes:{[errorCode:number]:string} = Object.freeze({
	101:'You can`t use "alias" in icX',
	201:'"{0}" is not defined',
	202:'Invalid constant value',
	203:'Invalid constant value',
	204:'Identifier "{0}" has already been declared',
	205:'Variable "{0}" is not valid',
	401:"Infinity is used",
	402:"Division by zero",
	403:"Modulo by zero",
	501:"Other error in constant declaration",



	901:"Iternal constant use variable",
})
export default ErrorCodes