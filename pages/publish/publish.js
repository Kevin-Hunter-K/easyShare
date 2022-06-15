// pages/publish/publish.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 是否是真实页面的标记
    isReal: false,


    // 假页面的数据
    list: [{
      title: '校关于校友入馆有关事项的通知',
      content: '12312312423432432423',
      imageUrl: 'https://pic.imgdb.cn/item/614e7b0d2ab3f51d9127dcb8.jpg'
    },
    {
      title: '图书馆关于2021年中秋节期间开馆及业务服务安排的通知',
      content: '12312312423432432423',
      imageUrl: 'https://pic.imgdb.cn/item/614e7b1f2ab3f51d9127f144.jpg'
    },
    {
      title: '学校举行2021级新生开学典礼暨本科新生军训动员大会',
      content: '12312312423432432423',
      imageUrl: 'https://pic.imgdb.cn/item/614e7b892ab3f51d912863f6.jpg'
    }
    ],


  },

  hit() {
    wx.showToast({
      title: '加载错误',
      icon: 'none'
    })
  },

  // 右上角分享功能
  onShareAppMessage() {
    return {};
  },



  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    if (!app.globalData.isReal) {
      // 加载版本信息
      await wx.cloud.database().collection('deal')
        .get()
        .then(res => {
          app.globalData.isReal = res.data[0].isReal;
          this.setData({
            isReal: res.data[0].isReal
          })
        })
    } else {
      this.setData({
        isReal: app.globalData.isReal
      })
    }
  },



  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    // 加载版本信息
    await wx.cloud.database().collection('deal')
      .get()
      .then(res => {
        app.globalData.isReal = res.data[0].isReal;
        app.globalData.isArticlePass = res.data[0].isArticlePass;
        app.globalData.isResourcePass = res.data[0].isResourcePass;
        app.globalData.isCommentPass = res.data[0].isCommentPass;
      })
  },


})