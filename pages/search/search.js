const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabList: [{
      id: 0,
      isActive: true,
      title: "帖子"
    },
    {
      id: 1,
      isActive: false,
      title: "资源"
    }
    ],

    // 当前被点击的栏
    leftIndex: 0, //默认为学习区
    isReal: false,//是否为真实页面
    articleList: [],//搜索到的帖子数组
    resourceList: [],//搜索到的资源数组
    searchContent: '',//输入的搜索关键字
    openid: '',//openid
    searchHistory: [],//搜索历史
    // 是否展示顶置图标的标志
    isShowUpImage: false,
    // 判断是否继续请求帖子数据的标记
    isContinueGetArticle: true,
    // 判断是否继续请求资源数据的标记
    isContinueGetResource: true,
  },

  // 获取搜索的关键字
  getInput(res) {
    // console.log("搜索的关键字-->", res.detail.value);
    this.setData({
      searchContent: res.detail.value
    })
  },

  // 选择了搜索历史项
  async chooseHistoryItem(res) {
    const content = res.currentTarget.dataset.content;
    console.log("选择了搜索历史中的-->", content);

    // 数据置空
    this.setData({
      isContinueGetArticle: true,
      isContinueGetResource: true,
      articleList: [],
      resourceList: [],
      searchContent: content
    })

    // 模糊搜索帖子和资源
    const searchArticleAns = await this.searchArticle();
    if (!searchArticleAns) return;

    const searchResourceAns = await this.searchResource();
    if (!searchResourceAns) return;

    // 清空搜索关键字
    this.setData({
      searchContent: '',
    })
  },


  // 点击搜索
  async hitSearch() {
    if (this.data.searchContent.length === 0) {
      wx.showToast({
        title: "请输入关键字",
        icon: 'none'
      })
      console.log("搜索内容为空")
      return;
    }

    console.log("输入搜索-->", this.data.searchContent);
    // 数据置空
    this.setData({
      isContinueGetArticle: true,
      isContinueGetResource: true,
      articleList: [],
      resourceList: [],
    })

    // 模糊搜索帖子和资源
    const searchArticleAns = await this.searchArticle();
    if (!searchArticleAns) return;

    const searchResourceAns = await this.searchResource();
    if (!searchResourceAns) return;

    if (this.data.searchContent.length > 0) {
      // 添加搜索记录
      this.setData({
        searchHistory: this.data.searchHistory.concat(this.data.searchContent)
      })
      // 更新到user表中
      const addHistoryAns = this.updateUserSearchHistory();
    }

    // 清空搜索关键字
    this.setData({
      searchContent: ""
    })
  },

  // 点击清空搜索历史
  async clearHistory() {
    // 置空
    this.setData({
      searchHistory: []
    })
    const clearAns = await this.updateUserSearchHistory();
    if (!clearAns) {
      wx.showToast({
        title: '清空历史记录失败',
        icon: 'none'
      })
      console.log("清空历史失败");
      return;
    } else {
      wx.showToast({
        title: '清空历史记录成功',
        icon: 'none'
      })
    }
  },

  // 更新用户的搜索历史
  async updateUserSearchHistory() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('user')
        .where({
          _openid: this.data.openid
        })
        .update({
          data: {
            searchHistory: this.data.searchHistory
          }
        })
        .then(res => {
          console.log("更新用户的搜索历史成功-->", res);
          resolve(res);
        })
        .catch(err => {
          console.log("更新用户搜索历史失败-->", err);
        })
    })
  },


  // 获取用户的搜索历史
  async getUserSearchHistory() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('user')
        .where({
          _openid: this.data.openid
        })
        .get()
        .then(res => {
          console.log("搜索user表成功,用户的搜索历史-->", res.data[0].searchHistory);
          this.setData({
            searchHistory: res.data[0].searchHistory
          })
          resolve(res);
        })
        .catch(err => {
          console.log("搜索user表出现错误");
        })
    })
  },

  // 模糊搜索帖子
  async searchArticle() {
    return new Promise((resolve, reject) => {
      let db = wx.cloud.database();
      let _ = wx.cloud.database().command;
      wx.cloud.database().collection('article')
        .where(_.or([
          {//标题
            title: db.RegExp({
              regexp: this.data.searchContent,
              option: 'i',
            })
          },
          {//帖子内容
            content: db.RegExp({
              regexp: this.data.searchContent,
              option: 'i',
            })
          }
        ]))
        .skip(this.data.articleList.length)
        .limit(10)
        .get()
        .then(res => {
          console.log("模糊搜索帖子成功-->", res.data);
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
          console.log("模糊搜索帖子失败-->", err);
        })
    })
  },

  // 模糊搜索资源
  async searchResource() {
    return new Promise((resolve, reject) => {
      let db = wx.cloud.database();
      let _ = wx.cloud.database().command;
      wx.cloud.database().collection('resource')
        .where(_.or([
          {//标题
            title: db.RegExp({
              regexp: this.data.searchContent,
              option: 'i',
            })
          },
          {//资源描述
            description: db.RegExp({
              regexp: this.data.searchContent,
              option: 'i',
            })
          },
          {//资源题目
            fileName: db.RegExp({
              regexp: this.data.searchContent,
              option: 'i',
            })
          },
        ]))
        .skip(this.data.resourceList.length)
        .limit(10)
        .get()
        .then(res => {
          console.log("模糊搜索资源成功-->", res.data);
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
          console.log("模糊搜索资源失败-->", err);
        })
    })
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

  // 触底加载
  onReachBottom: function () {
    // 判断当前用户点击的类别
    if (this.data.leftIndex === 0) {//发布的帖子
      if (this.data.isContinueGetArticle) {
        this.searchArticle();
      } else {
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    } else if (this.data.leftIndex === 1) {//发布的资源
      if (this.data.isContinueGetResource) {
        this.searchResource();
      } else {
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    }
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
          console.log("版本信息-->", res);
        })
    } else {
      this.setData({
        isReal: app.globalData.isReal
      })
      console.log("是否为真实页面-->", this.data.isReal);
    }


    if (!this.data.isReal) return;

    // 获取openid
    const openid = wx.getStorageSync('openid');
    this.setData({
      openid: openid
    })
    // 获取用户的搜索历史
    const getUserSearchHistoryAns = await this.getUserSearchHistory();
    if (!getUserSearchHistoryAns) return;
  },

  async select() {
    try {
      const res = wx.showModal({
        title: '温馨提示',
        content: '搜索需要先进行登录，是否跳转至登录页面？',
      });
      console.log("发布提醒授权弹窗成功-->", res);
      return res;
    } catch (err) {
      console.log("发布提醒授权弹窗失败-->", err);
    }
  },


  async onShow() {
    //   尝试从本地中获取用户信息
    var userInfo = wx.getStorageSync('userInfo');
    console.log("缓存中的用户信息-->", userInfo);
    //   判断是否已有本地缓存数据
    if (!userInfo) { //没有本地用户信息
      const selectAns = await this.select();//弹框让用户选择
      if (!selectAns) return;//弹窗失败
      if (selectAns.confirm) {//用户点击了确定跳转
        wx.switchTab({
          url: '/pages/my/my',// 跳转到我的页面引导用户授权登录
        })
      } else {
        wx.showToast({
          title: '取消搜索',
          icon: 'none',
          duration: 1500
        })
        setTimeout(() => {
          // 返回上一个页面
          wx.navigateBack({
            delta: 1
          })
        }, 1200)
      }
    }
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


  // 点击顶置
  up() {
    wx.pageScrollTo({
      scrollTop: 0 //顶置
    })
  },
})