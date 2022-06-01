import { request } from "../../utils/request";
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 请求获取到的资源数组
    resource: [],
    // 标记是否可以继续发送请求
    isContinueGetResource: true,
    // 是否展示顶置图标的标志
    isShowUpImage: false,
    // 是否是真实页面的标记
    isReal: false,
  },


  // 更新帖子的通过审核状态
  updateResourcePass(id, isPass) {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('resource')
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
    await this.updateResourcePass(id, isPass);

    // 更新帖子列表
    this.setData({
      resource: this.data.resource.filter(item => item._id !== id)
    })
    wx.showToast({
      title: '操作成功'
    })
  },


  // 发送请求获取所有resource数据，并根据用户选择的索引进行赋值
  async getResourceList() {
    await wx.cloud.database().collection('resource')
      .where({ //查找已经通过审核的资源
        isCheck: false
      })
      .orderBy('time', 'asc')//按时间排序
      .skip(this.data.resource.length)
      .limit(10)//每次获取10条数据
      .get()
      .then(res => {
        if (res.data.length == 0) {
          this.setData({
            isContinueGetResource: false,
          })
        } else {
          this.setData({
            resource: [...this.data.resource, ...res.data]
          });
        }

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
    if (!this.data.isReal) return;//结束函数 

    wx.showLoading({
      title: '数据加载中...',
    })

    await this.getResourceList();

    wx.showToast({
      title: '加载成功',
      duration: 1500
    })


  },


  async onPullDownRefresh() {
    // 数据置空
    this.setData({
      resource: [],
      isContinueGetResource: true,
    })
    // 显示刷新
    wx.showLoading({
      title: '正在刷新...'
    })

    await this.getResourceList();
    // 数据请求完成之后结束下拉刷新
    wx.stopPullDownRefresh();//请求完成之后结束下拉动画
    wx.hideLoading();
    wx.showToast({
      title: '加载成功'
    })
  },


  async onReachBottom() {
    if (this.data.isContinueGetResource) {//可以继续请求数据
      await this.getResourceList();
    } else {//不继续请求数据
      wx.showToast({
        title: '暂无更多数据',
        icon: 'none'
      })
    }
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

  // 点击顶置
  up() {
    wx.pageScrollTo({
      scrollTop: 0 //顶置
    })
  },
})