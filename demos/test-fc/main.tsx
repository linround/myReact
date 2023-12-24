// import { useState, useEffect } from 'react';
// import ReactDOM from 'react-dom/client';
import { windows } from 'rimraf';
// function App() {
// 	const [num, updateNum] = useState(0);
// 	useEffect(() => {
// 		console.log('App mount');
// 	}, []);
//
// 	useEffect(() => {
// 		console.log('num change create', num);
// 		return () => {
// 			console.log('num change destroy', num);
// 		};
// 	}, [num]);
//
// 	return (
// 		<div onClick={() => updateNum(num + 1)}>
// 			{num === 0 ? <Child /> : 'noop'}
// 		</div>
// 	);
// }
//
// function Child() {
// 	useEffect(() => {
// 		console.log('Child mount');
// 		return () => console.log('Child unmount');
// 	}, []);
//
// 	return 'i am child';
// }

import ReactDOM from 'react-noop-renderer';
function App() {
	return (
		<div>
			<Child />
			<div>hello world</div>
		</div>
	);
}

function Child() {
	return 'Child';
}
const root = ReactDOM.createRoot();
root.render(<App />);
window.root = root;
