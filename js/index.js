// API地址
const api = 'https://shop-api.minelive.top';

// 主题
mdui.setColorScheme('#a8a8e4');

// 判断是否是手机端
function isMobile() {
    const mobileUserAgentFragments = [
        'Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'IEMobile', 'Opera Mini'
    ];
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    for (let i = 0; i < mobileUserAgentFragments.length; i++) {
        if (userAgent.indexOf(mobileUserAgentFragments[i]) > -1) {
            return true;
        }
    }
    return false;
}

if (isMobile()) {
    document.getElementById('itemContextCard').remove();
    document.getElementById('mainDiv').style.display = "row";
    document.getElementById('mainDiv').style.height = "100%";
    document.getElementById('shopMenu').style.width = "100%";
    document.getElementById('shopMenu').style.height = "100%";
    const newItemContext = document.createElement('itemContext');
    const itemInfoDiv = document.createElement('div');
    itemInfoDiv.id = "itemContext";
    itemInfoDiv.style.margin = "10px";
    document.getElementById('phoneItemContext').appendChild(itemInfoDiv);
    document.getElementById('shopTab').value = "tab-1";
} else {
    document.getElementById('itemInfo').remove();
}

// 弹出提示
function notice(context) {
    if (isMobile()) {
        mdui.alert({
                headline: "报告！",
                description: context,
                closeOnOverlayClick: true,
                confirmText: "好的"});
    } else mdui.snackbar({message: context});
}

// 二维码窗口
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
    mdui.confirm({
        headline: "是否继续?",
        description: "即将跳转QQ加群后私信联系群主哟~",
        closeOnOverlayClick: true,
        cancelText: "取消",
        confirmText: "确认",
        onConfirm: () => window.open('https://qm.qq.com/q/jUfyfiKEo2', '_blank')
    });
});

// 读取主题
let darkMode = localStorage.getItem('dark') === 'true';

// 设置初始主题
mdui.setTheme(darkMode ? 'dark' : 'light');

document.getElementById('themeBtn').addEventListener('click', function () {
    darkMode = !darkMode; // 取反主题状态
    mdui.setTheme(darkMode ? 'dark' : 'light');
    localStorage.setItem('dark', darkMode); // 存储字符串 'true' 或 'false'
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
        count: document.getElementById('buyCount').value,
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
                qrcodeDialog.description = '付款价格：' + (data.price / 100).toFixed(2) + ' 元';
                qrcodeDialog.open = true;
                pollOrderStatus(data.orderId, 3000);
            } else {
                notice(data.msg);
            }
        })
        .catch(error => {
            document.getElementById('buyBtn').loading = false;
            notice("发生了错误www请稍后再试吧。");
            console.error('检测到错误', error);
        });
}

// 检查订单
async function pollOrderStatus(orderId, interval = 3000) {
    do {
        const data = await checkOrder(orderId);
        if (data.code === 200) {
            qrcodeDialog.open = false;
            notice("购买成功(╹▽╹)请留意邮箱通知。");
            break;
        } else if (data.code !== 5000) {
            notice(data.msg);
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
        notice("收货人不能为空。");
    } else if (!document.getElementById('address').value) {
        notice("收货地址不能为空。");
    } else if (!document.getElementById('phone').value) {
        notice("联系电话不能为空。");
    } else if (!document.getElementById('email').value) {
        notice("邮箱地址不能为空。");
    } else if (document.getElementById('email').value !== document.getElementById('confirm-email').value) {
        notice("两次输入邮箱地址不一致。");
    } else {
        document.getElementById('confirmText').innerHTML =
            '收货人: ' + document.getElementById('name').value
            + '<br>联系电话: +86 ' + document.getElementById('phone').value
            + '<br>收货地址: ' + document.getElementById('address').value
            + '<br>通知邮箱: ' + document.getElementById('email').value
            + '<br>请确认以上信息准确无误<br>'
            + '<br>数量: ' + document.getElementById('buyCount').value
            + '<br>' + document.getElementById('priceText').innerHTML
            + '<br>请选择您的付款方式';

        document.getElementById('paymentDialog').open = true;
        document.getElementById('buyBtn').loading = true;
    }
});

// 查询订单按钮
document.getElementById('checkLogBtn').addEventListener('click', function(event) {
    if (!document.getElementById('orderId').value) {
        notice("订单号不能为空。");
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
                    document.getElementById('orderId').value = "";
                    const item = itemData[itemSelect.value];
                    document.getElementById('logResultText').innerHTML =
                        "<h3>查询结果</h3>收货人: " + data.name +
                        "<br>邮箱地址: " + data.email +
                        "<br>联系电话: " + data.phone +
                        "<br>订单状态: " + data.status +
                        "<br>商品名称: " + item.name +
                        "<br>下单数量: " + data.count +
                        "<br>购买时间: " + formatTimestamp(data.time) +
                        "<br>支付方式: " + data.payType +
                        "<br>付款价格: " + (data.price / 100).toFixed(2) + " 元" +
                        "<br>快递单号: " + data.trackingNum +
                        "<br>";
                    notice("查询成功啦╭(○｀∀´○)╯");
                } else {
                    notice(data.msg);
                }
            })
            .catch(error => {
                document.getElementById('checkLogBtn').loading = false;
                notice('不好了！查询订单时发生错误。');
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
const buyCountSelect = document.getElementById('buyCount');
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
                    notice(data.msg);
                }
            })
            .catch(error => {
                notice('不好了！获取商品时发生错误。');
            });
}
getItem();

// 更改页面自动更改详情
let logBuyCountSelectValue;
let logItemSelectValue;
let logItemPageValue;
function updatePrice() {
    const item = itemData[itemSelect.value];
    const price = (item.price / 100).toFixed(2) * parseFloat(buyCountSelect.value);
    document.getElementById('priceText').innerHTML = "商品总价：￥" + price + "<br>邮费：￥0.00<br>实付款：￥" + price;

    if (item.page !== logItemPageValue) {
        logItemPageValue = item.page;
        const itemContext = document.getElementById('itemContext');
        itemContext.innerHTML = "";
        const itemScript = document.createElement("script");
        itemScript.type = "text/javascript";
        itemScript.src = "constant/" + item.page + ".js";
        itemContext.appendChild(itemScript);
    }
}
itemSelect.addEventListener('change', function() {
    if (itemSelect.value) {
        logItemSelectValue = itemSelect.value;
    } else {
        itemSelect.value = logItemSelectValue;
    }
    updatePrice();
});
buyCountSelect.addEventListener('change', function() {
    if (buyCountSelect.value) {
        logBuyCountSelectValue = buyCountSelect.value;
    } else {
        buyCountSelect.value = logBuyCountSelectValue;
    }
    updatePrice();
});

// 点击顶部栏回到顶部
document.getElementById("topBtn").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
});
