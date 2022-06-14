App({
  //  全局数据
  globalData: {
    // 本地未处理的用户信息
    localUserInfo: '',
    // 用户信息
    userInfo: {},
    // openid
    openid: '',
    // 用户的头像云地址
    publisherImageUrl: '',
    // 判断是否展示实际版本的标记
    isReal: null,
    // 帖子是否自动通过审核
    isArticlePass:false,
    // 资源是否自动通过审核
    isResourcePass:false,
    // 评论是否自动通过审核
    isCommentPass:false,
  },
  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  async onLaunch() {
    // 初始化云环境
    await wx.cloud.init({
      env: 'cloud-9gkh2xtg6913521c'
    })


    // 加载版本信息
    await wx.cloud.database().collection('deal')
      .get()
      .then(res => {
        this.globalData.isReal = res.data[0].isReal;
        this.globalData.isArticlePass = res.data[0].isArticlePass;
        this.globalData.isResourcePass = res.data[0].isResourcePass;
        this.globalData.isCommentPass = res.data[0].isCommentPass;
        if (res.data[0].isDeleCaChe) {//删除缓存
          console.log("清空缓存");
          wx.setStorageSync('openid', '');
          wx.setStorageSync('localUserInfo', '');
          wx.setStorageSync('userInfo', '');
          wx.setStorageSync('yibanInfo', '');
          wx.setStorageSync('resource', '');
          wx.setStorageSync('article', '');
          this.globalData.openid = '';
          this.globalData.userInfo = '';
          this.globalData.localUserInfo = '';
        }
        if(res.data[0].isDeleAdminCaChe){//删除管理员的登录缓存
          wx.setStorageSync('adminInfo', '');
        }
      })

  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {

  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {

  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {

  }
})