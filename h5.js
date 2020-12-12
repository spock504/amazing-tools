
/**
 * @description: 复制内容
 * @param {} 
 * @return void 
 */
copyInputValue = () => {
    // 方法 四 兼容 ios 安卓
    let input = document.createElement("input");
    input.value = "复制的内容balabala";
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, input.value.length), document.execCommand('Copy');
    document.body.removeChild(input);
    console.log("复制成功")
};

/**
 * @description: 两位小数正则校验
 * @param {number} 
 * @return {boolean} 
 */
twoDecimalPlacesRegular = (number) => {
    const decimalRegular = /^([1-9]+[\d]*(.[0-9]{1,2})?)$/
    return decimalRegular.test(number)
}

/**
 * @description: 整数校验
 * @param {number} 
 * @return {boolean} 
 */
integerRegular = (number) => {
    const integerRegular = /^\d+$/
    return integerRegular.test(number)
}

/**
 * @description: 判断是否安卓
 * @param  
 * @return {boolean} 
 */
isAndroid = () => {
    let u = navigator.userAgent;
    return u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;
}

/**
 * @description: 时间格式化
 * @param {dateTime:'时间',fmt='时间格式'} 
 *        时间戳转成时间: date = new Date(1602924368396) 
 * @return {date} 格式化后的时间
 */
formatDate = (dateTime = new Date(), fmt = "yyyy-MM-dd HH:mm:ss") => {
    const o = {
        "M+": dateTime.getMonth() + 1, //月份
        "d+": dateTime.getDate(), //日
        "H+": dateTime.getHours(), //小时
        "m+": dateTime.getMinutes(), //分
        "s+": dateTime.getSeconds(), //秒
        "q+": Math.floor((dateTime.getMonth() + 3) / 3), //季度
        "S": dateTime.getMilliseconds() //毫秒
    };
    // 年：展示四位或者两位
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (dateTime.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : zeroFilling(o[k]));
        }
    }
    return fmt;
}

// 补零
zeroFilling = (text) => {
    const fullText = "00" + text
    return fullText.substr(-2, 2)
}


