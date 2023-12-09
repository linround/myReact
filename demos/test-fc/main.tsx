import { useState } from 'react';
import ReactDOM from 'react-dom/client';
function App() {
	const [num, setNum] = useState(100);
	const [b] = useState(1111);
	window.setNum = setNum;
	const arr =
		num % 2 === 0
			? [<li key={1}>1</li>, <li key={2}>2</li>, <li key={3}>3</li>]
			: [<li key={3}>3</li>, <li key={2}>2</li>, <li key={1}>1</li>];
	return <ul onClick={() => setNum(num + 1)}>{arr}</ul>;
}
function Child() {
	return <span>big-react</span>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
