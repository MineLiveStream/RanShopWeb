// API地址
const api = 'http://shop-api.minelive.top';
//const api = 'http://shop-api.minelive.top';

// 主题
mdui.setColorScheme('#a8a8e4');

const qrcodeDialog = document.getElementById('qrcodeDialog');
const cancelOrderBtn = document.getElementById('cancelOrderBtn');
cancelOrderBtn.addEventListener('click', function() {
    qrcodeDialog.open = false;
    const qrCodeElement = document.getElementById('qrcode');
    while (qrCodeElement.firstChild) {
        qrCodeElement.removeChild(qrCodeElement.firstChild);
    }
});

// 加群按钮
document.getElementById('helpBtn').addEventListener('click', function() {
    mdui.dialog({
        headline: "是否继续？",
        description: "即将跳转QQ加群后私信联系群主哟~",
        closeOnOverlayClick: true,
        actions: [
            {
                text: "取消",
            },
            {
                text: "确认",
                onClick: () => {
                    window.open('https://qm.qq.com/q/jUfyfiKEo2', '_blank');
                    return true;
                },
            }
        ]
    });
});

// 切换主题
let darkMode = localStorage.getItem('dark');
if (!darkMode) {
    darkMode = false;
    mdui.setTheme('light');
} else {
    darkMode = true;
    mdui.setTheme('dark');
}
document.getElementById('themeBtn').addEventListener('click', function() {
    if (darkMode) {
        darkMode = false;
        mdui.setTheme('light');
    } else {
        darkMode = true;
        mdui.setTheme('dark');
    }
    localStorage.setItem('dark', darkMode);
});

// 禁止修改手机位置
document.getElementById('country').addEventListener('change', function() {
    document.getElementById('country').value = "86";
});

function createOrder(payType) {
    const params = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        email: document.getElementById('email').value,
        count: 1,
        item: document.getElementById('itemSelect').value,
        payType: payType
    };
    fetch(api + "/order", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('错误响应码');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('buyBtn').loading = false;
            if (data.code === 5000) {
                const qr = new QRious();
                qr.backgroundAlpha = 0.5;
                qr.foregroundAlpha = 0.9;
                qr.size = 250;
                qr.value = data.qrcode;
                const qrCodeDataUrl = qr.toDataURL();
                const qrCodeImage = new Image();
                qrCodeImage.src = qrCodeDataUrl;
                const qrCodeElement = document.getElementById('qrcode');
                while (qrCodeElement.firstChild) {
                    qrCodeElement.removeChild(qrCodeElement.firstChild);
                }
                qrCodeImage.onload = function() {
                    qrCodeElement.appendChild(qrCodeImage);
                };
                qrcodeDialog.description = '付款价格：' + (data.price / 100) + ' 元';
                qrcodeDialog.open = true;
                pollOrderStatus(data.orderId, 3000);
            } else {
                mdui.snackbar({message: data.msg});
            }
        })
        .catch(error => {
            document.getElementById('buyBtn').loading = false;
            mdui.snackbar({message: "发生了错误www请稍后再试吧"});
            console.error('检测到错误', error);
        });
}

// 检查订单
async function pollOrderStatus(orderId, interval = 3000) {
    do {
        const data = await checkOrder(orderId);
        if (data.code === 200) {
            qrcodeDialog.open = false;
            mdui.snackbar({message: "购买成功(╹▽╹)请留意邮箱通知"});
            break;
        } else if (data.code !== 5000) {
            mdui.snackbar({message: data.msg});
            qrcodeDialog.open = false;
            break;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    } while (true);
}

async function checkOrder(orderId) {
    try {
        const params = {
            orderId: orderId
        };
        const url = api + "/order";
        const response = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(params)
        });
        return await response.json();
    } catch (error) {
        console.error('请求推流时出错:', error);
        return null;
    }
}

// 支付宝下单按钮
document.getElementById('alipayBtn').addEventListener('click', function(event) {
    document.getElementById('paymentDialog').open = false;
    createOrder("ALIPAY");
});

// 微信下单按钮
document.getElementById('wechatBtn').addEventListener('click', function(event) {
    document.getElementById('paymentDialog').open = false;
    createOrder("WECHAT");
});

// 取消下单按钮
document.getElementById('cancelPaymentBtn').addEventListener('click', function(event) {
    document.getElementById('paymentDialog').open = false;
    document.getElementById('buyBtn').loading = false;
});

// 点击下单按钮
document.getElementById('buyBtn').addEventListener('click', function(event) {
    if (!document.getElementById('name').value) {
        mdui.snackbar({message: "收货人不能为空"});
    } else if (!document.getElementById('address').value) {
        mdui.snackbar({message: "收货地址不能为空"});
    } else if (!document.getElementById('phone').value) {
        mdui.snackbar({message: "联系电话不能为空"});
    } else if (!document.getElementById('email').value) {
        mdui.snackbar({message: "邮箱地址不能为空"});
    } else if (document.getElementById('email').value !== document.getElementById('confirm-email').value) {
        mdui.snackbar({message: "两次输入邮箱地址不一致"});
    } else {
        document.getElementById('confirmText').innerHTML =
            '收货人: ' + document.getElementById('name').value
            + '<br>联系电话: +86 ' + document.getElementById('phone').value
            + '<br>收货地址: ' + document.getElementById('address').value
            + '<br>通知邮箱: ' + document.getElementById('email').value
            + '<br>请确认以上信息准确无误<br>'
            + '<br>' + document.getElementById('priceText').innerHTML
            + '<br>请选择您的付款方式';

        document.getElementById('paymentDialog').open = true;
        document.getElementById('buyBtn').loading = true;
    }
});

// 查询订单按钮
document.getElementById('checkLogBtn').addEventListener('click', function(event) {
    if (!document.getElementById('orderId').value) {
        mdui.snackbar({message: "订单号不能为空"});
    } else {
        checkLog(document.getElementById('orderId').value);
        document.getElementById('checkLogBtn').loading = true;
    }
});

// 查询订单号
function checkLog(orderId) {
    fetch(api + "/order?order=" + orderId)
        .then(response => {
                if (!response.ok) {
                    throw new Error('错误响应码');
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('checkLogBtn').loading = false;
                if (data.code === 200) {
                    document.getElementById('logResultText').innerHTML =
                        "<h3>查询结果</h3>收货人: " + data.name +
                        "<br>邮箱地址: " + data.email +
                        "<br>联系电话: " + data.phone +
                        "<br>订单状态: " + data.status +
                        "<br>下单数量: " + data.count +
                        "<br>购买时间: " + formatTimestamp(data.time) +
                        "<br>支付方式: " + data.payType +
                        "<br>快递单号: " + data.delivery;
                    mdui.snackbar({message: "查询成功啦╭(○｀∀´○)╯"});
                } else {
                    mdui.snackbar({message: data.msg});
                }
            })
            .catch(error => {
                document.getElementById('checkLogBtn').loading = false;
                mdui.snackbar({message: '不好了！查询订单时发生错误'});
                document.getElementById('logResultText').textContent = '查询订单发生错误: ' + error.message;
            });
}

// 格式化日期
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 获取价格
const itemSelect = document.getElementById('itemSelect');
let itemData;
function getItem() {
    fetch(api + "/item")
        .then(response => {
                if (!response.ok) {
                    throw new Error('错误响应码');
                }
                return response.json();
            })
            .then(data => {
                if (data.code === 200) {
                    itemData = data.data;
                    itemSelect.innerHTML = "";
                    for (const key in data.data) {
                        if (data.data.hasOwnProperty(key)) {
                            const item = data.data[key];
                            const mduiItem = document.createElement('mdui-menu-item');
                            mduiItem.value = key;
                            mduiItem.innerHTML = item.name;
                            itemSelect.appendChild(mduiItem);
                            itemSelect.value = mduiItem.value;
                        }
                    }
                } else {
                    mdui.snackbar({message: data.msg});
                }
            })
            .catch(error => {
                mdui.snackbar({message: '不好了！获取商品时发生错误'});
            });
}
getItem();

// 更改页面自动更改详情
let logItemSelectValue;
itemSelect.addEventListener('change', function() {
    if (itemSelect.value) {
        logItemSelectValue = itemSelect.value;
    } else {
        itemSelect.value = logItemSelectValue;
    }
    const item = itemData[itemSelect.value];
    const price = (item.price / 100).toFixed(2);
    document.getElementById('priceText').innerHTML = "商品总价：￥" + price + "<br>邮费：￥0.00<br>实付款：￥" + price;
    const itemContext = document.getElementById('itemContext');
    itemContext.innerHTML = "";
    const itemScript = document.createElement("script");
    itemScript.type = "text/javascript";
    itemScript.src = "constant/" + item.page + ".js";
    itemContext.appendChild(itemScript);
});