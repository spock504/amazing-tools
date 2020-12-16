const first = document.querySelector('#number1');
const second = document.querySelector('#number2');

const result = document.querySelector('.result');

if (window.Worker) {
	const myWorker = new Worker("worker.js");

	first.onchange = function () {
		// 主线程发送消息
		myWorker.postMessage([first.value, second.value]);
		console.log('Message posted to worker 发送first值');
	}

	second.onchange = function () {
		myWorker.postMessage([first.value, second.value]);
		console.log('Message posted to worker 发送second值');
	}
	// 主线程接收消息
	myWorker.onmessage = function (e) {
		result.textContent = e.data;
		console.log('Message received from worker 接受计算好的值', e);
	}
} else {
	console.log('Your browser doesn\'t support web workers.')
}
