import { useState } from 'react';
import ReactDOM from 'react-dom/client';
function App() {
	const [a, setA] = useState(100);
	const [b, setB] = useState(600);
	console.log('render===============');
	const onClick = () => {
		setA((a) => a + 1);
		setA((a) => a + 1);
		setA((a) => a + 1);
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
