import { memo, useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);
	const addOne = useCallback(() => update((num) => num + 1), []);

	return (
		<div>
			<Cpn onClick={addOne} />
			{num}
		</div>
	);
}

// 这里利用useMemo 和memo结合 对props 中的函数进行缓存
// 从而防止的再次渲染
const Cpn = memo(function ({ onClick }) {
	console.log('cpn render:');
	return <div onClick={onClick}>click</div>;
});

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
