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


//注意：假如promise作为参数，自己定义了catch方法，那么它一旦被rejected，并不会触发Pormise.all()的catch方法
const p1 = new Promise((resolve, reject) => {
  resolve('hello');
})
.then(result => result)
.catch(e => e);

const p2 = new Promise((resolve, reject) => {
  throw new Error('报错了');
})
.then(result => result)
.catch(e => e);

Promise.all([p1, p2])
.then(result => console.log(result))
.catch(e => console.log(e));
// ["hello", Error: 报错了]


//let p = Promise.race([p1,p2,p3])只要其中一个改变状态，那么p的状态就会随之改变，第一个改变状态的promise的返回值，会传递给p的回调。
//race方法需要与下文的Promise.resolve结合起来看。

//Promise.resolve
//(1).参数是一个promise实例，那么就直接返回这个实例
//(2).参数是一个thenable对象，转化完成以后，立即执行.then方法
//(3).参数不是具有then方法的对象，或许压根不是对象，直接变为resolved，参数传递给回调，输出
//(4).不带有任何参数是合法的，直接返回一个resolved的promise对象。需要注意的是，立即resolve的 Promise 对象，是在本轮“事件循环”（event loop）的结束时，而不是在下一轮“事件循环”的开始时。

//Promise.reject
//注意，Promise.reject()方法的参数，会原封不动地作为reject的理由，变成后续方法的参数。这一点与Promise.resolve方法不一致。
const thenable = {
  then(resolve, reject) {
    reject('出错了');
  }
};

Promise.reject(thenable)
.catch(e => {
  console.log(e === thenable)
})
// true
// 上面代码中，Promise.reject方法的参数是一个thenable对象，执行以后，后面catch方法的参数不是reject抛出的“出错了”这个字符串，而是thenable对象。


//Promise.try
//假如把所有的函数都放在.then后面的回调中去执行的话，那么事件都会被放到本轮事件循环的末尾执行，无法区分同步函数与异步函数的执行顺序。
//ES6官网介绍了很多种写法，声明一个函数，然后用async函数去代替，但是有很多不完美的地方，用promise.try更好一点。
const f = () => console.log('now');
Promise.try(f);
console.log('next');
// now
// next
//如果想用then管理好流程，最好用try包装一下，可以更好的管理异常
function getUsername(userId) {
  return database.users.get({id: userId})
  .then(function(user) {
    return user.name;
  });
}
//database.users.get()返回的是一个promise对象，可以用catch来捕获异常，但是可能还会抛出同步错误，那就不得不用try...catch
//这样写会显得很笨拙，完全可以写成下面的这种形式:
Promise.try(database.user.get({id: userId}))
.then(...)
.catch(...)


//关于promise的总结就到这里，总结的不是很全面，很多点都漏了，等后期有时间再把遗漏的弥补上来。

//关于看慕课网对promise知识点的补充
console.log('here we go');
new Promise (resolve => {
    setTimeout( () => {
        resolve('hello');
    }, 2000);
})
.then( value => {
    console.log(value);
    console.log('everyone');
    (function() {
        return new Promise(resolve => {
            setTimeout( () => {
                console.log('Mr lince');
                resolve('Merry ...');
            }, 2000);
        })
    })();
    return false;
})
.then(value => {
    console.log(value + 'world');
})