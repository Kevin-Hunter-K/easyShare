const app = getApp();
Page({
  data: {
    // -1==其他（默认）0==计算机类 1==语文类 2==数学类 3==英语类 4==物理类 5==思政类 6==化学类 7==生物类
    leftMenu: ['未选择', '计算机类', '语文类', '数学类', '英语类', '物理类', '思政类', '化学类', '生物类', '其他'],

    // 右侧栏的试卷资源分类和电子书资源
    rightMenuType: [{
      type: "试卷复习资料", //0
      checked: 'true' //默认选中,其余无该属性不选中
    },
    {
      type: "电子书资源", //1
    },
    ],

    // 文件类型
    fileType: [ //0==doc 1==docx 2==pdf 3==ppt 4==pptx 5==xls 6==xlsx
      // 限制能上传的文件类型，openDocument
      // 文档类
      ".doc",
      ".docx",
      ".pdf",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx"
    ],

    // 所属科目的索引
    leftIndex: 0,
    // 资源种类的索引
    rightIndex: 0,
    // 输入的标题
    title: '',
    // 输入的描述内容
    description: '',
    // 文件信息，自行加入文件标识
    fileInfo: [],
    // 是否是真实页面的标记
    isReal: false,
    // 成功上传的资源文件数组
    successUpLoadList: [],
    // 资源是否自动通过审核
    isResourcePass:false,
  },



  // 获取输入的标题内容
  sigleInput(res) {
    console.log("标题内容-->", res.detail.value);
    this.setData({
      title: res.detail.value
    })
  },

  // 获取描述的资源内容
  multiInput(res) {
    console.log("描述的资源内容-->", res.detail.value);
    this.setData({
      description: res.detail.value
    })
  },

  // 获取单选框的索引,注意单选框返回的数据类型是string
  getRadioIndex(res) {
    console.log("radio选择了-->", this.data.rightMenuType[res.detail.value]);
    // console.log("类型-->",typeof(res.detail.value));
    this.setData({
      rightIndex: parseInt(res.detail.value)
    })
  },

  // 获取选择器的索引,注意选择器返回的数据类型是string
  bindPickerChange(res) {
    console.log('picker选择了-->', this.data.leftMenu[res.detail.value])
    this.setData({
      leftIndex: parseInt(res.detail.value)
    })
  },

  // 个位数补齐十位数
  setTimeDateFmt(s) {
    return s < 10 ? '0' + s : s;
  },

  // 生成随机数并且查询随机数是否可以作为文件的唯一标识
  randomNumber() {
    // 将6位随机数字+年月日时分秒作为随机数字
    const now = new Date()
    let month = now.getMonth() + 1
    let day = now.getDate()
    let hour = now.getHours()
    let minutes = now.getMinutes()
    let seconds = now.getSeconds()
    month = this.setTimeDateFmt(month)
    day = this.setTimeDateFmt(day)
    hour = this.setTimeDateFmt(hour)
    minutes = this.setTimeDateFmt(minutes)
    seconds = this.setTimeDateFmt(seconds)
    let randomNum = (Math.round(Math.random() * 1000000)).toString() + '_' + now.getFullYear().toString() + month.toString() + day + hour + minutes + seconds;
    return randomNum; //返回唯一标识随机数
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

  // 同步化查询数据库中唯一标识是否已经存在
  // 将异步请求同步化
  async getRandomNumber(fileTypeIndex) {
    // 尝试获取唯一标识   //给标识添加文件后缀名
    const randomNum = this.randomNumber() + this.data.fileType[fileTypeIndex];
    // 发送请求查询唯一标识是否已经存在
    try {
      const db = wx.cloud.database();
      const res = await db.collection('resource').where({
        fileFlag: randomNum
      })
        .get();
      console.log("数据库resource查询成功-->", res);
      // 唯一标识已经存在,递归重新生成唯一标识返回
      if (res.data.length !== 0) {
        return this.getRandomNumber(); //返回重新生成的唯一标识
      }
      // 唯一标识在数据库中不存在，返回唯一标识
      return randomNum;
    } catch (err) { //请求出现错误
      console.log("数据库resource查询错误-->", err);
    }
  },

  // 选择文件并筛选符合条件的文件
  chooseFile() {
    // 本地获取文件选择要上传的文件，保存文件信息
    wx.chooseMessageFile({
      count: 5, //自定义最多上传多少个文件(0-100)
      type: 'file', //只能上传除了图片和视频的文件
    })
      .then(res => {
        console.log("文件信息-->", res);
        // return;
        // 处理选择的文件
        //当前选择的文件个数
        const fileInfo = res.tempFiles;
        const tempFailInfo = []; //临时数组，存放符合条件的文件信息和文件类型的索引
        const len = fileInfo.length;
        var i;
        // 统计上传失败的文件名
        var failedFile = '第';
        var successNum = 0; //统计上传成功的文件数目

        // 循环开始
        for (i = 0; i < len; i++) {

          // 1 获取文件的本地路径和文件名
          const filePath = fileInfo[i].path;
          const fileName = fileInfo[i].name;
          console.log("文件名为-->", fileName);
          // 2 获取文件类型的索引
          const fileTypeIndex = this.filterFile(fileName);
          console.log(i, "文件类型的索引-->", fileTypeIndex);
          // 3 筛选上传的文件类型，符合类型才可以上传
          if (fileTypeIndex === -1) { //不符合
            const t = i + 1;
            console.log("所上传的文件类型不符合要求-->", t); //跳过
            failedFile = failedFile + ' ' + t + ' '; //字符串拼接
          } else { //符合
            tempFailInfo[successNum] = fileInfo[i];
            // 4 自行加入属性faileTypeIndex到文件信息中
            tempFailInfo[successNum].fileTypeIndex = fileTypeIndex;
            // 5 成功上传的文件数目自增
            successNum++;
          }
        }
        // 循环结束
        // 1 拼接可以上传的文件数组
        this.setData({
          fileInfo: [...this.data.fileInfo, ...tempFailInfo]
        })

        // 2 判断是否所有文件上传成功
        if (successNum !== len) {
          if (successNum > 0) //部分成功
            failedFile = failedFile + "个文件类型不符合要求  仅支持上传文档资源"
          else
            failedFile = "全部文件类型不符合要求 仅支持上传文档资源"
          wx.showToast({
            title: failedFile,
            icon: 'none',
            duration: 2000
          })
        }
      })
      .catch(err => {
        console.log("取消选择文件", err)
      })
  },

  // 点击删除文件
  deleFile(res) {
    const index = res.currentTarget.dataset.index;
    console.log("点击删除文件的索引为-->", index);
    // 创建临时文件信息
    var tempFailInfo = this.data.fileInfo;
    // 根据删除的索引修改临时文件信息
    tempFailInfo.splice(index, 1);
    // 还原文件信息
    this.setData({
      fileInfo: tempFailInfo
    })
  },


  // 上传文件(绑定文件名为fileFlag)
  async upLoadFile(fileFlag, filePath) {
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: fileFlag,
        filePath: filePath,
      });
      console.log("文件上传成功,信息为-->", res)
      return res; //返回文件信息
    } catch (err) {
      console.log("文件上传失败-->", err)
    }
  },

  // 更新云数据库中的resource集合
  // 需要在集合中添加对象，属性包括
  // fileName fileCloudPath fileFlag 上传文件时必要的信息
  // scanNum downLoadNum  likeNum 用户更新
  // sign class 用户上传时选择对应的参数
  async addResourceGroup(fileName, fileFlag, fileCloudPath, time, fileTypeIndex, sizeString) {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('resource')
        .add({
          data: {
            fileName: fileName, //文件原名称
            fileFlag: fileFlag, //文件的唯一标志
            fileCloudPath: fileCloudPath, //文件在数据库中的地址
            scanNum: 0, //浏览量
            time: time, //上传时间


            fileType: fileTypeIndex, //文件类型的索引，方便判断渲染画面
            sizeString: sizeString, //文件的大小和类型字符串，方便判断渲染画面

            // 管理员审核标识
            isPass: this.data.isResourcePass, //是否通过审核，默认自动通过，后期添加管理员版块再进行设置
            isCheck:this.data.isResourcePass ? true : false,//是否经过审核
            // 根据用户选择传参
            title: this.data.title, // 资源标题
            description: this.data.description, //资源描述
            sign: this.data.rightIndex, //资源种类：试卷为0，电子书为1
            class: this.data.leftIndex === this.data.leftMenu.length - 1 ? -1 : this.data.leftIndex - 1 //文件所属科目: -1==其他（默认）0==计算机类 1==语文类 2==数学类 3==英语类 4==物理类 5==思政类 6==化学类 7==生物类
          }
        });
      console.log("添加资源数据成功", res)
      this.setData({
        successUpLoadList: [...this.data.successUpLoadList, res._id]
      })
      return res;
    } catch (err) {
      console.log("添加资源数据失败", err)
    }
  },


  // 根据文件类型进行筛选
  filterFile(fileName) {
    const fileNameLength = fileName.length; //文件名的总长度
    var isOk = false; //默认文件没有符合的类型
    const fileType = this.data.fileType; //文件类型数组
    var i; //索引
    // console.log("文件名总长度-->",fileNameLength);
    for (i = 0; i < fileType.length; i++) {
      // 从文件名的后面开始进行字符匹配
      const lastIndex = fileName.lastIndexOf(fileType[i]); //文件原名fileName中fileType[i]出现的最后一次位置
      const typeLength = fileType[i].length; //特定文件类型字符串fileType[i]的长度
      // console.log("当前判断的文件类型-->",fileType[i]);
      // console.log(i," 类型的长度-->",typeLength);
      // console.log("最后一次出现的下标-->",lastIndex);
      if (lastIndex !== -1 && lastIndex + typeLength === fileNameLength) {
        isOk = true;
        break;
      }
    }

    // 判断是否有符合的文件类型
    if (isOk)
      return i;
    return -1;
  },

  // 计算文件的大小和类型
  getFileSize(fileSize, fileTypeIndex) {
    const type = ["DOC", "DOCX", "PDF", "PPT", "PPTX", "XLS", "XLSX"];
    const KB = fileSize / 1024;
    const string = "";
    if (KB < 1024)
      return type[fileTypeIndex] + ' ' + KB.toString().substring(0, 3) + 'KB';
    const MB = KB / 1024;
    if (MB < 1024)
      return type[fileTypeIndex] + ' ' + MB.toString().substring(0, 3) + 'MB';
    const GB = MB / 1024;
    return type[fileTypeIndex] + ' ' + GB.toString().substring(0, 3) + 'GB';
  },


  // 发布按钮    对已获取的数据进行处理
  async deal(e) {
    console.log("点击了done,以下对当前已有数据进行判断，如果合法则上传资源");
    // 1 判断文件信息是否为空数组,如果为空，则直接结束函数
    if (this.data.fileInfo.length === 0) {
      console.log("还未选择文件");
      wx.showToast({
        title: '请选择资源文件...',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 2 判断标题
    if (this.data.title.length === 0) {
      console.log("标题为空");
      wx.showToast({
        title: '请输入资源标题...',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    // 3 判断文件所属科目类别
    if (this.data.leftIndex === 0) {
      console.log("所属类别为空");
      wx.showToast({
        title: '请选择资源类别...',
        icon: 'none',
        duration: 2000
      })
      return;
    }


    // 提示上传中
    wx.showLoading({
      title: '上传中..',
      mask: true
    })

    //获取已经选择的文件的信息
    const fileInfo = this.data.fileInfo
    console.log("要上传的文件信息-->", fileInfo);

    // 统计上传失败的文件名
    var failedFile = '第';
    var successFileNum = 0; //统计上传成功的文件数目

    //选择的文件个数
    const len = fileInfo.length;
    var i, t;
    // 循环上传开始
    for (i = 0; i < len; i++) {
      // 1 获取文件的本地路径和文件名
      const filePath = fileInfo[i].path;
      const fileName = fileInfo[i].name;
      console.log("文件名为-->", fileName);
      // 2 获取文件类型的索引
      const fileTypeIndex = fileInfo[i].fileTypeIndex;
      // 3 获取文件的唯一标识(异步请求同步化)
      const fileFlag = await this.getRandomNumber(fileTypeIndex);
      //  判断任务是否继续执行
      if (!fileFlag) {
        t = i + 1;
        console.log("任务执行异常-->", t);
        failedFile = failedFile + ' ' + t + ' '; //字符串拼接
        continue;
      }
      // 获取文件的后缀名
      const fileType = this.data.fileType[fileTypeIndex];
      console.log("文件类型为-->", fileType);
      console.log(i, "文件类型索引-->", fileTypeIndex);
      console.log("文件唯一标识-->", fileFlag);
      // 5 调用函数上传文件
      const res = await this.upLoadFile(fileFlag, filePath);
      //  判断任务是否继续执行
      if (!res) {
        t = i + 1;
        console.log("任务执行异常-->", t);
        failedFile = failedFile + ' ' + t + ' '; //字符串拼接
        continue;
      }

      // 6 获取文件上传至数据库的地址
      const fileCloudPath = res.fileID;
      // console.log("文件上传至云数据库的地址-->", fileCloudPath);
      // 7 获取当前的上传时间
      const time = this.getTimeString();
      // 8 获取文件的类型和大小字符串
      const fileSize = fileInfo[i].size
      console.log("文件的大小-->", fileSize);
      const sizeString = this.getFileSize(fileSize, fileTypeIndex);
      console.log("文件的类型和大小字符串-->", sizeString);

      // 9 调用函数更新resource集合
      const addResourceAns = await this.addResourceGroup(fileName, fileFlag, fileCloudPath, time, fileTypeIndex, sizeString);
      //  判断任务是否继续执行
      if (!addResourceAns) {
        t = i + 1;
        console.log("任务执行异常-->", t);
        failedFile = failedFile + ' ' + t + ' '; //字符串拼接
        continue;
      }

      // 10 成功上传的文件数目自增
      successFileNum++;
    }
    // 循环上传结束


    // 发布成功之后重置数据
    this.setData({
      title: '',
      description: '',
      rightIndex: 0,
      leftIndex: 0,
      fileInfo: []
    }, () => {
      // 判断是否所有文件上传成功
      if (successFileNum === len) {
        if(this.data.isResourcePass){
          wx.showToast({
            title: '发布成功',
            duration: 1500
          })
        }else{
          wx.showToast({
            title: '您上传的资源正待后台管理员审核\r\n通过审核后即可显示',
          })
        }
      } else {
        if (successFileNum > 0)
          failedFile = failedFile + "个文件上传失败\r\n其余上传成功"
        else
          failedFile = "上传失败"
        if(!this.data.isResourcePass){
          failedFile = failedFile + " 正待后台管理员审核"
        }

        wx.showToast({
          title: failedFile,
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


  async onLoad(options) {
    if (!app.globalData.isReal) {
      // 加载版本信息
      await wx.cloud.database().collection('deal')
        .get()
        .then(res => {
          app.globalData.isReal = res.data[0].isReal;
          app.globalData.isResourcePass = res.data[0].isResourcePass;
          this.setData({
            isReal: res.data[0].isReal,
            isResourcePass:res.data[0].isResourcePass
          })
        })
    } else {
      this.setData({
        isReal: app.globalData.isReal,
        isResourcePass:app.globalData.isResourcePass
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
        wx.showToast({
          title: '取消发布',
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


})