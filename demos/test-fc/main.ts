const button = document.querySelector('button');
const root = document.querySelector('#root');
interface Work {
	count: number;
}

const workList: Work[] = [];

function schedule() {
	const currentWork = workList.pop();
	if (currentWork) {
		perform(currentWork);
	}
}

function perform(work: Work) {
	while (work.count) {
		work.count--;
		insertSpan('0');
	}
	schedule();
}

function insertSpan(content: string) {
	const span = document.createElement('span');
	span.innerText = content;
	root?.appendChild(span);
}

button &&
	(button.onclick = () => {
		workList.unshift({
			count: 100
		});
		schedule();
	});
