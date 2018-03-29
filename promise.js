



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