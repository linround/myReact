import { ReactContext } from 'shared/ReactSymbols';

let preContextValue: any = null;
const preContextValueStack: any[] = [];
function pushProvider<T>(context: ReactContext<T>, newValue: T) {
	preContextValueStack.push(preContextValue); // [1]
	preContextValue = context._currentValue; // 2
	context._currentValue = newValue; // 3
}

// 这里 push 一个 preContextValue
// 再该变 preContextValue
// 为 _currentValue 赋新值 preContextValue

// _currentValue 又被赋值为上一次的
function popProvider<T>(context: ReactContext<T>) {
	// 2
	context._currentValue = preContextValue; /*上一个 context._currentValue*/
	preContextValue = preContextValueStack.pop(); //1
}
