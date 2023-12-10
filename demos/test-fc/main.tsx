import { useState } from 'react';
import ReactDOM from 'react-dom/client';
function App() {
	const [a, setA] = useState(100);
	const [b, setB] = useState(600);
	console.log('render===============');
	const onClick = () => {
		debugger;
		setA('a');
		setB('b');
	};

	return (
		<ul onClick={onClick}>
			a:{a};b:{b}
		</ul>
	);
}
function Child() {
	return <span>big-react</span>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
