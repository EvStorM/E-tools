/*
 * @Date: 2021-07-15 18:55:04
 * @LastEditors: E'vils
 * @LastEditTime: 2022-01-26 17:47:45
 * @Description:
 * @FilePath: /util/evils/utils.js
 */
import Vue from "vue";
import color from "../../style/evil.scss";
import timeFormat from "./timeFormat";
import yesterday from "./yesterday";
import mixin from "./mixin";
let safeAreaInsetsB = uni.getSystemInfoSync().safeAreaInsets.bottom;
let isiOS = /iOS/.test(uni.getSystemInfoSync().system);
let safeAreaInsetBottom = {
  paddingBottom: isiOS ? "constant(safe-area-inset-bottom)" : safeAreaInsetsB > 10 ? safeAreaInsetsB + "rpx" : "32rpx",
  paddingBottom: isiOS ? "env(safe-area-inset-bottom)" : safeAreaInsetsB > 10 ? safeAreaInsetsB + "rpx" : "32rpx",
};

// 获取星座
function getAstro(m, d) {
  if (m.length > 5 && !d) {
    m = timeFormat(m, "MM");
    d = timeFormat(m, "DD");
  }
  return "摩羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手摩羯".substr(m * 2 - (d < "102223444433".charAt(m - 1) - -19) * 2, 2);
}
// 验证电话并拨打
function istel(tel) {
  let rep = new RegExp(/(^(\d{3,4}-)?\d{7,8})$|(^[1](([3][0-9])|([4][5-9])|([5][0-3,5-9])|([6][5,6])|([7][0-8])|([8][0-9])|([9][1,8,9]))[0-9]{8}$)/);
  return rep.test(tel);
}
// 获取字符串字节长度
function getStrLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    let a = str.charAt(i);
    //使用的正则表达式
    if (a.match(/[^\x00-\xff]/gi) != null) {
      len += 2;
    } else {
      len += 1;
    }
  }
  console.log(len);
  return len;
}
// 获取数组的元素(负值也能取到
function getItem(arr, n) {
  n = Math.trunc(n) || 0;
  if (n < 0) n += arr.length;
  if (n >= arr.length) n = n % arr.length;
  // if (n < 0 || n >= arr.length) return undefined;
  return arr[n];
}
/**
 * 是否json字符串,并返回值
 */
function isJsonString(value, defaultValue = {}) {
  if (typeof value == "string") {
    try {
      var obj = JSON.parse(value);
      if (typeof obj == "object" && obj) {
        return obj;
      } else {
        return defaultValue;
      }
    } catch (e) {
      return defaultValue;
    }
  }
  return false;
}
function htmlDecode(value) {
  let str1 = decodeURIComponent(value);
  const map = { amp: "&", lt: "<", gt: ">", quot: '"', "#039": "'" };
  return str1.replace(/&([^;]+);/g, (m, c) => map[c]);
}
function queryJson(url) {
  let str = htmlDecode(url);
  let param = {}; // 存储最终JSON结果对象
  str.replace(/([^?&]+)=([^?&]+)/g, function (s, v, k) {
    param[v] = decodeURIComponent(k); //解析字符为中文
    return k + "=" + v;
  });
  return param;
}
/**
 * 缓存请求
 * @param {*} name 保存的数据名称
 * @param {*} data 传入的参数
 * @param {*} func 使用的请求方法
 * @param {*} version 保存的数据版本
 * @param {*} time 过期时间
 * @param {*} refresh 是否更新
 * @return {*}
 */
function getbuffer({ name, param, fnName, page = 1, version = "0.0.1", time = 60 * 60, refresh }) {
  return new Promise((resolve, reject) => {
    let _val = Vue.ls.get(name, version);
    if (!_val || refresh || page > 1) {
      fnName({ ...param }).then((r) => {
        if (!r) return reject(r);
        if (r.code) {
          if (page <= 1) {
            Vue.ls.set(name, r.data, time);
          }
        }
        resolve(r.data);
      });
    } else {
      resolve(_val);
    }
  });
}
// 页面模式的api调用
function pagesApi({ fnName, name, buffer = "", param = {}, page = "page", loadStatus = "status", refresh = false, list = null, time = 5 * 60, success }) {
  if (refresh) {
    this[loadStatus] = "loadmore";
    this["triggered"] = true;
    this[page] = 1;
  }
  if (this[loadStatus] == "nomore") {
    this["triggered"] = false;
    return;
  }
  this[loadStatus] = "loading";
  if (buffer) {
    getbuffer({
      name: buffer,
      fnName,
      time,
      refresh,
      page: this[page],
      param: { ...param, page: this[page] },
    }).then((e) => {
      if (!e) return;
      let v = e;
      uni.stopPullDownRefresh();
      this["triggered"] = false;
      this["_freshing"] = false;
      if (list) {
        success(e);
        v = e["list"];
      }
      if (refresh) {
        this[name] = {
          data: [],
        };
      }
      if (this[page] >= v.last_page) {
        this[name].data = [...this[name].data, ...v.data];
        this[loadStatus] = "nomore";
      } else if (this[page] < v.last_page) {
        this[name].data = [...this[name].data, ...v.data];
        this[page]++;
        this[loadStatus] = "loadmore";
      }
      if (!list && success) {
        success(v);
      }
    });
  } else {
    fnName({
      ...param,
      page: this[page],
    }).then((e) => {
      if (!e) return;
      uni.stopPullDownRefresh();
      this["triggered"] = false;
      this["_freshing"] = false;
      let v = null;
      if (list) {
        // 进行内容的特别判断,如果值包裹在另外一层
        success(e.data);
        v = e.data.list;
      } else {
        v = e.data;
      }
      if (refresh) {
        this[name] = {
          data: [],
        };
      }
      console.log(`utils`, v);
      if (this[page] >= v.last_page) {
        this[name].data = [...this[name].data, ...v.data];
        this[loadStatus] = "nomore";
      } else if (this[page] < v.last_page) {
        this[name].data = [...this[name].data, ...v.data];
        this[page]++;
        this[loadStatus] = "loadmore";
      }
      if (!list && success) {
        success(v);
      }
    });
  }
}
function getStyleInt(style) {
  if (!/[0-9]/.test(style)) {
    return 0;
  }
  let num = /[0-9]+/g.exec(style);
  console.log("%c [ num ]-202-「utils.js」", "font-size:13px; background:#FFE47F; color:#000000;", num);
  return num;
}
function disScroll() {

}

function addStyle(customStyle, target = "object") {
  // 字符串转字符串，对象转对象情形，直接返回
  if (test.empty(customStyle) || (typeof customStyle === "object" && target === "object") || (target === "string" && typeof customStyle === "string")) {
    return customStyle;
  }
  // 字符串转对象
  if (target === "object") {
    // 去除字符串样式中的两端空格(中间的空格不能去掉，比如padding: 20px 0如果去掉了就错了)，空格是无用的
    customStyle = trim(customStyle);
    // 根据";"将字符串转为数组形式
    const styleArray = customStyle.split(";");
    const style = {};
    // 历遍数组，拼接成对象
    for (let i = 0; i < styleArray.length; i++) {
      // 'font-size:20px;color:red;'，如此最后字符串有";"的话，会导致styleArray最后一个元素为空字符串，这里需要过滤
      if (styleArray[i]) {
        const item = styleArray[i].split(":");
        style[trim(item[0])] = trim(item[1]);
      }
    }
    return style;
  }
  // 这里为对象转字符串形式
  let string = "";
  for (const i in customStyle) {
    // 驼峰转为中划线的形式，否则css内联样式，无法识别驼峰样式属性名
    const key = i.replace(/([A-Z])/g, "-$1").toLowerCase();
    string += `${key}:${customStyle[i]};`;
  }
  // 去除两端空格
  return trim(string);
}

// 金额格式化方法
const amountFormat = (num) => {
  if (typeof num == "undefined" || typeof num == "null") {
    return;
  } else {
    let _num = parseFloat(num);
    return _num.toFixed(2);
  }
};
// 16进制色彩转RGBA
const sixteenToRGBA = (hex, alpha) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  let _RGBA = result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: parseFloat(alpha).toFixed(1),
      }
    : null;
  return _RGBA ? `rgba(${_RGBA.r},${_RGBA.g},${_RGBA.b},${_RGBA.a})` : null;
};
const buffer = function ({ name, param, fnName, page = 1, version = "0.0.1", time = 60 * 60, refresh }) {
  return new Promise((resolve, reject) => {
    let _val = Vue.ls.get(name, version);
    if (!_val || refresh || page > 1) {
      fnName({ ...param }).then((r) => {
        if (!r) return reject(r);
        if (r.code) {
          if (page <= 1) {
            Vue.ls.set(name, r.data, time);
          }
        }
        resolve(r.data);
      });
    } else {
      resolve(_val);
    }
  });
};
const showToast = function (res, { title = "请求成功", duration = 1600, success = null, fail = null, callback = null }) {
  uni.hideToast();
  if (res.code) {
    if (success) {
      success(res);
    }
    this.$refs.uToast.show({
      title: title || "请求成功",
      type: "success",
      duration: duration,
      icon: false,
      callback: (res) => {
        if (callback) {
          callback(res);
        }
      },
    });
  } else {
    if (fail) {
      fail(res);
    }
    this.$refs.uToast.show({
      title: res.msg || "请求失败",
      type: "error",
      duration: duration,
      icon: false,
    });
  }
};
// 富文本输出纯文字
function getSimpleText(html) {
  undefined;
  var re1 = new RegExp("<.+?>", "g"); //匹配html标签的正则表达式，"g"是搜索匹配多个符合的内容
  var msg = html.replace(re1, ""); //执行替换成空字符
  return msg;
}
const $e = {
  color,
  safeAreaInsetBottom, // 默认底部适配抬高
  getSimpleText, // 富文本输出纯文字
  htmlDecode, // html解码
  queryJson, // html传参转json
  isJsonString, // 是否是json字符串,并返回值
  getStrLength, // 获取字符字节长度
  getAstro, // 获取星座
  timeFormat, // 时间格式化
  yesterday, // 计算是否是昨天.今天,明天
  getItem, // 获取数组的元素(负值也能取到
  istel, // 是电话包含座机
  pagesApi, // 页面模式的请求
  buffer, // 缓存方式的请求
  amountFormat, // 金额格式化
  sixteenToRGBA, // 16位颜色转rgba
  addStyle, // 添加样式后缀 例 12 + rpx
  getStyleInt, // 获取样式的数值 例 12rpx 返回12
  showToast, // 显示toast封装,主要用于接口回调
};
uni.$e = $e;
const install = (Vue) => {
  Vue.mixin(mixin);
  Vue.prototype.$e = $e;
};

export default {
  install,
};
