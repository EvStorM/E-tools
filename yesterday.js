/*
 * @Date: 2022-01-11 18:24:42
 * @LastEditors: E'vils
 * @LastEditTime: 2022-01-11 18:44:50
 * @Description:
 * @FilePath: /util/evils/yesterday.js
 */
const dayjs = require("dayjs");

let arr = [
  {
    name: "昨天",
    type: "day",
    day: -1,
  },
  {
    name: "今天",
    type: "day",
    day: 0,
  },
  {
    name: "明天",
    type: "day",
    day: 1,
  },
  {
    name: "后天",
    type: "day",
    day: 2,
  },
];
function yesterday(time, time2 = dayjs(), type = "day", format = "MM月DD日") {
  let time1 = time;
  if (!dayjs.isDayjs(time)) {
    time1 = dayjs(time);
  }
  let num = time1.startOf("day").diff(time2.startOf("day"), type);
  let result = arr.filter((v) => v.type == type && v.day == num);
  if (result.length > 0) {
    return result[0].name;
  } else {
    return dayjs(time).format(format);
  }
}

export default yesterday;
