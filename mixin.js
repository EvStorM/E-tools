/*
 * @Date: 2021-12-27 14:55:23
 * @LastEditors: E'vils
 * @LastEditTime: 2021-12-27 14:59:08
 * @Description:
 * @FilePath: /util/evils/mixin.js
 */

export default {
  onPageScroll(e) {
    this.$refs.navbar && this.$refs.navbar.TopTheGradient(e.scrollTop);
  },
};
