import { memo, useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);

	return (
		<div onClick={() => update(num + 1)}>
			<Cpn num={num} name={'cpn1'} />
			<Cpn num={0} name={'cpn2'} />
		</div>
	);
}

const Cpn = memo(function ({ num, name }) {
	console.log('render:', name);
	return (
		<div>
			{name}:{num}
		</div>
	);
});

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
