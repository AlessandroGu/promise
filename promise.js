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

//promise产生的错误具有冒泡性质，会一直向后传递，直到被catch(捕获)为止，一般来说，then后面处理reject状态的回调函数最好不要定义，直接写一个catch比较好.
//catch内部还能抛出异常，但是一定要用catch来捕获，不然直接跳过异常，执行完毕。

//在ES2018中，引入了finally方法，它不接受任何参数，与promise的状态无关，不管最终promise是resolve还是reject，它都会执行，finally方法总是会返回原来的值。
promise
.finally(() => {
    // do something;
})
//上面和下面的效果是一样的，用finally的话代码可以更简洁。
promise
.then(
    result => {
        return result;
    },
    error => {
        return error;
    }
);

//剖析一下finally的实现原理
Promise.prototype.finally = function(callback) {
    let p = this.constructor;
    return this.then(
        value => p.resolve(callback()).then(() => value),
        reason => p.resolve(callback()).then(() => {throw reason})
    )
}

//promise.all方法：
const p = Promise.all([p1, p2, p3]);
//p的状态由p1,p2,p3决定，只有3个都是resolve的时候，p才会变成resolve,此时p1,p2,p3的返回值组成一个数组传递给p的回调。
//只要其中一个的状态为reject，那么p的状态就是reject，此时第一个被reject的实例的返回值，会传递给p的回调。

// 生成一个Promise对象的数组
const promises = [2, 3, 5, 7, 11, 13].map(function (id) {
  return getJSON('/post/' + id + ".json");
});

Promise.all(promises).then(function (posts) {
  // do something
}).catch(function(reason){
  // do something
});
//此时的promise是包含6个promise的实例，只有当这6个实例的状态全部变成resolve或者其中一个变为reject的时候，才会调用all后面的回调。
