const app = getApp();
Page({
  data: {
    tabList: [{
      id: 0,
      isActive: true,
      title: "发布的帖子"
    },
    {
      id: 1,
      isActive: false,
      title: "发布的资源"
    }
    ],
    // 分区
    leftMenu: ['#学习#', '#情感#', '#求助#', '#闲置#', '#寻物#', '#话题#'],
    // 当前被点击的栏
    leftIndex: 0, //默认为学习区

    // 是否展示顶置图标的标志
    isShowUpImage: false,
    // 用户发布过的帖子数组
    publishArticle: [],
    // 用户发布过的资源数组
    upLoadResource: [],
    // 搜索到的帖子数组
    articleList: [],
    // 搜索到的资源数组
    resourceList: [],


    openid: '',
    isReal: false,
    // 判断是否继续请求帖子数据的标记
    isContinueGetArticle: true,
    // 判断是否继续请求资源数据的标记
    isContinueGetResource: true,
  },



  // 下载文件
  async downFile(cloudPath) {
    try {
      // 打开数据库中的文件
      const res = await wx.cloud.downloadFile({
        fileID: cloudPath //云数据库中的地址
      });
      console.log("资源下载成功-->", res);
      return res;
    } catch (err) {
      wx.showToast({ //显示打开失败
        title: '打开失败',
        icon: 'none',
        duration: 2000
      })
      console.log("文件临时下载错误", err)
    }
  },

  async openFile(tempPath) {
    try {
      const res = await wx.openDocument({
        filePath: tempPath, //文件的下载成功的临时路径
        showMenu: true, //显示右上角菜单，可以转发、收藏、保存、选择其他应用打开
      });
      wx.hideLoading();
      console.log("文件打开成功-->", res);
      return res;
    } catch (err) {
      wx.showToast({ //显示打开失败
        title: '打开失败',
        icon: 'none'
      })
      console.log("文件打开失败-->", err);
    }
  },

  // 点击打开文件
  async hitFile(res) {
    console.log("点击事件获取的数据-->", res);
    // 获取点击文件的云地址和 数据库中自动生成的唯一数据标识 _id
    const cloudPath = res.currentTarget.dataset.cloudpath;
    const id = res.currentTarget.dataset.id;
    const scanNum = res.currentTarget.dataset.scannum;

    wx.showLoading({
      title: '正在打开...',
      mask: true
    })
    // 下载资源文件
    const downLoadFileAns = await this.downFile(cloudPath);
    if (!downLoadFileAns) return;//结束函数

    // 获取下载成功的临时路径
    const tempPath = downLoadFileAns.tempFilePath;
    console.log("文件的临时链接-->", tempPath);
    // 打开资源文件
    const openFileAns = await this.openFile(tempPath);
    if (!openFileAns) return;//结束函数
  },


  // 接收从分类栏子组件传过来的数据
  itemChange(res) {
    // 1 获取子组件被点击的分类的索引
    const index = res.detail.index;
    console.log("点击的分区索引为-->", index);
    // console.log("展示的数据为-->", this.data.list);
    // console.log("父组件中接收到的子组件被点击的分类的索引-->", index);
    // 2 复制一个tabs临时数组出来以供修改
    const tempTabList = JSON.parse(JSON.stringify(this.data.tabList));
    // 3 根据索引修改临时数组tempTabList
    tempTabList.forEach(v => v.isActive = (v.id === index));
    // 4 将数组还原
    this.setData({
      tabList: tempTabList,
      leftIndex: index,
    })
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


  // 获取用户发布过的帖子
  async getUserPublishArticle() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('article')
        .where({
          _openid: this.data.openid,
          isPass:true
        })
        .skip(this.data.articleList.length)
        .limit(10)
        .get()
        .then(res => {
          console.log("获取当前用户发布过的帖子成功-->", res.data);
          if (res.data.length === 0) {//加载完毕，暂无更多数据
            this.setData({
              isContinueGetArticle: false//标记不再继续发送请求
            })
          } else {//还有数据
            this.setData({
              articleList: this.data.articleList.concat(res.data)
            })
          }
          resolve(res);
        })
        .catch(err => {
          console.log("获取当前用户发布过的帖子失败-->", err);
        })
    })
  },

  // 获取用户发布过的资源
  async getUserPublishResource() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('resource')
        .where({
          _openid: this.data.openid,
          isPass:true
        })
        .skip(this.data.resourceList.length)
        .limit(10)
        .get()
        .then(res => {
          console.log("获取当前用户发布过的资源成功-->", res.data);
          if (res.data.length === 0) {//加载完毕，暂无更多数据
            this.setData({
              isContinueGetResource: false//标记不再继续发送请求
            })
          } else {//还有数据
            this.setData({
              resourceList: this.data.resourceList.concat(res.data)
            })
          }
          resolve(res);
        })
        .catch(err => {
          console.log("获取当前用户发布过的资源失败-->", err);
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

    if (!this.data.isReal) return;

    wx.showLoading({
      title: '数据加载中...',
    })
    // 获取openid
    this.setData({
      openid: wx.getStorageSync('openid')
    })

    // 获取用户发布过的帖子
    const getArticleAns = await this.getUserPublishArticle();
    if (!getArticleAns) return;
    const getResourceAns = await this.getUserPublishResource();

    wx.hideLoading();
    console.log("发布过的帖子搜索完毕-->", this.data.articleList);
    console.log("发布过的资源搜索完毕-->", this.data.resourceList);


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



  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 判断当前用户点击的类别
    if (this.data.leftIndex === 0) {//发布的帖子
      if (this.data.isContinueGetArticle) {
        this.getUserPublishArticle();
      } else {
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    } else if (this.data.leftIndex === 1) {//发布的资源
      if (this.data.isContinueGetResource) {
        this.getUserPublishResource();
      } else {
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    }
  },
})