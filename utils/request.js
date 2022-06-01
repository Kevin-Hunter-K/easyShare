// promise风格的函数调用
//其他页面要调用封装的API方式---> import { request } from "../../utils/request";
// 将加载效果显示和隐藏
let requestNum = 0;
export const request=(params)=>{
  // 异步调用次数自增
  requestNum++;
  // 显示加载中
  wx.showLoading({
    title: '加载中..',
    mask:true
  })

  console.log("参数-->",params);
  console.log(params.url);
  console.log(...params);


  return new Promise((resolve,reject)=>{
      wx.request({
        //   结构传进来的参数params
        ...params,
        url : params.url,//请求地址
        // 如果调用成功，则不会继续执行fail
        success:(res)=>{
            // 返回参数
            resolve(res);
        },
        fail:(err)=>{
            reject(err);
        },
        complete:()=>{
          requestNum--;//当前还在调用的请求数自减
          // 所有请求调用完成之后再隐藏弹窗
          if (!requestNum)
            wx.hideLoading();//隐藏加载中
        }
      });
  })
}