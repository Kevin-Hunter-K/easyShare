const app = getApp();
Page({

  data: {
    // 分区
    leftMenu: ['#学习#', '#情感#', '#求助#', '#闲置#', '#寻物#', '#话题#'],

    // 图标点击
    icon: [
      {
        name: '写评论',
        isActive: true,
        selectPath: '../../image/write_comment.png',
        selectedPath: '../../image/write_comment.png',
      },
      {
        name: '收藏',
        isActive: false,
        selectPath: '../../image/collection_1.png',
        selectedPath: '../../image/collection_1_ed.png',
      },
      {
        name: '点赞',
        isActive: false,
        selectPath: '../../image/like.png',
        selectedPath: '../../image/like_ed.png',
      },
    ],

    // 当前被点击的帖子
    article: '',
    // 显示的时间字符串
    scanAndTime: '',
    // 帖子附带的图片数组
    imageList: [],
    // 文章的唯一id
    articleID: '',
    // 帖子的点赞量
    likeNum: 0,
    // 浏览量
    scanNum: 0,
    // 收藏量
    collectionNum: 0,
    // 评论
    comment: [],
    // 是否已收藏当前帖子
    isCollection: false,
    // 是否已点赞当前帖子
    isLike: false,
    // 用户点赞过的帖子
    like: [],
    // 用户收藏过对的帖子
    collection: [],
    // openid
    openid: '',
    // 是否是真实页面的标记
    isReal: false,
    isContinueGetNewArticle: true,

    // 评论是否自动通过审核
    isCommentPass: false,
    // 标记是否是管理员
    isAdmin: false,
  },

  // 右上角分享功能
  onShareAppMessage() {
    return {
      title: '帖子详情',
      // path: '/page/user?id=123',
      // imageUrl: 
    }
  },

  // 右上角分享朋友圈
  onShareTimeline() {
    return {};
  },


  // 弹窗提醒
  async select() {
    try {
      const res = wx.showModal({
        title: '警告',
        content: '删除操作不可撤销，是否继续？',
        confirmColor: '#FF0000',
      });
      return res;
    } catch (err) {
    }
  },


  // 删除帖子
  deleArticle() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('article').where({
        _id: this.data.articleID
      })
        .remove()
        .then(res => {
          console.log("删除帖子成功-->", res);
          resolve(res);
        })
        .catch(err => {
          console.log("删除帖子失败-->", err);
        })
    })
  },

  // 删除帖子的所有评论
  deleComment() {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('comment').where({
        articleIndex: this.data.articleID
      })
        .remove()
        .then(res => {
          console.log("删除评论成功-->", res);
          resolve(res);
        })
        .catch(err => {
          console.log("删除评论失败-->", err);
        })
    })
  },

  // 删除指定某条评论
  deleOneComment(id) {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('comment')
        .doc(id)
        .remove()
        .then(res => {
          console.log("删除单条评论成功-->", res);
          resolve(res);
        })
        .catch(err => {
          console.log("删除单条评论失败-->", err);
        })
    })
  },

  // 删除帖子的图片或视频
  async deleFile(fileList) {
    try {
      const res = await wx.cloud.deleteFile({
        fileList: fileList
      });
      console.log("删除文件成功", res);
      return res;
    } catch (err) {
      console.log("删除失败", err);
    }
  },

  // 点击删除单条评论
  async hitDeleComment(res) {
    const selectAns = await this.select();//弹框让用户选择
    if (!selectAns) return;//弹窗失败
    if (selectAns.cancel) {//用户点击了取消
      return;
    }
    wx.showLoading({
      title: '删除中...',
    })
    const id = res.currentTarget.dataset.id;
    // 删除单条评论
    await this.deleOneComment(id);
    // 更新评论列表
    this.setData({
      comment: this.data.comment.filter(item => item._id !== id)
    })
    wx.showToast({
      title: '删除成功'
    })
  },

  // 点击删除当前帖子
  async hitDeleArticle() {
    const selectAns = await this.select();//弹框让用户选择
    if (!selectAns) return;//弹窗失败
    if (selectAns.cancel) {//用户点击了取消
      return;
    }
    wx.showLoading({
      title: '删除中...',
    })
    // 删除帖子
    await this.deleArticle();
    // 删除评论
    if (this.data.comment.length > 0) {
      await this.deleComment();
    }
    // 删除视频
    if (this.data.article.videoUrl) {
      const fileList = [this.data.article.videoUrl];
      await this.deleFile(fileList);
    }
    // 删除图片
    if (this.data.imageList && this.data.imageList.length > 0) {
      const fileList = this.data.imageList;
      await this.deleFile(fileList);
    }
    wx.showToast({
      title: '删除成功'
    })
    setTimeout(() => {
      // 返回上一个页面
      wx.navigateBack({
        delta: 1
      })
    }, 1200)
  },

  // 点击预览图片
  previewImage(res) {
    // 被点击的图片的索引
    const index = res.currentTarget.dataset.index;
    // 调用预览图片接口
    wx.previewImage({
      urls: this.data.imageList, //图片数组
      current: this.data.imageList[index] //当前要预览的图片
    })
  },


  // 点击弹窗编写评论
  writeComment() {
    wx.showModal({
      title: '编辑评论',
      editable: true,
      cancelText: '取消评论',
      confirmText: '发布评论',
      placeholderText: '输入你的评论...',
      success: (res) => {
        if (res.confirm) {//确认发布
          console.log("输入的评论的内容-->", res.content);
          if (res.content === '') {
            wx.showToast({
              title: '输入不合法 评论失败',
              icon: 'none'
            })
            return;
          }
          // 调用发布评论
          this.addComment(res.content);
        }
      },
      faile: (err) => {
        console.log("弹框失败", err);
      }
    })
  },


  // 点击投诉
  complain() {

  },

  // 更新单条评论中的点赞数组
  async updateCommentLike(id, likeList) {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('comment')
        .doc(id)
        .update({
          data: {
            likeList: likeList
          }
        })
        .then(res => {
          console.log("更新的单条评论的点赞数组成功-->", res);
          resolve(res);
        })
        .catch(err => {
          console.log("更新的单条评论的点赞数组失败-->", err);
        })
    })
  },

  // 点赞单条评论
  async hitCommentLike(res) {
    const id = res.currentTarget.dataset.id;//当前评论的唯一标识 _id
    const index = res.currentTarget.dataset.index;//在评论数组中的下标
    console.log("被点赞的评论的唯一id-->", id);
    console.log("被点赞的评论的的下标-->", index);
    // 获取当前评论的点赞数组
    var commentLikeList = await this.getCommentLike(id);
    // 判断当前评论是否被当前用户点赞
    if (this.data.comment[index].isLike) {//如果当前评论已经被当前用户点赞，则取消点赞
      // 取消点赞当前的帖子
      commentLikeList = commentLikeList.filter(item => item !== this.data.openid);
      // 根据id更新到comment表
      const updateCommentAns = await this.updateCommentLike(id, commentLikeList);
      // 取消点赞图标
      this.setData({
        [`comment[${index}].isLike`]: false,
        [`comment[${index}].likeList`]: commentLikeList
      })
      wx.showToast({
        title: '取消点赞',
        icon: 'none'
      })
    } else {
      // 添加点赞当前的帖子
      commentLikeList = [...commentLikeList, this.data.openid];
      // 根据id更新到comment表
      const updateCommentAns = await this.updateCommentLike(id, commentLikeList);
      // 显示点赞图标
      this.setData({
        [`comment[${index}].isLike`]: true,
        [`comment[${index}].likeList`]: commentLikeList
      })
      wx.showToast({
        title: '点赞成功',
        icon: 'none'
      })
    }
  },

  // 获取单条评论的点赞数组
  async getCommentLike(id) {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('comment')
        .doc(id)
        .get()
        .then(res => {
          console.log("获取的单条评论的点赞数组成功-->", res.data.likeList);
          resolve(res.data.likeList);
        })
        .catch(err => {
          console.log("获取的单条评论的点赞数组失败-->", err);
        })
    })
  },

  // 收藏帖子
  async hitCollection() {
    if (this.data.isCollection) {//已经收藏
      // 更新user表中用户收藏过的帖子
      // 去除当前的articleID
      this.setData({
        collection: this.data.collection.filter(item => item !== this.data.articleID),
        isCollection: false,
        collectionNum: this.data.collectionNum - 1,
      })
      const updateAns = await this.updateUserCollection();
      if (!updateAns) return;
      // 更新article表中帖子的收藏数
      const updateArticleCollectionNumAns = await this.updateArticleCollectionNum();

      wx.showToast({
        title: '取消收藏',
        icon: 'none'
      })
    } else {//没有收藏
      this.setData({
        collection: [...this.data.collection, this.data.articleID],
        isCollection: true,
        collectionNum: this.data.collectionNum + 1
      })
      // 更新user表中用户收藏过的帖子
      const updateAns = await this.updateUserCollection();
      if (!updateAns) return;

      // 更新article表中帖子的收藏数
      const updateArticleCollectionNumAns = await this.updateArticleCollectionNum();

      wx.showToast({
        title: '收藏成功',
        icon: 'none'
      })
    }

  },

  // 点赞帖子
  async hitLike() {
    if (this.data.isLike) {//已经点赞
      // 更新user表中用户点赞过的帖子
      // 去除当前的articleID
      this.setData({
        like: this.data.like.filter(item => item !== this.data.articleID),
        isLike: false,
        likeNum: this.data.likeNum - 1,
      })
      const updateAns = await this.updateUserLike();
      if (!updateAns) return;
      // 更新article表中帖子的点赞数
      const updateArticleLikeNumAns = await this.updateArticleLikeNum();

      wx.showToast({
        title: '取消点赞',
        icon: 'none'
      })
    } else {//没有点赞
      this.setData({
        like: [...this.data.like, this.data.articleID],
        isLike: true,
        likeNum: this.data.likeNum + 1
      })
      // 更新user表中用户点赞过的帖子
      const updateAns = await this.updateUserLike();
      if (!updateAns) return;

      // 更新article表中帖子的点赞数
      const updateArticleLikeNumAns = await this.updateArticleLikeNum();

      wx.showToast({
        title: '点赞成功',
        icon: 'none'
      })
    }
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


  // 发布评论，添加一条数据到comment表
  async addComment(commentContent) {
    wx.showLoading({
      title: '发布中...',
    })
    // 获取当前用户的信息
    const userInfo = wx.getStorageSync('userInfo');
    try {
      const res = await wx.cloud.database().collection('comment')
        .add({
          data: {
            articleIndex: this.data.articleID,//所属文章的唯一ID
            publisherName: userInfo.nickName,//发布人的昵称
            publisherImageUrl: userInfo.imageUrl,//发布人的头像
            content: commentContent,//评论内容
            time: this.getTimeString(),//当前时间
            likeList: [],//点赞过当前评论的用户的openid数组
            isPass: this.data.isCommentPass,//是否自动通过审核
            isCheck: this.data.isCommentPass ? true : false,//是否经过审核
          }
        });
      console.log("添加评论成功", res);
      if (this.data.isCommentPass) {
        wx.showToast({
          title: '评论成功',
        })
      } else {
        wx.showToast({
          title: '您的评论正待后台管理员审核\r\n通过审核后即可显示',
          icon: 'none'
        })
      }

      // 更新
      // 获取评论
      const getCommentAns = await this.getComment();
      if (!getCommentAns) return;
    } catch (err) {
      console.log("添加评论失败", err)
    }
  },

  // 搜索当前帖子的评论
  async getComment() {
    try {
      const res = await wx.cloud.database().collection('comment')
        .where({
          articleIndex: this.data.articleID,
          isPass: true
        })
        .orderBy('time', 'asc')//按时间排序
        .skip(this.data.comment.length)
        .limit(10)//每次获取10条数据
        .get();
      console.log("获取到的评论-->", res.data);
      if (res.data.length === 0) {//暂无更多数据
        this.setData({
          isContinueGetNewArticle: false//标记不再继续发送请求
        })
      } else {
        // 获取当前帖子的所有评论
        var comment = res.data;
        // 遍历每一条评论，判断评论是否被当前用户点赞过
        for (var i = 0; i < comment.length; i++) {
          // 在点赞数组中搜索当前用户
          const findAns = comment[i].likeList.find((item) => {
            return item === this.data.openid
          });
          console.log('查找结果-->', findAns);
          comment[i].isLike = findAns ? true : false;
          // 根据搜索结果对每条评论是否被当前用户点赞做标记
        }
        this.setData({
          comment: this.data.comment.concat(comment)
        })
      }
      return res;
    } catch (err) {
      console.log("获取评论失败-->", err);
    }
  },

  async onReachBottom() {
    if (this.data.isContinueGetNewArticle) {//可以继续请求数据
      await this.getComment();//发送请求
    } else {//不继续请求数据
      wx.showToast({
        title: '暂无更多数据',
        icon: 'none'
      })
    }
  },

  // 搜索帖子内容详情
  async getArticle(articleID) {
    try {
      const res = await wx.cloud.database().collection('article')
        .doc(articleID)
        .get();
      const article = res.data;
      console.log("当前的帖子搜索成功-->", article);
      // 将搜索到的数据保存到data中
      this.setData({
        articleID: articleID,//文章的唯一id
        article: article,//帖子数据
        imageList: article.imageList,//保存图片数据
        likeNum: article.likeNum,//帖子当前的点击量
        scanNum: article.scanNum + 1,//帖子当前的浏览量
        collectionNum: article.collectionNum,//帖子的收藏量
        scanAndTime: article.scanNum + 1 + ' 阅读 / ' + article.time//时间数据
      })
      wx.hideLoading();
      return res;
    } catch (err) {
      console.log("当前的帖子搜索失败-->", err);
      wx.showToast({
        title: '加载错误',
        icon: 'none'
      })
    }
  },

  // 更新帖子的浏览量
  async updateArticle(articleID) {
    try {
      const res = await wx.cloud.database().collection('article')
        .doc(articleID)
        .update({
          data: {
            scanNum: this.data.scanNum
          }
        });
      console.log("帖子的浏览量更新成功-->", res);
      return res;
    } catch (err) {
      console.log("帖子的浏览量更新失败-->", err);
    }
  },

  // 更新帖子的点赞量
  async updateArticleLikeNum() {
    try {
      const res = await wx.cloud.database().collection('article')
        .doc(this.data.articleID)
        .update({
          data: {
            likeNum: this.data.likeNum
          }
        });
      console.log("帖子的点赞量更新成功-->", res);
      return res;
    } catch (err) {
      console.log("帖子的点赞量更新失败-->", err);
    }
  },

  // 更新帖子的收藏量
  async updateArticleCollectionNum() {
    try {
      const res = await wx.cloud.database().collection('article')
        .doc(this.data.articleID)
        .update({
          data: {
            collectionNum: this.data.collectionNum
          }
        });
      console.log("帖子的收藏量更新成功-->", res);
      return res;
    } catch (err) {
      console.log("帖子的收藏量更新失败-->", err);
    }
  },

  // 搜索用户数据
  async searchUser(openid) {
    // 获取用户信息中的浏览资源记录
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: openid
        })
        .get();
      console.log("搜索用户数据成功-->", res.data[0]);
      return res.data[0];
    } catch (err) {
      console.log("搜索用户数据失败-->", err);
    }
  },

  // 更新用户浏览过的帖子
  async updateUserInfo(openid, scanArticleList) {
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: openid
        })
        .update({
          data: {
            scanArticleList: scanArticleList
          }
        });
      console.log("用户浏览过的帖子数组信息更新成功", res);
      return res;
    } catch (err) {
      console.log("用户浏览过的帖子数组信息更新失败", err);
    }
  },

  // 更新用户点赞过的帖子
  async updateUserLike() {
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: this.data.openid
        })
        .update({
          data: {
            like: this.data.like
          }
        });

      console.log("用户点赞过的帖子数组信息更新成功", res);
      return res;
    } catch (err) {
      console.log("用户点赞过的帖子数组信息更新失败", err);
    }
  },

  // 更新用户收藏过的帖子
  async updateUserCollection() {
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: this.data.openid
        })
        .update({
          data: {
            collection: this.data.collection
          }
        });
      console.log("用户收藏过的帖子数组信息更新成功", res);
      return res;
    } catch (err) {
      console.log("用户收藏过的帖子数组信息更新失败", err);
    }
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
          app.globalData.isCommentPass = res.data[0].isCommentPass;
          this.setData({
            isReal: res.data[0].isReal,
            isCommentPass: res.data[0].isCommentPass
          })
          console.log("版本信息-->", res);
        })
    } else {
      this.setData({
        isReal: app.globalData.isReal,
        isCommentPass: app.globalData.isCommentPass
      })
      console.log("是否为真实页面-->", this.data.isReal);
    }


    if (!this.data.isReal) return;//结束函数

    if (wx.getStorageSync('adminInfo')) {
      this.setData({
        isAdmin: true
      })
    }

    // 获取帖子的唯一id
    const articleID = options._id;
    console.log("被点击的帖子的唯一id-->", articleID);
    this.setData({
      articleID
    })
    wx.showLoading({
      title: '数据加载中..'
    })
    const openid = wx.getStorageSync('openid');
    this.setData({
      openid: openid
    })

    // 根据articleID搜索数据库中的帖子
    const getArticleAns = await this.getArticle(articleID);
    if (!getArticleAns) return;
    // 获取评论
    const getCommentAns = await this.getComment();
    if (!getCommentAns) return;
    // 更新帖子点击量
    const updateArticleAns = await this.updateArticle(articleID);
    // 搜索用户浏览过资源的数据

    const searchUserAns = await this.searchUser(openid);
    var scanArticleList = searchUserAns.scanArticleList;
    // console.log("原来的数组-->", scanArticleList);
    scanArticleList = scanArticleList.filter(item => item !== articleID);//过滤
    // console.log("资源过滤后的数组-->", scanArticleList);
    scanArticleList.push(articleID);//重新将新浏览过的资源压入数组中
    // console.log("最终的数组-->", scanArticleList);
    // 更新用户浏览过的帖子数据
    const updateUserAns = await this.updateUserInfo(openid, scanArticleList);

    // 获取用户收藏过的帖子数组
    var collectionList = searchUserAns.collection;
    console.log("用户收藏的帖子-->", collectionList);
    // 检索数组，判断是否收藏过当前帖子
    if (collectionList.length > 0) {
      const index = collectionList.filter(item => item === articleID);//如果点赞过，则返回的数组长度为1
      console.log("是否收藏的检索结果-->", index);
      if (index.length === 1) {//收藏过当前帖子
        this.setData({
          isCollection: true
        })
      }
    }
    // 用户点赞过的帖子数组
    var likeList = searchUserAns.like;
    console.log("用户点赞过的帖子-->", likeList);
    // 检索数组，判断是否点赞过当前帖子
    if (likeList.length > 0) {
      const index = likeList.filter(item => item === articleID);//如果点赞过，则返回的数组长度为1
      console.log("是否点赞的检索结果-->", index);
      if (index.length === 1) {//点赞过当前帖子
        this.setData({
          isLike: true
        })
      }
    }
    // 保存用户点赞过的数组和收藏过的帖子数组
    this.setData({
      like: likeList,
      collection: collectionList
    })
  },


  /**
* 生命周期函数--监听页面显示
*/
  async onShow() {
    // 加载版本信息
    await wx.cloud.database().collection('deal')
      .get()
      .then(res => {
        app.globalData.isReal = res.data[0].isReal;
        app.globalData.isArticlePass = res.data[0].isArticlePass;
        app.globalData.isResourcePass = res.data[0].isResourcePass;
        app.globalData.isCommentPass = res.data[0].isCommentPass;
      })
  },



  // 点击关注
  hitAttention() {
    wx.showToast({
      title: '该功能暂未开放',
      icon: 'none',
      duration: 1500
    })
  },
})