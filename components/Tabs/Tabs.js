// components/Tabs/Tabs.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    tabList: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    handItemTap(res) {
      // 1 获取被点击分类的索引
      // console.log("子组件中被点击的分类的索引-->", res.currentTarget.dataset.index);
      const index = res.currentTarget.dataset.index;

      // 2 向父组件返回数据,绑定父组件的事件itemChange 在父组件中体现为binditemChange 传的值为index
      this.triggerEvent("itemChange", {index})
    }
  }
})