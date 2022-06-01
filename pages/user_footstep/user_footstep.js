const app = getApp();
Page({

  data: {
    tabList: [{
      id: 0,
      isActive: true,
      title: "浏览的帖子"
    },
    {
      id: 1,
      isActive: false,
      title: "浏览的资源"
    }
    ],

    // 当前被点击的栏
    leftIndex: 0, //默认为学习区
    openid: '',
    // 搜索失败的帖子
    articleFailList: [],
    // 搜索失败的资源
    resourceFailList: [],

    // 用户浏览过的帖子数组
    scanArticleList: [],
    // 用户浏览过的资源数组
    downLoadResource: [],
    // 搜索到的帖子数组
    articleList: [],
    // 搜索到的资源数组
    resourceList: [],
    // 是否展示顶置图标的标志
    isShowUpImage: false,
    // 分区
    leftMenu: ['#学习#', '#情感#', '#求助#', '#闲置#', '#寻物#', '#话题#'],

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
          articleList: [...this.data.articleList, article]
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

  // 根据_id搜索每一条资源
  async getResource(resourceID) {
    try {
      const res = await wx.cloud.database().collection('resource')
        .doc(resourceID)
        .get();
      const resource = res.data;
      console.log("当前的资源搜索成功-->", resource);
      // 将搜索到的数据保存到data中
      if (resource) {
        this.setData({
          resourceList: [...this.data.resourceList, resource]
        })
      }
      return res;
    } catch (err) {
      this.setData({
        resourceFailList: this.data.resourceFailList.concat(resourceID)
      })
      console.log("当前的资源搜索失败-->", err);
    }
  },


  // 获取用户浏览过的帖子和资源数据
  async getUserScanList(openid) {
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: openid
        })
        .get();
      this.setData({
        scanArticleList: res.data[0].scanArticleList,
        downLoadResource: res.data[0].downLoadResource,
      })
      console.log("发送请求获取用户浏览过的帖子数组成功-->", this.data.scanArticleList);
      console.log("发送请求获取用户浏览过的资源数组成功-->", this.data.downLoadResource);
      return res;
    } catch (err) {
      console.log("发送请求获取用户浏览过的帖子数组失败-->", err);
    }
  },

  updateScanList() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('user')
        .where({
          _openid: this.data.openid
        })
        .update({
          data: {
            scanArticleList: this.data.scanArticleList,
            downLoadResource: this.data.downLoadResource
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
    const openid = wx.getStorageSync('openid');
    this.setData({
      openid: openid
    })
    // 获取用户浏览过的帖子数组
    const getArticleAns = await this.getUserScanList(openid);
    if (!getArticleAns) return;


    // 搜索每一条发布过的帖子
    var scanArticleList = this.data.scanArticleList;
    var len = this.data.articleList.length;
    for (let i = len; i < len + 10 && i < scanArticleList.length; i++)
      await this.getArticle(scanArticleList[i]);

    // 搜索每一条发布过的资源
    var downLoadResource = this.data.downLoadResource;
    len = this.data.resourceList.length;
    for (let i = len; i < len + 10 && i < downLoadResource.length; i++)
      await this.getResource(downLoadResource[i]);


    wx.hideLoading();


    // 搜索完毕，对用户的帖子足迹数组去重
    for (let i = 0; i < this.data.articleFailList.length; i++) {
      for (let j = 0; j < scanArticleList.length; j++) {
        scanArticleList = scanArticleList.filter(item => item !== this.data.articleFailList[i]);
      }
    }
    // 搜索完毕，对用户的资源足迹数组去重
    for (let i = 0; i < this.data.resourceFailList.length; i++) {
      for (let j = 0; j < downLoadResource.length; j++) {
        downLoadResource = downLoadResource.filter(item => item !== this.data.resourceFailList[i]);
      }
    }
    this.setData({
      scanArticleList: scanArticleList,
      downLoadResource: downLoadResource
    })

    // 发送请求更新用户的浏览数据
    await this.updateScanList();

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  async onReachBottom() {
    if (this.data.leftIndex === 0) {
      if (this.data.isContinueGetArticle) {
        wx.showLoading({
          title: '数据加载中...',
        })
        // 搜索每一条发布过的帖子
        var scanArticleList = this.data.scanArticleList;
        var len = this.data.articleList.length;//当前已获取到的帖子数组长度
        for (let i = len; i < len + 10; i++) {
          if (i >= scanArticleList.length) {//暂无更多数据
            this.setData({
              isContinueGetArticle: false//标记不再继续发送请求
            })
            break;
          } else {
            await this.getArticle(scanArticleList[i]);
          }
        }
        wx.hideLoading();
        // 搜索完毕，对用户的帖子足迹数组去重
        for (let i = 0; i < this.data.articleFailList.length; i++) {
          for (let j = 0; j < scanArticleList.length; j++) {
            scanArticleList = scanArticleList.filter(item => item !== this.data.articleFailList[i]);
          }
        }
        this.setData({
          scanArticleList: scanArticleList
        })
        // 发送请求更新用户的浏览数据
        await this.updateScanList();
      } else {//不再继续请求帖子数据
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    } else if (this.data.leftIndex === 1) {
      if (this.data.isContinueGetResource) {
        wx.showLoading({
          title: '数据加载中...',
        })
        // 搜索每一条发布过的资源
        var downLoadResource = this.data.downLoadResource;
        const len = this.data.resourceList.length;
        for (let i = len; i < len + 10; i++) {
          if (i >= downLoadResource.length) {
            this.setData({
              isContinueGetResource: false//标记不再继续发送请求
            })
            break;
          } else {
            await this.getResource(downLoadResource[i]);
          }
        }
        wx.hideLoading();
        // 搜索完毕，对用户的资源足迹数组去重
        for (let i = 0; i < this.data.resourceFailList.length; i++) {
          for (let j = 0; j < downLoadResource.length; j++) {
            downLoadResource = downLoadResource.filter(item => item !== this.data.resourceFailList[i]);
          }
        }
        this.setData({
          downLoadResource: downLoadResource
        })
        // 发送请求更新用户的浏览数据
        await this.updateScanList();

      } else {//不再继续请求资源数据
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
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