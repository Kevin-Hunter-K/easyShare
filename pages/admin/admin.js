const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    ID: '',
    passWord: '',
    adminInfo: '',//管理员信息
    hasLogin: false,//判断是否登录
    // 是否是真实页面的标记
    isReal: false,
    isDeleCaChe: false,
    isDeleAdminCaChe: false,
    isArticlePass: false,
    isCommentPass: false,
    isResourcePass: false,
    versionId:'',
  },

  // 跳转到帖子审核页面
  checkArticle() {
    wx.navigateTo({
      url: '/pages/check_article/check_article',
    })
  },
  // 跳转到评论审核页面
  checkComment() {
    wx.navigateTo({
      url: '/pages/check_comment/check_comment',
    })
  },
  // 跳转到资源审核页面
  checkResource() {
    wx.navigateTo({
      url: '/pages/check_resource/check_resource',
    })
  },

  


  getID(res) {
    // console.log("账号-->", res.detail.value);
    this.setData({
      ID: res.detail.value
    })
  },

  getPassword(res) {
    // console.log("密码-->", res.detail.value);
    this.setData({
      passWord: res.detail.value
    })
  },

  deleID() {
    this.setData({
      ID: ''
    })
  },

  delePassWord() {
    this.setData({
      passWord: ''
    })
  },

  fail() {
    wx.showToast({
      title: '管理员登录失败',
      icon: 'none'
    })
    this.setData({
      ID: '',
      passWord: ''
    })
  },

  // 更新是否展示真实页面
  updateIsReal() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('deal')
        .doc(this.data.versionId)
        .update({
          data: {
            isReal: this.data.isReal
          }
        })
        .then(res => {
          console.log("是否展示真实页面修改成功-->", res);
          wx.showToast({
            title: '修改成功',
          })
          resolve(res);
        })
        .catch(err => {
          console.log("是否展示真实页面修改失败-->", err);
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          })
        })
    })
  },


  // 更新是否删除缓存
  updateIsDeleCaChe() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('deal')
        .doc(this.data.versionId)
        .update({
          data: {
            isDeleCaChe: this.data.isDeleCaChe
          }
        })
        .then(res => {
          console.log("是否删除缓存修改成功-->", res);
          wx.showToast({
            title: '修改成功',
          })
          resolve(res);
        })
        .catch(err => {
          console.log("是否删除缓存修改失败-->", err);
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          })
        })
    })
  },




  // 更新是否删除管理员登录缓存
  updateIsDeleAdminCaChe() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('deal')
        .doc(this.data.versionId)
        .update({
          data: {
            isDeleAdminCaChe: this.data.isDeleAdminCaChe
          }
        })
        .then(res => {
          console.log("是否删除管理员登录缓存修改成功-->", res);
          wx.showToast({
            title: '修改成功',
          })
          resolve(res);
        })
        .catch(err => {
          console.log("是否删除管理员登录缓存修改失败-->", err);
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          })
        })
    })
  },

  // 更新是否自动通过帖子审核
  updateIsArticlePass() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('deal')
        .doc(this.data.versionId)
        .update({
          data: {
            isArticlePass: this.data.isArticlePass
          }
        })
        .then(res => {
          console.log("是否自动通过帖子审核修改成功-->", res);
          wx.showToast({
            title: '修改成功',
          })
          resolve(res);
        })
        .catch(err => {
          console.log("是否自动通过帖子审核修改失败-->", err);
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          })
        })
    })
  },

  // 更新是否自动通过评论审核
  updateIsCommentPass() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('deal')
        .doc(this.data.versionId)
        .update({
          data: {
            isCommentPass: this.data.isCommentPass
          }
        })
        .then(res => {
          console.log("是否自动通过评论审核修改成功-->", res);
          wx.showToast({
            title: '修改成功',
          })
          resolve(res);
        })
        .catch(err => {
          console.log("是否自动通过评论审核修改失败-->", err);
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          })
        })
    })
  },

  // 更新是否自动通过资源审核
  updateIsResourcePass() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('deal')
        .doc(this.data.versionId)
        .update({
          data: {
            isResourcePass: this.data.isResourcePass
          }
        })
        .then(res => {
          console.log("是否自动通过资源审核修改成功-->", res);
          wx.showToast({
            title: '修改成功',
          })
          resolve(res);
        })
        .catch(err => {
          console.log("是否自动通过资源审核修改失败-->", err);
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          })
        })
    })
  },

  // 改变是否展示真实页面
  async changeIsReal(e) {
    console.log("是否展示真实页面-->", e.detail.value);
    this.setData({
      isReal: e.detail.value
    })
    const ans = await this.updateIsReal();
  },

  // 改变是否删除缓存
  async changeIsDeleCaChe(e) {
    console.log("是否删除缓存-->", e.detail.value);
    this.setData({
      isDeleCaChe: e.detail.value
    })
    const ans = await this.updateIsDeleCaChe();
  },

  // 改变是否删除管理员登录缓存
  async changeIsDeleAdminCaChe(e) {
    console.log("是否删除管理员登录缓存-->", e.detail.value);
    this.setData({
      isDeleAdminCaChe: e.detail.value
    })
    const ans = await this.updateIsDeleAdminCaChe();
  },

  // 改变是否自动通过帖子审核
  async changeIsArticlePass(e) {
    console.log("是否自动通过帖子审核-->", e.detail.value);
    this.setData({
      isArticlePass: e.detail.value
    })
    const ans = await this.updateIsArticlePass();
  },

  // 改变是否自动通过评论审核
  async changeIsCommentPass(e) {
    console.log("是否自动通过评论审核-->", e.detail.value);
    this.setData({
      isCommentPass: e.detail.value
    })
    const ans = await this.updateIsCommentPass();
  },

  // 改变是否自动通过资源审核
  async changeIsResourcePass(e) {
    console.log("是否自动通过资源审核-->", e.detail.value);
    this.setData({
      isResourcePass: e.detail.value
    })
    const ans = await this.updateIsResourcePass();
  },

  out() {
    wx.setStorageSync('adminInfo', '');
    wx.showToast({
      title: '退出登录',
      icon: 'none',
    })

    setTimeout(() => {
      wx.setStorageSync('adminInfo', '');
      // 返回上一个页面
      wx.navigateBack({
        delta: 1
      })
    }, 1200)
  },

  // 搜索管理员信息
  getAdmin() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('admin').where({
        ID: this.data.ID,
        passWord: this.data.passWord
      })
        .get()
        .then(res => {
          console.log("搜索管理员成功-->", res.data);
          if (res.data.length === 0) {
            this.fail();
          }
          resolve(res.data[0]);
        })
        .catch(err => {
          console.log("搜索管理员失败-->", err);
          this.fail();
        })
    })
  },

  // 登录
  async login() {
    const ID = this.data.ID;
    const passWord = this.data.passWord;
    if (ID.length === 0) {
      wx.showToast({
        title: '请输入账号',
        icon: 'none'
      })
      return;
    } else if (passWord.length === 0) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      })
      return;
    }

    wx.showLoading({
      title: '正在登录..',
    })

    // 获取管理员信息
    const adminInfo = await this.getAdmin();
    if (!adminInfo) return;

    // 点击登录后清空数据
    this.setData({
      ID: '',
      passWord: ''
    })

    wx.setStorageSync('adminInfo', adminInfo);
    wx.hideLoading();
    wx.showToast({
      title: '欢迎您 ' + adminInfo.name,
    })

    // ------------------------------登录成功后的处理--------------------------------
    setTimeout(() => {
      this.setData({
        adminInfo: adminInfo,
        hasLogin: true
      })
    }, 1500)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 加载版本信息
    await wx.cloud.database().collection('deal')
      .get()
      .then(res => {
        app.globalData.isReal = res.data[0].isReal;
        this.setData({
          versionId:res.data[0]._id,
          isReal: res.data[0].isReal,
          isDeleCaChe: res.data[0].isDeleCaChe,
          isDeleAdminCaChe: res.data[0].isDeleAdminCaChe,
          isArticlePass: res.data[0].isArticlePass,
          isCommentPass: res.data[0].isCommentPass,
          isResourcePass: res.data[0].isResourcePass
        })
        console.log("版本信息-->", res);
      })
    console.log("当前版本id-->", this.data.versionId);
    console.log("是否为真实页面-->", this.data.isReal);
    console.log("是否删除普通用户缓存-->", this.data.isDeleCaChe);
    console.log("是否删除管理员登录缓存-->", this.data.isDeleAdminCaChe);
    console.log("帖子是否自动通过审核-->", this.data.isArticlePass);
    console.log("评论是否自动通过审核-->", this.data.isCommentPass);
    console.log("资源是否自动通过审核-->", this.data.isResourcePass);

    const adminInfo = wx.getStorageSync('adminInfo');
    if (adminInfo) {
      this.setData({
        adminInfo: adminInfo,
        hasLogin: true
      })
    } else {
      this.setData({
        hasLogin: false
      })
    }
  },
})