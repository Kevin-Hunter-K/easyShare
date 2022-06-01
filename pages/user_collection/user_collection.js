const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {


    isReal: false,
    openid: '',
    // 搜索失败的帖子
    articleFailList: [],
    // 用户收藏的帖子数组
    collectionList: [],
    // 在数据库中搜索到的帖子内容
    list: [],//只需要时间、标题、发布人的昵称、头像地址
    // 判断是否继续请求帖子数据的标记
    isContinueGetArticle: true,
    // 是否展示顶置图标的标志
    isShowUpImage: false,
    // 分区
    leftMenu: ['#学习#', '#情感#', '#求助#', '#闲置#', '#寻物#', '#话题#'],
  },


  // 点击了帖子
  async hitArticle(res) {
    // 获取帖子在数据库中的_id，便于搜索
    const id = res.currentTarget.dataset.id;
    console.log("点击的文章在数据库中的_id-->", id);
    // 跳转到帖子详情页面
    wx.navigateTo({
      url: '/pages/articleDetail/articleDetail?_id=' + id, //将文章的_id作为页面参数传过去
    })
  },

  // 获取用户收藏过的帖子数组
  async getUserCollectionList(openid) {
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: openid
        })
        .get();
      this.setData({
        collectionList: res.data[0].collection
      })
      console.log("发送请求获取用户收藏的帖子数组成功-->", this.data.collectionList);
      return res.data[0].collection;
    } catch (err) {
      console.log("发送请求获取用户收藏的帖子数组失败-->", err);
    }
  },

  // 根据_id搜索每一条帖子
  async getArticle(articleID) {
    try {
      const res = await wx.cloud.database().collection('article')
        .doc(articleID)
        .get();
      const article = res.data;
      console.log("当前的帖子搜索成功-->", article);
      // 将搜索到的数据保存到data中
      if (article && article.isPass) {
        this.setData({
          list: [...this.data.list, article]
        })
      }
      return res;
    } catch (err) {
      this.setData({
        articleFailList: this.data.articleFailList.concat(articleID)
      })
      console.log("当前的帖子搜索失败-->", err);
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

    if (!this.data.isReal) return;




    wx.showLoading({
      title: '加载中...',
    })
    // 获取用户收藏的帖子
    const openid = wx.getStorageSync('openid');
    this.setData({
      openid: openid
    })
    const getUserCollectionListAns = await this.getUserCollectionList(openid);
    if (!getUserCollectionListAns) return;
    var collectionList = this.data.collectionList;
    var len = this.data.list.length;
    for (let i = len; i < len + 10 && i < collectionList.length; i++)
      await this.getArticle(collectionList[i]);
    wx.hideLoading();

    // 搜索完毕，对用户的帖子收藏数组去重
    for (let i = 0; i < this.data.articleFailList.length; i++) {
      for (let j = 0; j < collectionList.length; j++) {
        collectionList = collectionList.filter(item => item !== this.data.articleFailList[i]);
      }
    }
    this.setData({
      collectionList: collectionList
    })
    await this.updateCollectionList();

    console.log("帖子搜索完毕，帖子数组-->", this.data.list);
  },

  updateCollectionList() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('user')
        .where({
          _openid: this.data.openid
        })
        .update({
          data: {
            collection: this.data.collectionList
          }
        })
        .then(res => {
          console.log("用户浏览的数组更新成功-->", res);
          resolve(res)
        })
        .catch(err => {
          console.log("用户浏览的数据更新失败-->", err);
        })
    })
  },


  /**
   * 页面上拉触底事件的处理函数
   */
  async onReachBottom() {
    if (this.data.isContinueGetArticle) {
      wx.showLoading({
        title: '数据加载中...',
      })
      // 搜索每一条发布过的帖子
      var collectionList = this.data.collectionList;
      var len = this.data.list.length;//当前已获取到的帖子数组长度
      for (let i = len; i < len + 10; i++) {
        if (i >= collectionList.length) {//暂无更多数据
          this.setData({
            isContinueGetArticle: false//标记不再继续发送请求
          })
          break;
        } else {
          await this.getArticle(collectionList[i]);
        }
      }
      wx.hideLoading();
      // 搜索完毕，对用户的帖子收藏数组去重
      for (let i = 0; i < this.data.articleFailList.length; i++) {
        for (let j = 0; j < collectionList.length; j++) {
          collectionList = collectionList.filter(item => item !== this.data.articleFailList[i]);
        }
      }
      this.setData({
        collectionList: collectionList
      })
      await this.updateCollectionList();
    } else {//不再继续请求帖子数据
      wx.showToast({
        title: '暂无更多数据',
        icon: 'none'
      })
    }
  },


  // 监听页面滚动距离顶部位置
  onPageScroll: function (e) {
    // console.log(e)
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

  // 点击顶置
  up() {
    wx.pageScrollTo({
      scrollTop: 0 //顶置
    })
  },

})