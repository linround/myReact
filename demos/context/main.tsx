import ReactDOM from 'react-dom/client';
import { useState, useEffect, useRef, useContext, createContext } from 'react';

const ctxA = createContext(null);
const ctxB = createContext(undefined);
function App() {
	return (
		<ctxA.Provider value={'A0'}>
			<ctxB.Provider value={'B0'}>
				<Cpn />
				<ctxA.Provider value={'A1'}>
					<Cpn />
				</ctxA.Provider>
			</ctxB.Provider>
		</ctxA.Provider>
	);
}

function Cpn() {
	const a = useContext(ctxA);
	const b = useContext(ctxB);
	return (
		<div>
			A:{a} B:{b}
		</div>
	);
}
const root = ReactDOM.createRoot(document.querySelector('#root'));
root.render(<App />);
