// worker线程接收消息
onmessage = function (e) {
  console.log('Worker: Message received from main script worker收到数据', e);
  const result = e.data[0] * e.data[1];
  if (isNaN(result)) {
    postMessage('Please write two numbers');
  } else {
    const workerResult = 'Result: ' + result;
    console.log('Worker: Posting message back to main script 将结果发送回去');
    // worker线程发送消息
    postMessage(workerResult);
  }
}

