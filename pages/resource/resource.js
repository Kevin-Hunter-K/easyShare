const app = getApp();
Page({
  data: {
    // 左侧菜单栏数据
    leftMenu: [
      "计算机类", //0
      "语文类", //1
      "数学类", //2
      "英语类", //3
      "物理类", //4
      "思政类", //5
      "化学类", //6
      "生物类", //7
      // 可添加类别9、10、11
      "其他" //-1  [].length-1  对接数据的时候进行判断
    ],
    // 右侧栏的试卷资源分类和电子书资源
    rightMenuType: [
      "试卷复习资料", //0
      "电子书资源" //1
    ],
    // 左侧栏选中的索引
    leftIndex: 0, //默认为第一个
    // 右侧栏中种类的索引
    rightIndex: 0,
    // 资源数据
    resource: [
      [
        [],
        []
      ],
      [
        [],
        []
      ],
      [
        [],
        []
      ],
      [
        [],
        []
      ],
      [
        [],
        []
      ],
      [
        [],
        []
      ],
      [
        [],
        []
      ],
      [
        [],
        []
      ],
      [
        [],
        []
      ]
    ], //18个分类
    // 标记当前栏是否第一次被点击
    isFirstHit: [
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true]
    ], //18个标记
    // 标记
    isContinueGetResource: [
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true],
      [true, true]
    ], //18个标记
    // 要展示的资源数组
    list: [],
    // 是否展示顶置图标的标志
    isShowUpImage: false,
    // 标记是否是管理员
    isAdmin: false,

  },

  // 右上角分享功能
  onShareAppMessage() {
    return {
      title: '资源分类'
    };
  },

  // 删除资源数据
  deleResource(id) {
    return new Promise((resolve, reject) => {
      wx.cloud.database().collection('resource').where({
          _id: id
        })
        .remove()
        .then(res => {
          console.log("删除资源成功-->", res);
          resolve(res);
        })
        .catch(err => {
          console.log("删除资源失败-->", err);
          wx.showToast({
            title: '删除失败',
            icon: 'none'
          })
        })
    })
  },

  // 删除文档资源
  async deleFile(fileList) {
    try {
      const res = await wx.cloud.deleteFile({
        fileList: fileList
      });
      console.log("删除文件成功", res);
      return res;
    } catch (err) {
      console.log("删除失败", err);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  },

  // 弹窗提醒
  async selectDele() {
    try {
      const res = wx.showModal({
        title: '警告',
        content: '删除操作不可撤销，是否继续？',
        confirmColor: '#FF0000',
      });
      return res;
    } catch (err) {}
  },


  // 点击删除资源
  async hitDeleResource(res) {
    const selectAns = await this.selectDele(); //弹框让用户选择
    if (!selectAns) return; //弹窗失败
    if (selectAns.cancel) { //用户点击了取消
      return;
    }

    const id = res.currentTarget.dataset.id;
    const fileCloudPath = [res.currentTarget.dataset.filepath];
    // console.log(id);
    // console.log(fileCloudPath)
    wx.showLoading({
      title: '删除中...',
    })
    await this.deleResource(id);
    await this.deleFile(fileCloudPath);
    wx.showToast({
      title: '删除成功',
    })
  },

  // 修改左侧的索引   class对应数据库的属性
  //表示文件所属科目: -1==其他（默认）0==计算机类 1==语文类 2==数学类 3==英语类 4==物理类 5==思政类 6==化学类 7==生物类
  async hitLeft(res) {
    const leftIndex = res.currentTarget.dataset.index; //分类的索引
    const rightIndex = this.data.rightIndex; //试卷或者资源的索引
    console.log("左侧栏点击的索引-->", leftIndex);
    if (this.data.isFirstHit[leftIndex][rightIndex]) { //如果是的第一次点击当前栏,则发送请求加载数据
      await this.getResourceList(leftIndex, rightIndex);
      this.setData({
        [`isFirstHit[${leftIndex}][${rightIndex}]`]: false //标记当前栏已经被点击过了
      })
    }
    this.setData({
      leftIndex: leftIndex,
      list: this.data.resource[leftIndex][rightIndex] //修改要展示的资源数组
    })
  },

  // 修改选择右侧的索引  sign
  //表示资源种类：试卷为0，电子书为1
  async hitRight(res) {
    const leftIndex = this.data.leftIndex;
    const rightIndex = res.currentTarget.dataset.index;
    console.log("右侧栏点击的索引-->", rightIndex);

    if (this.data.isFirstHit[leftIndex][rightIndex]) { //如果是的第一次点击当前栏,则发送请求加载数据
      await this.getResourceList(leftIndex, rightIndex);
      this.setData({
        [`isFirstHit[${leftIndex}][${rightIndex}]`]: false //标记当前栏已经被点击过了
      })
    }
    this.setData({
      rightIndex: rightIndex,
      list: this.data.resource[this.data.leftIndex][rightIndex]
    })
  },

  async getResourceList(i, j) {
    await wx.cloud.database().collection('resource')
      .where({ //查找已经通过审核的资源
        class: i === this.data.leftMenu.length - 1 ? -1 : i, //学科类别
        sign: j, //试卷或者电子书
        isPass: true //通过审核
      })
      .orderBy('time', 'desc') //按时间排序
      .skip(this.data.resource[i][j].length)
      .limit(8) //每次获取8条数据
      .get()
      .then(res => {
        if (res.data.length === 0) { //暂无更多数据
          this.setData({
            [`isContinueGetResource[${i}][${j}]`]: false //标记当前分区不再继续发送请求
          })
        } else {
          this.setData({
            [`resource[${i}][${j}]`]: this.data.resource[i][j].concat(res.data)
          });
        }

        console.log("请求获取到", this.data.leftMenu[i], this.data.rightMenuType[j], "的资源数组-->", res.data);
        console.log("当前", this.data.leftMenu[i], this.data.rightMenuType[j], "的资源数组-->", this.data.resource[i][j]);
      })
      .catch(err => {
        console.log("资源数据获取失败-->", err);
        wx.showToast({
          title: '数据加载错误',
          icon: 'none'
        })
      })
  },



  // 弹窗提醒
  async select() {
    try {
      const res = wx.showModal({
        title: '温馨提示',
        content: '查看资源详情需要先进行登录，是否跳转至登录页面？',
      });
      console.log("提醒授权弹窗成功-->", res);
      return res;
    } catch (err) {
      console.log("提醒授权弹窗失败-->", err);
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

  // 更新资源的浏览数据
  async updateResource(id, scanNum) {
    try {
      // 更新数据库resource集合，更新资源的scanNum
      const res = await wx.cloud.database().collection('resource')
        .doc(id) //根据_id查找单条数据
        .update({
          data: {
            scanNum: scanNum + 1 //浏览量自增
          }
        });
      console.log("资源数据更新成功,点击的数据为-->", res);
      return res;
    } catch (err) {
      console.log("资源数据更新失败,点击的数据为-->", err);
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

  // 更新用户下载过的资源数组
  async updateUserInfo(openid, downLoadResource) {
    try {
      const res = await wx.cloud.database().collection('user')
        .where({
          _openid: openid
        })
        .update({
          data: {
            downLoadResource: downLoadResource
          }
        });
      console.log("用户浏览过的资源数组信息更新成功", res);
      return res;
    } catch (err) {
      console.log("用户浏览过的资源数组信息更新失败", err);
    }
  },

  // 点击打开文件
  async hitFile(res) {
    console.log("点击事件获取的数据-->", res);
    // 获取点击文件的云地址和 数据库中自动生成的唯一数据标识 _id
    const cloudPath = res.currentTarget.dataset.cloudpath;
    const id = res.currentTarget.dataset.id;
    const scanNum = res.currentTarget.dataset.scannum;

    //   尝试从本地中获取用户信息
    var userInfo = wx.getStorageSync('userInfo');
    console.log("缓存中的用户信息-->", userInfo);
    //   判断是否已有本地缓存数据
    if (!userInfo) { //没有本地用户信息
      const selectAns = await this.select(); //弹框让用户选择
      if (selectAns.confirm) { //用户点击了确定跳转
        wx.switchTab({
          url: '/pages/my/my', // 跳转到我的页面引导用户授权登录
        })
      } else {
        wx.showToast({
          title: '授权登录后才可以获取更多使用权限噢~',
          icon: 'none',
          duration: 1500
        })
      }
      return; //结束函数
    }

    wx.showLoading({
      title: '正在打开...',
      mask: true
    })
    // 下载资源文件
    const downLoadFileAns = await this.downFile(cloudPath);
    if (!downLoadFileAns) return; //结束函数

    // 获取下载成功的临时路径
    const tempPath = downLoadFileAns.tempFilePath;
    console.log("文件的临时链接-->", tempPath);
    // 打开资源文件
    const openFileAns = await this.openFile(tempPath);
    if (!openFileAns) return; //结束函数

    // 更新资源的浏览数据scanNum
    const updateAns = await this.updateResource(id, scanNum);

    // 搜索用户浏览过资源的数据
    const openid = wx.getStorageSync('openid');
    const searchUserAns = await this.searchUser(openid);
    var downLoadResource = searchUserAns.downLoadResource;
    // console.log("原来的数组-->", downLoadResource);
    downLoadResource = downLoadResource.filter(item => item !== id); //过滤
    // console.log("资源过滤后的数组-->", downLoadResource);
    downLoadResource.push(id); //重新将新浏览过的资源压入数组中
    // console.log("最终的数组-->", downLoadResource);
    // 更新用户浏览过的资源数据
    const updateUserAns = await this.updateUserInfo(openid, downLoadResource);
  },


  // 页面初始化
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

    if (!this.data.isReal) {
      return; //结束函数
    }

    if (wx.getStorageSync('adminInfo')) {
      this.setData({
        isAdmin: true
      })
    }


    wx.showLoading({
      title: '数据加载中...',
    })
    // 进入页面第一次加载数据
    await this.getResourceList(0, 0);
    // 给要展示的资源数组赋值
    this.setData({
      list: this.data.resource[0][0],
      [`isFirstHit[${0}][${0}]`]: false //标记当前栏已经被点击过了
    })
    wx.hideLoading();
    wx.showToast({
      title: '加载成功',
      duration: 1500
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


  // 下拉刷新
  async pullDownRefresh() {
    // 重置数据
    this.setData({
      isFirstHit: [
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true]
      ], //18个标记
      isContinueGetResource: [
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true],
        [true, true]
      ], //18个标记
      resource: [
        [
          [],
          []
        ],
        [
          [],
          []
        ],
        [
          [],
          []
        ],
        [
          [],
          []
        ],
        [
          [],
          []
        ],
        [
          [],
          []
        ],
        [
          [],
          []
        ],
        [
          [],
          []
        ],
        [
          [],
          []
        ]
      ] //18个分类
    })

    wx.showLoading({
      title: '正在刷新...'
    })

    const leftIndex = this.data.leftIndex;
    const rightIndex = this.data.rightIndex;
    await this.getResourceList(leftIndex, rightIndex); //请求当前栏的数据

    // 给要展示的资源数组赋值
    this.setData({
      [`isFirstHit[${leftIndex}][${rightIndex}]`]: false,
      list: this.data.resource[leftIndex][rightIndex],
      triggered: false //数据加载完成之后停止下拉刷新动画
    })
    wx.hideLoading();
    wx.showToast({
      title: '加载成功',
      duration: 1500
    })
  },


  // 触底加载数据
  async hitBottom() {
    const index_x = this.data.leftIndex;
    const index_y = this.data.rightIndex;
    const isContinueGetResource = this.data.isContinueGetResource[index_x][index_y];
    if (isContinueGetResource) {
      await this.getResourceList(index_x, index_y);
      this.setData({ //修改当前要展示的资源数组
        list: this.data.resource[index_x][index_y]
      })
    } else {
      wx.showToast({
        title: '暂无更多数据',
        icon: 'none'
      })
    }
  },

  // 点击顶置
  up() {
    this.setData({
      scrollTop: 0 //顶置
    })
  },


  // 监听滚动事件
  srcollPrograss(e) {
    if (e.detail.scrollTop > 100) {
      this.setData({
        isShowUpImage: true
      })
    } else {
      this.setData({
        isShowUpImage: false
      })
    }
  },

})