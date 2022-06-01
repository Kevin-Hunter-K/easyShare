const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 是否是真实页面的标记
    isReal: false,
    // 请求回来的帖子数组
    articleList: [],
    // 标记是否可以继续发送请求
    isContinueGetArticle: true,
    // 是否展示顶置图标的标志
    isShowUpImage: false,
  },

  // 点击预览图片
  previewImage(res) {
    // 被点击的图片的索引
    const index = res.currentTarget.dataset.index;
    const imageList = res.currentTarget.dataset.images;
    // 调用预览图片接口
    wx.previewImage({
      urls: imageList, //图片数组
      current: imageList[index] //当前要预览的图片
    })
  },

  // 更新帖子的通过审核状态
  updateArticlePass(id, isPass) {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('article')
        .doc(id)
        .update({
          data: {
            isPass: isPass,//通过审核
            isCheck: true,//标记已经审核过
          }
        })
        .then(res => {
          console.log("审核状态更新成功-->", res);
          resolve(res)
        })
        .catch(err => {
          console.log("审核状态更新失败", err);
        })
    })
  },


  // 通过审核
  async hitDealPass(res) {
    // 获取帖子在数据库中的_id，便于搜索
    const id = res.currentTarget.dataset.id;
    const isPass = res.currentTarget.dataset.ispass;
    console.log("点击了-->", isPass);
    // 更新帖子的是否通过状态
    await this.updateArticlePass(id, isPass);

    // 更新帖子列表
    this.setData({
      articleList: this.data.articleList.filter(item => item._id !== id)
    })
    wx.showToast({
      title: '操作成功'
    })
  },


  // 获取未通过审核的帖子
  getArticle() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('article')
        .where({
          isCheck: false
        })
        .orderBy('time', 'asc')//按时间排序
        .skip(this.data.articleList.length)
        .limit(10)//每次获取10条数据
        .get()
        .then(res => {
          console.log("帖子获取成功--->", res.data);
          if (res.data.length == 0) {
            this.setData({
              isContinueGetArticle: false,
            })
          } else {
            this.setData({
              articleList: [...this.data.articleList, ...res.data]
            })
          }
          resolve(res);
        })
        .catch(err => {
          console.log("帖子获取失败-->", err);
        })
    })
  },

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
          console.log("版本信息-->", res);
        })
    } else {
      this.setData({
        isReal: app.globalData.isReal
      })
      console.log("是否为真实页面-->", this.data.isReal);
    }


    if (!this.data.isReal) return;//结束函数 

    wx.showLoading({
      title: '数据加载中...',
    })

    await this.getArticle();

    wx.showToast({
      title: '加载成功',
      duration: 1500
    })
  },

  // 监听页面滚动距离顶部位置
  onPageScroll: function (e) {
    if (e.scrollTop > 100) {
      this.setData({
        isShowUpImage: true
      })
    } else {
      this.setData({
        isShowUpImage: false
      })
    }

  },


  async onPullDownRefresh() {
    // 数据置空
    this.setData({
      articleList: [],
      isContinueGetArticle: true,
    })
    // 显示刷新
    wx.showLoading({
      title: '正在刷新...'
    })

    await this.getArticle();
    // 数据请求完成之后结束下拉刷新
    wx.stopPullDownRefresh();//请求完成之后结束下拉动画
    wx.hideLoading();
    wx.showToast({
      title: '加载成功',
      duration: 1500
    })
  },


  async onReachBottom() {
    if (this.data.isContinueGetArticle) {//可以继续请求数据
      await this.getArticle();
    } else {//不继续请求数据
      wx.showToast({
        title: '暂无更多数据',
        icon: 'none'
      })
    }
  },


  // 点击顶置
  up() {
    wx.pageScrollTo({
      scrollTop: 0 //顶置
    })
  },
})