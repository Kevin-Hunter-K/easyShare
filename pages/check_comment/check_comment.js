const app = getApp();
Page({

  data: {
    comment: [],
    isContinueGetComment: true,
    // 是否展示顶置图标的标志
    isShowUpImage: false,
  },


  // 更新帖子的通过审核状态
  updateCommentPass(id, isPass) {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('comment')
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
    await this.updateCommentPass(id, isPass);
    // 更新帖子列表
    this.setData({
      comment: this.data.comment.filter(item => item._id !== id)
    })
    wx.showToast({
      title: '操作成功'
    })
  },


  // 搜索当前帖子的评论
  async getComment() {
    try {
      const res = await wx.cloud.database().collection('comment')
        .where({
          isCheck: false
        })
        .orderBy('time', 'asc')//按时间排序
        .skip(this.data.comment.length)
        .limit(10)//每次获取10条数据
        .get();
      console.log("获取到的评论-->", res.data);
      if (res.data.length === 0) {//暂无更多数据
        this.setData({
          isContinueGetComment: false//标记不再继续发送请求
        })
      } else {
        this.setData({
          comment: [...this.data.comment, ...res.data]
        })
      }
      return res;
    } catch (err) {
      console.log("获取评论失败-->", err);
    }
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
    await this.getComment();
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
      comment: [],
      isContinueGetComment: true,
    })
    // 显示刷新
    wx.showLoading({
      title: '正在刷新...'
    })

    await this.getComment();
    // 数据请求完成之后结束下拉刷新
    wx.stopPullDownRefresh();//请求完成之后结束下拉动画
    wx.hideLoading();
    wx.showToast({
      title: '加载成功',
      duration: 1500
    })
  },


  async onReachBottom() {
    if (this.data.isContinueGetComment) {//可以继续请求数据
      await this.getComment();
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