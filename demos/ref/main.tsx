import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
function App() {
	const [isDel, del] = useState(false);
	const divRef = useRef(null);
	console.warn('render divRef', divRef.current);
	useEffect(() => {
		console.warn('useEffect divRef', divRef.current);
	}, []);
	return (
		<div ref={divRef} onClick={() => del(true)}>
			{isDel ? null : <Child />}
		</div>
	);
}

function Child() {
	const now = performance.now();
	while (performance.now() - now < 4) {}
	return <p ref={(dom) => console.warn('dom is', dom)}>Child</p>;
}
const root = ReactDOM.createRoot(document.querySelector('#root'));
root.render(<App />);
