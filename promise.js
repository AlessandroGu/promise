/*
 * 目前工作中还没有用到promise，但是业余时间自己研究过promise，本身自己技术比较差一点，
 * 所以之前对于promise理解的也不是很到位，单纯的认为只有当多个ajax嵌套的时候才会用到promise，
 * 现在工作也不是很忙，花点时间把promise重新整理一下，其实也不算整理，就是把阮一峰老师的例子
 * 拿来看一下，稍微整合一下，带点注释，如果有人看的话，能看的清楚一点。
 * 
 * 
 * 
 * promise这个技术其实很早就有了，我总觉得好像只有这两年才大规模的开始使用，我想一定是我太low了。
 * 关于promise的详细介绍，可以查看阮一峰老师的官方文档，在这里我就不多叙述了。
 */




//利用promise实现异步加载图片
function loadImageAsync(url) {
    return new Promise(function(resolve, reject) {
        const image = new Image();
        image.onload = function() {
            resolve(image);
        }
        image.onerror = function() {
            reject(new Error('Could not load image at' + url));
        }
        image.src = url;
    })
}


//利用pormise封装ajax请求，promise执行完毕以后的结果会作为参数传递到then后面的回调函数中去
const getJson = function(url) {
    const promise = new Promise(function(resolve, reject) {
        const handler = function() {
            if (this.readyState !== 4) {
                return;
            }
            if (this.status === 200) {
                resolve(this.response);
            } else {
                reject(new Error(this.statusText));
            }
        };
        const client = new XMLHttpRequest();
        client.open('GET', url);
        client.onreadystatechange = handler;
        client.responseType = 'json';
        client.setRequestHeader('Accept', 'application/json');
        client.send();
    });
    return promise;
};
getJson('/posts.json').then(function(json){
    console.log('Contents:' + json);
}, function(error){
    console.log('出错了', error);
});



//P2返回的是一个新的promise对象，P2状态就失效，由P1决定，异步等待，P1的状态是reject，所以P2被"感染了"，执行的是catch函数
const p1 = new Promise(function(resolve, reject) {
    setTimeout(() => reject(new Error('fail')), 3000);
})
const p2 = new Promise(function(resolve, reject) {
    setTimeout(() => resolve(p1), 1000);
})
p2.then(result => console.log(result))
  .catch(error => console.log(error));


//第一个promise执行完毕，返回的是一个promise对象，下面的then中的回调函数等待返回的promise对象状态发生改变，resolve就执行funA,否则就执行funB
getJson('/post/1.json').then(function(post) {
    return getJson(post.commentURL);
}).then(function funA(comments){
    console.log('resolved:', comments);
}, function funB(err){
    console.log('rejected:', error);
})