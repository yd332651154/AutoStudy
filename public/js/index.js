function login(data) {

    if (data['code'] === 1000 || data['code'] === 200) {
        localStorage.setItem('userInit', JSON.stringify({
            login_name: user.val(),
            login_pwd: password.val(),
            login_type: getRadioVal('type')
        }));
        // 获取学期
        getSemester($('input[name="type"]:checked').val());
        // 显示
        display('登陆成功,欢迎: ' + user.val() + ' 使用本程序!', true);

    } else {
        msg.show().find('span:last').html(data['message'] || data['msg'] || '登陆失败,出现未知错误!');
    }
}

var user = $('#user'),
    password = $('#password'),
    msg = $('#msg');

function queryString(str) {
    if (!str) return null;
    var strArr = str.split('&'),
        cookies = {};
    strArr.forEach(function (item) {
        var itemArr = item.split('='),
            itemName = itemArr[0],
            itemValue = itemArr[1];
        if (itemName) {
            cookies[itemName] = window.decodeURIComponent(itemValue || '');
        }
    });
    return cookies;
}

function display(msgStr, isShow) {
    user.prop('disabled', isShow || false);
    password.prop('disabled', isShow || false);
    $('[name=type]').prop('disabled', isShow || false);
    if (isShow) {
        msg.show().removeClass('alert-danger').find('span:first').removeClass('glyphicon-exclamation-sign');
        $('[type="submit"]').hide();
        $('#loginSuccess').slideDown(200, 'linear');
    } else {
        $('[type="submit"]').show();
        $('#loginSuccess').hide();
        msg.show().addClass('alert-danger').find('span:first').addClass('glyphicon-exclamation-sign');
    }

    msg.find('[data-msg="msg"]').html(msgStr);
}

function getUserInit(uname) {
    try {
        var userInit = JSON.parse(localStorage.getItem('userInit') || '{}');
    } catch (err) { }

    if (uname) {
        return userInit[uname];
    } else {
        return userInit;
    }
}


var userInit = getUserInit();

// 登陆状态
var loginStatus;

switch (userInit['login_type']) {
    case 'chaoxing':
        loginStatus = Cookies.get('UID');
        $('input[value=chaoxing]').prop('checked', 'checked');
        break;
    case 'lemon':
        loginStatus = Cookies.get('gzcjzyxy_student_COOKIE');
        loginStatus = queryString(loginStatus)['user_name'];
        $('input[value=lemon]').prop('checked', 'checked');
        break;
}

if (loginStatus) {
    $('[name=type]').prop('disabled', true);
    user.val(userInit['login_name']);
    password.val(userInit['login_pwd']);
    // 获取学期
    getSemester($('input[name="type"]:checked').val());
    // 显示
    display('欢迎 ' + loginStatus + ' 再次使用本程序!', true);
}


function getSemester(type) {
    var url;

    if (type === 'lemon') {
        url = '/lemonSchool/semester';
    } else {
        url = 'chaoxing/course?type=link';
    }

    var data = sessionStorage.getItem('data');
    if (data) {
        success(JSON.parse(data));
    } else {
        $.ajax({
            url: url,
            success: success
        });
    }


    function success(data) {
        if (data['code'] === 1000 || Array.isArray(data)) {

            sessionStorage.setItem('data', JSON.stringify(data));

            $('#semester').html('');

            if (type === 'lemon') {
                lemon(data);
            } else {
                chaoxing(data);
            }
            $('#semester').parents('.form-group').show();
        } else {
            $('#semester').parents('.form-group').hide()
        }
    }

    function lemon(data) {
        var arr = data.data;
        for (var i = 0; i < arr.length; i++) {

            for (var j = 0; j < arr.length - 1; j++) {

                if (arr[j] > arr[j + 1]) {
                    var val = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = val;
                }
            }

        }

        var index = arr.findIndex(function (val) {
            return val.isCurrentTerm;
        });

        $.each(arr.slice(0, index + 1), function (index, item) {
            var option = document.createElement('option');
            option.innerText = '第' + item.term + '学期';
            option.selected = item.isCurrentTerm;
            option.value = item.termCode;
            $('#semester').append(option);
        });
    }

    function chaoxing(data) {
        $.each(data, function (index, item) {
            var option = document.createElement('option');
            option.innerText = item.term_name;
            option.value = item.term_name;
            $('#semester').append(option);
        });

    }
}


function getRadioVal(uname) {
    var uname = document.getElementsByName(uname);
    for (var i = 0; i < uname.length; i++) {
        if (uname[i].checked) {
            return uname[i].value;
        }
    }
    return null;
}


var events = {
    // 立即刷取
    autoPlay: function () {

        var login_type = getUserInit('login_type'),
            url, term = $('#semester').val() || '';

        switch (login_type) {
            case 'lemon':
                url = '/lemonSchool/autoplay?user=' + user.val() + '&term=' + term;
                break;
            case 'chaoxing':
                url = '/chaoxing/auto?uname=' + user.val() + '&term=' + term;
                break;
        }

        if (!url) return display('请重新登陆账号');

        $.ajax({
            url: url,
            success: function (data) {
                var code = data['code'],
                    message = data['msg'];
                if (code == 200) {
                    msg.show().removeClass('alert-danger').find('span:first').removeClass('glyphicon-exclamation-sign');
                    msg.find('[data-msg="msg"]').html(message + ',一般10分钟左右即可刷取完成!');
                } else if (code == 201) {
                    display('请重新登陆账号');
                } else {
                    msg.show().addClass('alert-danger').find('span:first').addClass('glyphicon-exclamation-sign');
                    msg.find('[data-msg="msg"]').html(message);
                }
            }
        })
    },
    loginOut: function () {
        if (confirm('你确定要退出当前账号吗?')) {
            Cookies.remove('openlearning_COOKIE');
            Cookies.remove('gzcjzyxy_student_COOKIE');
            Cookies.remove('UID');
            localStorage.removeItem('userInit');
            sessionStorage.removeItem('data');
            location.reload();
        }
    }
}

// 绑定事件
document.getElementById('loginSuccess').addEventListener('click', function (evnt) {
    if (this == evnt.target) return;
    var evntName = evnt.target.getAttribute('data-event');
    for (var k in events) {
        if (k === evntName) {
            return events[k].call(evnt.target, evnt);
        }
    }
});

function loginType(type, params) {
    var params = params || {},
        user = params['user'],
        pwd = params['pwd'];

    switch (type) {
        case 'lemon':
            return '/lemonSchool/login?user=' + user + '&pwd=' + pwd;
        case 'chaoxing':
            return '/chaoxing/login?uname=' + user + '&password=' + pwd;
        default:
            return null
    }
}

$(function () {

    $('#login').on('submit', function (e) {

        if (user.val().trim().length === 0) {
            msg.fadeIn().find('span:last').html('请输入账号');
            return false;
        } else if (password.val().trim().length === 0) {
            msg.fadeIn().find('span:last').html('请输入密码');
            return false;
        }

        var url = loginType(getRadioVal('type'), {
            user: user.val(),
            pwd: password.val()
        });

        if (!url) {
            msg.fadeIn().find('span:last').html('亲，请先选择要登陆的平台！');
            return false;
        }
        msg.hide();

        $.ajax({
            url: url,
            success: login,
            beforeSend: function () { $('[type="submit"]').prop('disabled', true); },
            complete: function () { $('[type="submit"]').prop('disabled', false); }
        });
        return false;
    });


});