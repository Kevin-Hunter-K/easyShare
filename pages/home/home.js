const app = getApp();
// pages/home/home.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

    // 是否是真实页面的标记
    isReal: false,

    // 轮播图数据
    swiperList: [],
    // 分类栏数据
    tabList: [{
      id: 0,
      isActive: true,
      title: "最新"
    },
    {
      id: 1,
      isActive: false,
      title: "热门"
    },
    {
      id: 2,
      isActive: false,
      title: "推荐"
    }
    ],

    // 分区
    leftMenu: ['#学习#', '#情感#', '#求助#', '#闲置#', '#寻物#', '#话题#'],

    // 最新帖子数组
    newArticleList: [],
    // 最热帖子数组
    hotArticleList: [],
    // 推荐帖子数组
    recommendArticleList: [],

    // 当前选择的分区索引
    leftIndex: 0, //默认为最新帖子
    // 是否展示顶置图标的标志
    isShowUpImage: false,
    // 判断是否继续请求帖子数据的标记
    isContinueGetNewArticle: true,
    isContinueGetHotArticle: true,
    isContinueGetRecommendArticle: true,
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

  // 右上角分享功能
  onShareAppMessage() {
    return {};
  },

  // 右上角分享朋友圈
  onShareTimeline() {
    return {};
  },

  // 弹窗提醒
  async select() {
    try {
      const res = wx.showModal({
        title: '温馨提示',
        content: '查看帖子详情需要先进行登录，是否跳转至登录页面？',
      });
      console.log("提醒授权弹窗成功-->", res);
      return res;
    } catch (err) {
      console.log("提醒授权弹窗失败-->", err);
    }
  },

  // 点击了帖子 (更新user数据，检验登录状态)
  async hitArticle(res) {
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
          title: '授权登录后才可以获取更多使用权限噢~',
          icon: 'none',
          duration: 1500
        })
      }
      return;//结束函数
    }



    // 获取帖子在数据库中的_id，便于搜索
    const id = res.currentTarget.dataset.id;
    console.log("点击的文章在数据库中的_id-->", id);
    // 跳转到帖子详情页面
    wx.navigateTo({
      url: '/pages/articleDetail/articleDetail?_id=' + id, //将文章的_id作为页面参数传过去
    })
  },

  // 点击顶置
  up() {
    wx.pageScrollTo({
      scrollTop: 0 //顶置
    })
  },

  // 点击轮播图片进行跳转
  async gotoImageDetail(res) {
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
          title: '授权登录后才可以获取更多使用权限噢~',
          icon: 'none',
          duration: 1500
        })
      }
      return;//结束函数
    }

    const url = res.currentTarget.dataset.url;
    console.log("点击轮播图片要跳转的文章id-->", url);
    wx.navigateTo({
      url: '../articleDetail/articleDetail?_id=' + url
    })
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
      leftIndex: index
    })

  },

  // 请求最新帖子数组
  async getNewData() {
    await wx.cloud.database().collection('article')
      .where({
        isPass: true
      })
      .orderBy('time', 'desc')//按时间排序
      .skip(this.data.newArticleList.length)
      .limit(10)//每次获取10条数据
      .get()
      .then(res => {
        if (res.data.length === 0) {//暂无更多数据
          this.setData({
            isContinueGetNewArticle: false//标记不再继续发送请求
          })
        } else {
          this.setData({
            newArticleList: [...this.data.newArticleList, ...res.data]
          })
        }

        console.log("请求获取到的最新帖子数组-->", res.data);
        console.log("当前最新帖子数组-->", this.data.newArticleList);
      })
  },

  // 请求热门帖子数据
  async getHotData() {
    await wx.cloud.database().collection('article')
      .where({
        isPass: true
      })
      .orderBy('scanNum', 'desc')
      .orderBy('time', 'desc')//按时间排序
      .skip(this.data.hotArticleList.length)
      .limit(10)//每次获取10条数据
      .get()
      .then(res => {
        if (res.data.length === 0) {//暂无更多数据
          this.setData({
            isContinueGetHotArticle: false//标记不再继续发送请求
          })
        } else {
          this.setData({
            hotArticleList: [...this.data.hotArticleList, ...res.data]
          })
        }

        console.log("请求获取到的热门帖子数组-->", res.data);
        console.log("当前热门帖子数组-->", this.data.hotArticleList);
      })
  },

  // 请求推荐帖子数据
  async getRecommendData() {
    await wx.cloud.database().collection('article')
      .where({
        isPass: true
      })
      .orderBy('likeNum', 'desc')
      .orderBy('time', 'desc')//按时间排序
      .skip(this.data.recommendArticleList.length)
      .limit(10)//每次获取10条数据
      .get()
      .then(res => {
        if (res.data.length === 0) {//暂无更多数据
          this.setData({
            isContinueGetRecommendArticle: false//标记不再继续发送请求
          })
        } else {
          this.setData({
            recommendArticleList: [...this.data.recommendArticleList, ...res.data]
          })
        }
        console.log("请求获取到的推荐帖子数组-->", res.data);
        console.log("当前推荐帖子数组-->", this.data.recommendArticleList);
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
          app.globalData.isArticlePass = res.data[0].isArticlePass;
          app.globalData.isResourcePass = res.data[0].isResourcePass;
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



    // 发送请求获取轮播图数据
    await wx.cloud.database().collection("swiperList").get()
      .then(res => {
        this.setData({
          swiperList: res.data
        })
        console.log("请求回来的轮播图数组-->", this.data.swiperList);
      })


    if (!this.data.isReal) {
      this.getResourceList();
      return;//结束函数
    }

    wx.showLoading({
      title: '数据加载中...',
    })

    // 每一栏先请求回10条数据
    await this.getNewData();
    await this.getHotData();
    await this.getRecommendData();
    wx.hideLoading();
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





  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    // 数据置空
    this.setData({
      newArticleList: [],
      hotArticleList: [],
      recommendArticleList: [],
      isContinueGetNewArticle: true,
      isContinueGetHotArticle: true,
      isContinueGetRecommendArticle: true
    })
    // 显示刷新
    wx.showLoading({
      title: '正在刷新...'
    })
    //  请求轮播图数据
    await wx.cloud.database().collection("swiperList").get()
      .then(res => {
        this.setData({
          swiperList: res.data
        })
        console.log("请求回来的轮播图数组-->", this.data.swiperList);
      })

    await this.getNewData();
    await this.getHotData();
    await this.getRecommendData();
    // 数据请求完成之后结束下拉刷新
    wx.stopPullDownRefresh();//请求完成之后结束下拉动画
    wx.hideLoading();
    wx.showToast({
      title: '加载成功',
      duration: 1500
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  async onReachBottom() {
    // 判断当前用户点击的类别
    if (this.data.leftIndex === 0) {//最新的帖子
      if (this.data.isContinueGetNewArticle) {//可以继续请求数据
        await this.getNewData();//发送请求
      } else {//不继续请求数据
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    } else if (this.data.leftIndex === 1) {//最热帖子数组
      if (this.data.isContinueGetHotArticle) {//可以继续请求数据
        await this.getHotData();//发送请求
      } else {//不继续请求数据
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    } else if (this.data.leftIndex === 2) {//推荐帖子
      if (this.data.isContinueGetRecommendArticle) {//可以继续请求数据
        await this.getRecommendData();//发送请求
      } else {//不继续请求数据
        wx.showToast({
          title: '暂无更多数据',
          icon: 'none'
        })
      }
    }
  },











  // 发送请求获取所有resource数据，并根据用户选择的索引进行赋值
  async getResourceList() {
    await wx.cloud.database().collection('resource')
      .where({ //查找已经通过审核的资源
        isPass: true
      })
      .get()
      .then(res => {
        this.setData({
          resource: res.data,
        });
        // 数据请求完成之后结束下拉刷新
        wx.stopPullDownRefresh();
        wx.hideLoading();
        console.log("资源数据获取成功-->", this.data.resource);

      })
      .catch(err => {
        console.log("资源数据获取失败-->", err);
        wx.showToast({
          title: '数据加载错误',
          icon: 'none',
          duration: 2000
        })
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
      wx.showToast({ //显示打开成功
        title: '打开成功'
      })
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
  },
})