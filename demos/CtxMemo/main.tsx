import {
	memo,
	useState,
	useMemo,
	useCallback,
	createContext,
	useContext
} from 'react';
import ReactDOM from 'react-dom/client';

const ctx = createContext(0);

function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);

	return (
		<ctx.Provider value={num}>
			<div onClick={() => update(1)}>
				<Cpn />
			</div>
		</ctx.Provider>
	);
}

// 这里利用useMemo 和memo结合 对props 中的函数进行缓存
// 从而防止的再次渲染
const Cpn = memo(function () {
	console.log('cpn render:');
	return (
		<div>
			<Child />
		</div>
	);
});

function Child() {
	console.log('child render');
	const val = useContext(ctx);
	return <div>ctx:{val}</div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
