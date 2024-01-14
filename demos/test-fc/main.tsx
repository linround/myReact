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

import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
function App() {
	const [num, update] = useState(100);
	return (
		<ul onClick={() => update(50)}>
			{new Array(num).fill(0).map((_, i) => {
				return <Child key={i}>{i}</Child>;
			})}
		</ul>
	);
}

function Child({ children }) {
	const now = performance.now();
	while (performance.now() - now < 4) {}
	return <li>{children}</li>;
}
const root = ReactDOM.createRoot(document.querySelector('#root'));
root.render(<App />);
