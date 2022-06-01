const app = getApp();
Page({
  data: {
    // 分区
    leftMenu: ['未选择', '学习区', '情感区', '求助区', '闲置区', '寻物区', '话题区'],
    // 分区索引
    leftIndex: 0,
    // 输入的标题
    title: '',
    // 输入的内容
    content: '',
    // 选择的视频的临时路径
    videoPath: '',

    // 是否是真实页面的标记
    isReal: false,
    // 帖子是否自动通过审核
    isArticlePass: false,
  },



  // 获取输入的标题内容
  sigleInput(res) {
    console.log("标题内容-->", res.detail.value);
    this.setData({
      title: res.detail.value
    })
  },

  // 获取描述的帖子内容
  multiInput(res) {
    console.log("描述的帖子内容-->", res.detail.value);
    this.setData({
      content: res.detail.value
    })
  },

  // 获取选择器的索引,注意选择器返回的数据类型是string
  bindPickerChange(res) {
    console.log('picker选择了-->', this.data.leftMenu[res.detail.value])
    this.setData({
      leftIndex: parseInt(res.detail.value)
    })
  },

  // 从相册选择或者拍摄视频
  chooseVideo() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: res => {
        console.log("选择的视频的临时路径-->", res.tempFilePath);
        this.setData({
          videoPath: res.tempFilePath
        })
      },
      fail: (err) => {
        console.log("取消了选择视频", err);
      }
    })
  },



  // 点击删除视频
  deleVideo(res) {
    this.setData({
      videoPath: ''
    })
  },

  // 个位数补齐十位数
  setTimeDateFmt(s) {
    return s < 10 ? '0' + s : s;
  },

  // 获取上传时间
  getTimeString() {
    const now = new Date()
    let month = now.getMonth() + 1
    let day = now.getDate()
    let hour = now.getHours()
    let minutes = now.getMinutes()
    month = this.setTimeDateFmt(month)
    day = this.setTimeDateFmt(day)
    hour = this.setTimeDateFmt(hour)
    minutes = this.setTimeDateFmt(minutes)
    let time = now.getFullYear().toString() + '-' + month.toString() + '-' + day + ' ' + hour + ':' + minutes;
    return time; //返回时间
  },


  fail() {
    wx.showToast({
      title: '上传失败',
      icon: 'none'
    })
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

  // 1 上传视频到云数据库
  // 上传文件(绑定文件名为fileFlag)
  async upLoadImage(filePath) {
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: filePath.slice(11), //根据视频的临时网址进行截取字符串作为视频名
        filePath: filePath, //视频的临时路径
      });
      console.log("视频上传成功,信息为-->", res)
      return res.fileID; //返回视频信息
    } catch (err) {
      console.log("视频上传失败-->", err);
      this.fail();
    }
  },

  // 2 上传帖子到数据库的artical表
  // 属性：(上传时间，点赞量，浏览量，收藏量，
  // 存放评论的数组（每条评论包括了评论人（openid）的头像，昵称，评论时间，点赞量，对每条评论个的回复），
  // 发帖人的昵称，微信头像，标题，主题内容，视频在云数据库中的地址数组)
  async addArticle(time, publisherName, publisherImageUrl, fileID) {
    try {
      const res = await wx.cloud.database().collection('article')
        .add({
          data: {
            scanNum: 0, //浏览量
            likeNum: 0, //点赞量
            collectionNum: 0, //收藏量

            time: time, //上传时间
            publisherName: publisherName, //发布人微信昵称
            publisherImageUrl: publisherImageUrl, //发布人微信头像

            title: this.data.title, //帖子标题
            content: this.data.content, //帖子内容
            imageList: this.data.imageCloudPath, //帖子附带的视频在云数据库的地址数组
            videoUrl: fileID,//此处上传问题帖子，没有视频
            imgOrVideoFlag: fileID.length > 0 ? -1 : 0,//如果有上传视频，则为1，否则为0
            class: this.data.leftIndex - 1, //类别
            hasNewMes: false,//默认帖子没有新的消息，如果有其他用户进行评论或点赞，则修改标记为true，当创建者点击信息查看后，再修改为false
            isPass: this.data.isArticlePass, //审核默认通过
            isCheck:this.data.isArticlePass ? true : false,//是否经过审核
          }
        });
      return res;
    } catch (err) {
      console.log("文章添加失败", err);
      this.fail();
    }
  },

  // 上传成功之后的处理
  AfterDeal(flag) {
    this.setData({
      leftIndex: 0,
      title: '',
      content: '',
      imageInfo: [],
      imageCloudPath: [],
    }, () => {
      if (flag === 1) {//发布成功
        if(this.data.isArticlePass){
          wx.showToast({
            title: '发布成功',
            duration: 1500
          })
        }else{
          wx.showToast({
            title: '您的帖子正待后台管理员审核\r\n通过审核后即可显示',
            icon:'none'
          })
        }
      } else {
        wx.showToast({
          title: '取消发布',
          icon: 'none',
          duration: 1500
        })
      }
      setTimeout(() => {
        // 返回上一个页面
        wx.navigateBack({
          delta: 1
        })
      }, 1500)
    })
  },



  async select() {
    try {
      const res = wx.showModal({
        title: '温馨提示',
        content: '发布需要先进行登录，是否跳转至登录页面？',
      });
      console.log("发布提醒授权弹窗成功-->", res);
      return res;
    } catch (err) {
      console.log("发布提醒授权弹窗失败-->", err);
    }
  },


  // ------------------------------发布的逻辑处理--------------------------------
  async deal() {
    console.log("点击了done,以下对当前已有数据进行判断，如果合法则上传帖子");
    // 三.判断帖子是否合法
    // 1 判断标题
    if (this.data.title.length === 0) {
      console.log("标题为空");
      wx.showToast({
        title: '请输入帖子标题...',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    // 2 判断帖子内容
    if (this.data.content.length === 0) {
      console.log("帖子内容为空");
      wx.showToast({
        title: '请输入帖子内容...',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    // 3 判断帖子视频
    if (this.data.videoPath.length === 0) {
      console.log("选择内容为空");
      wx.showToast({
        title: '请选择帖子视频...',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    // 4 判断帖子所属科目类别
    if (this.data.leftIndex === 0) {
      console.log("所属分区为空");
      wx.showToast({
        title: '请选择所属分区...',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    // 4 提示上传中
    wx.showLoading({
      title: '上传中..',
      mask: true
    })

    // 3.每次循环上传一次视频(如果上传失败，则state为1)  异步请求同步化
    const fileID = await this.upLoadImage(this.data.videoPath);
    if (!fileID) return;

    // 在artical表中添加文章
    // (上传时间，点赞量，浏览量，收藏量，存放评论的数组（每条评论包括了评论人（openid）的头像，昵称，评论时间，点赞量，对每条评论个的回复），
    // 发帖人的昵称，微信头像，标题，主题内容，视频在云数据库中的地址数组)
    const openid = wx.getStorageSync('openid');
    const searchAns = await this.searchUser(openid);
    console.log("搜索结果-->", searchAns);
    const time = this.getTimeString(); // 获取当前时间
    const publisherName = searchAns.data[0].name; //昵称
    const publisherImageUrl = searchAns.data[0].imageUrl; //从全局获取头像云地址数据
    const addAns = await this.addArticle(time, publisherName, publisherImageUrl, fileID);
    // 获取文章上传后在数据库中自动生成的唯一列表_id
    console.log("文章上传成功后返回的数据-->", addAns);
    if (!addAns) {
      wx.showToast({
        title: '文章上传失败',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    this.AfterDeal(1);//发布成功的处理
  },


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
            isReal: res.data[0].isReal,
            isArticlePass: res.data[0].isArticlePass
          })
        })
    } else {
      this.setData({
        isReal: app.globalData.isReal,
        isArticlePass: app.globalData.isArticlePass
      })
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
        this.AfterDeal(0);//发布失败的处理
      }
    }
  },



})