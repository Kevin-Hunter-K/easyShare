const app = getApp();
Page({
  data: {
    // 是否是真实页面的标记
    isReal: false,

    // 用户昵称
    userName: '点击头像登录',
    // 用户性别
    gender: 0,
    // 默认头像地址
    imageUrl: '../../image/default_img.png',

    // 点击选择
    list: [
      {
        name: '收藏',
        src: '../../image/collection.png',
        url: '/pages/user_collection/user_collection'
      },
      {
        name: '足迹',
        src: '../../image/footstep.png',
        url: '/pages/user_footstep/user_footstep'
      },
      // {
      //   name: '消息',
      //   src: '../../image/mes.png',
      //   url: '/pages/user_message/user_message'
      // },
      {
        name: '动态',
        src: '../../image/myshare.png',
        url: '/pages/user_share/user_share'
      }
    ],


    resource: []
  },

  // 右上角分享功能
  onShareAppMessage() {
    return {};
  },

  // 人脸识别登录
  faceLogin() {
    console.log("用户点击了人脸识别登录");
    //   尝试从本地中获取用户信息
    var userInfo = wx.getStorageSync('userInfo');
    console.log("缓存中的用户信息-->", userInfo);
    if (userInfo) {
      wx.showToast({
        title: '你已登录',
        icon: 'none',
        duration: 1500
      })
    } else {
      wx.navigateTo({
        url: '/pages/faceLogin/faceLogin',
      })
    }
  },


  // 人脸识别注册
  faceRegister() {
    console.log("用户点击了人脸识别注册");
    //   尝试从本地中获取用户信息
    var userInfo = wx.getStorageSync('userInfo');
    console.log("缓存中的用户信息-->", userInfo);
    if (!userInfo) {
      wx.showToast({
        title: '人脸识别注册需要先进行微信登录',
        icon: 'none',
        duration: 1500
      })
    } else {
      wx.navigateTo({
        url: '/pages/faceRegister/faceRegister',
      })
    }
  },

  // 弹窗获取用户信息并保存到本地缓存
  async getUserAcception() {
    try {
      const res = await wx.getUserProfile({
        desc: '授权'
      });
      console.log("用户授权获取的信息-->", res);
      const localUserInfo = res.userInfo;
      // 将用户信息保存到本地缓存
      wx.setStorageSync('localUserInfo', localUserInfo);
      // 保存到全局
      app.globalData.localUserInfo = localUserInfo;
      return localUserInfo; //返回用户信息
    } catch (err) {
      console.log("用户点击取消授权");
    }
  },


  // 在user表中根据openid搜索用户
  async searchUser(openid) {
    try {
      // 3 在数据库中的user表中查找当前的openid
      const res = await wx.cloud.database().collection('user').where({
        _openid: openid
      })
        .get();
      console.log("搜索user表成功");
      return res;
    } catch (err) {
      console.log("搜索user表出现错误");
      return err;
    }
  },


  // 获取图片信息
  async getImageInfo(imageUrl) {
    try {
      const res = await wx.getImageInfo({
        src: imageUrl,
      });
      return res;
    } catch (err) {
      console.log("获取头像图片信息失败", err);
    }
  },

  // 1 上传图片到云数据库
  // 上传文件(绑定文件名为fileFlag)
  async upLoadImage(filePath) {
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: filePath.slice(11), //根据图片的临时网址进行截取字符串作为图片名
        filePath: filePath, //图片的临时路径
      });
      console.log("图片上传成功,信息为-->", res)
      return res.fileID; //返回图片信息
    } catch (err) {
      console.log("图片上传失败-->", err)
      // 修改状态，标记任务执行异常
      this.setData({
        state: 1
      })
    }
  },


  // 新建一条用户数据
  async addUser(publisherName, publisherImageUrl, gender) {
    try {
      const res = await wx.cloud.database().collection('user')
        .add({
          data: {
            name: publisherName, //用户的微信昵称
            imageUrl: publisherImageUrl, //图片在数据库中的地址
            gender: gender,//性别
            // 为空数据的属性
            fans: [], //粉丝
            attention: [], //关注的用户
            collection: [], //收藏的帖子
            like: [],//点赞的帖子
            searchHistory: [],//搜索历史
            downLoadResource: [], //浏览过的资源，即点击过的资源
            scanArticleList: [],//浏览过的帖子，即点击过的帖子
          }
        });
      return res;
    } catch (err) {
      console.log("用户信息新建失败", err);
    }
  },

  // 更新用户昵称和头像数据，user数据表
  async updateUserInfo(openid, publisherName, publisherImageUrl) {
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: openid
        })
        .update({
          data: {
            name: publisherName, //用户的微信昵称
            imageUrl: publisherImageUrl, //图片在数据库中的地址
          }
        });
      wx.showToast({
        title: '登录成功',
        duration: 1500
      })
      return res;
    } catch (err) {
      console.log("用户信息更新失败", err);
    }
  },

  // 删除用户的旧头像
  async deleUserImage(fileID) {
    try {
      const res = await wx.cloud.deleteFile({
        fileList: [fileID]
      });
      return res;
    } catch (err) {
      console.log("用户头像删除失败", err);
    }
  },

  // 更新帖子的发布人昵称和头像
  async updateArticalInfo(openid, publisherName, publisherImageUrl) {
    try {
      const res = await wx.cloud.database().collection('article').where({
        _openid: openid
      }) 
        .update({
          data: {
            publisherName: publisherName,
            publisherImageUrl: publisherImageUrl
          }
        });
      console.log("该用户上传过的文章更新成功-->", res);
      return res;
    } catch (err) {
      console.log("该用户上传过的文章更新失败-->", err);
    }
  },

  // 更新评论的发布人昵称和头像
  async updateCommentInfo(openid, publisherName, publisherImageUrl) {
    try {
      const res = await wx.cloud.database().collection('comment').where({
        _openid: openid
      })
        .update({
          data: {
            publisherName: publisherName,
            publisherImageUrl: publisherImageUrl
          }
        });
      console.log("该用户发布过的评论更新成功-->", res);
      return res;
    } catch (err) {
      console.log("该用户发布过的评论更新失败-->", err);
    }
  },


  // ----------------------开始微信登录的处理----------------------------------------
  // 点击头像进行微信登录或者退出登录
  async wxLogin() {

    //   尝试从本地中获取用户信息
    var isLogin = wx.getStorageSync('userInfo');
    console.log("缓存中的用户信息-->", isLogin);
    //   判断是否已有本地缓存数据
    if (isLogin) { //已经登录，显示提示信息
      console.log("用户登录之后再次点击登录");
      wx.showToast({
        title: '你已登录',
        icon: 'none',
        duration: 1500
      })
      return;
    }


    // 弹窗获取用户信息授权
     var localUserInfo = await this.getUserAcception();
    if (!localUserInfo) {//点击了取消信息授权
      wx.showToast({
        title: '授权登录后才可以获取更多使用权限噢~',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    // 同意了信息授权
    wx.showLoading({
      title: '正在登录'
    })

    // 已经获取到用户信息
    // 尝试从缓存中获取openid
    var openid = wx.getStorageSync('openid');
    console.log("缓存中的openid-->", openid);
    // 判断是否已有缓存openid
    if (!openid) { //如果没有openid
      // 调用云函数获取openid
      const res = await wx.cloud.callFunction({
        name: 'getUserOpenid'
      });
      // 判断云函数是否调用成功
      if (!res) {
        console.log("调用云函数获取openid失败", res);
        return;
      }

      // 0 获取openid
      openid = res.result;
      // 1 将openid保存到本地缓存
      wx.setStorageSync('openid', openid);
      // 2 将openid保存到全局
      app.globalData.openid = openid;
      console.log("调用云函数获取openid,结果-->", openid);

      // 四. 根据openid搜索user集合表
      const searchAns = await this.searchUser(openid);
      console.log("搜索结果-->", searchAns);
      // 获取用户微信昵称
      const publisherName = localUserInfo.nickName; //昵称
      // 上传用户头像并获取用户微信头像地址
      const imageUrl = localUserInfo.avatarUrl;
      console.log("头像图片的网络地址-->", imageUrl);
      const getImageInfoAns = await this.getImageInfo(imageUrl);
      if (!getImageInfoAns) {
        console.log("获取头像图片信息失败");
        return;
      }
      console.log("获取头像图片信息成功-->", getImageInfoAns);
      const publisherImageUrl = await this.upLoadImage(getImageInfoAns.path); //头像地址
      // 判断是新建还是更新  用户的头像和昵称
      if (searchAns.data.length === 0) { //如果数据库的user表中没有该用户的数据，则新建一个用户的空白信息
        const ans = await this.addUser(publisherName, publisherImageUrl, localUserInfo.gender);
        console.log("当前用户在数据库user表中不存在,创建一条新的user数据-->", ans);
        if (!ans) return;
      } else { //如果数据库的user表中有该用户的数据，则更新用户的昵称和头像
        const fileID = searchAns.data[0].imageUrl;
        const deleAns = this.deleUserImage(fileID); //删除旧头像
        if (!deleAns) return;///考虑到用户体验问题，不删除旧头像，仅仅上传新头像

        // 更新帖子中的发布人头像和昵称
        const updateAns = await this.updateArticalInfo(openid, publisherName, publisherImageUrl);
        if (!updateAns) return;

        // 更新用户的评论
        const updateCommentAns = await this.updateCommentInfo(openid, publisherName, publisherImageUrl);
        if (!updateCommentAns) return;

        // 后期可以考虑将新头像更新到当前用户已经发表过的帖子当中，先获取帖子，再将新头像上传到云端数据库的地址更新到已经上传的帖子中
        const ans = await this.updateUserInfo(openid, publisherName, publisherImageUrl);
        console.log("当前用户在数据库user表中已存在,更新user的头像和昵称-->", ans);
        if (!ans) return;
      }
      var userInfo = { nickName: publisherName, imageUrl: publisherImageUrl, gender: localUserInfo.gender };
      console.log("处理后的用户信息--->", userInfo);
      this.setData({
        imageUrl: userInfo.imageUrl,//头像地址
        userName: userInfo.nickName,//用户昵称
        gender: userInfo.gender
      })
      // 将用户信息保存到本地缓存
      wx.setStorageSync('userInfo', userInfo);
      // 保存到全局
      app.globalData.userInfo = userInfo;
      wx.showToast({
        title: '登录成功',
        duration: 1500
      })
      this.onShow();//刷新页面
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
        })
    } else {
      this.setData({
        isReal: app.globalData.isReal
      })
    }
  },



  onShow: function () {
    // 从缓存中读取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    // 判断是否已经有用户信息
    if (userInfo) {
      console.log("已有缓存中的用户信息-->", userInfo);
      this.setData({
        imageUrl: userInfo.imageUrl,//头像地址
        userName: userInfo.nickName,//用户昵称
        gender: userInfo.gender
      })
    } else {
      console.log("缓存中没有用户信息");
      this.setData({
        imageUrl: '../../image/default_img.png',//默认头像地址
        userName: '点击头像登录',//昵称置空
        gender: 0
      })
    }
  },





  // 点击了收藏、足迹、消息、动态等按钮
  gotoPage(res) {
    //   尝试从本地中获取用户信息
    var userInfo = wx.getStorageSync('userInfo');
    console.log("缓存中的用户信息-->", userInfo);
    //   判断是否已有本地缓存数据
    if (!userInfo) { //没有本地用户信息
      wx.showToast({
        title: '授权登录后才可以获取更多使用权限噢~',
        icon: 'none'
      })
      return;//结束函数
    }

    const index = res.currentTarget.dataset.index;

    // // 暂未开放消息功能
    // if (index === 2) {
    //   wx.showToast({
    //     title: '该功能暂未开放',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return;
    // }

    const url = this.data.list[index].url;
    console.log("用户点击了-->", this.data.list[index].name);
    wx.navigateTo({
      url: url,
    })
  },

  // 用户协议
  gotoAgreement() {
    wx.navigateTo({
      url: '/pages/user_agreement/user_agreement',
    })
  },

  // 关于我们
  gotoAboutUs() {
    wx.navigateTo({
      url: '/pages/about_us/about_us',
    })
  },

  // 易班登录 
  yibanLogin() {
    wx.navigateTo({
      url: '/pages/yiban/yiban',
    })
  },

  // 切换身份
  async changeIdentity() {  
    wx.navigateTo({
      url: '/pages/admin/admin',
    })
  },

  // 退出登录
  exit() {
    // 从缓存中读取用户信息,判断用户是否已经退出登录
    const userInfo = wx.getStorageSync('userInfo');
    //   尝试从本地中获取用户信息
    const localUserInfo = wx.getStorageSync('localUserInfo');
    const yibanInfo = wx.getStorageSync('yibanInfo');
    console.log("缓存中的用户信息-->", localUserInfo);
    if (!localUserInfo && !userInfo && !yibanInfo) {
      wx.showToast({
        title: '您已退出登录',
        icon: 'none',
        duration: 1500
      })
      return;
    }


    wx.showModal({
      title: '温馨提示',
      content: '是否确认退出登录？',
      success: (res) => {
        console.log('退出登录弹框成功-->', res);
        if (res.confirm) {//确认退出登录，清除缓存
          wx.setStorageSync('openid', '');
          wx.setStorageSync('localUserInfo', '');
          wx.setStorageSync('userInfo', '');
          wx.setStorageSync('yibanInfo', '');
          app.globalData.openid = '';
          app.globalData.userInfo = '';
          app.globalData.localUserInfo = '';
          this.onShow();//刷新当前页面
        }
      }, fail: (err) => {
        console.log("退出登录弹框失败-->", err);
      }
    })
  },
})
