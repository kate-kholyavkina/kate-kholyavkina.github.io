var modal = (function () {


  function init() {
    _setUpListeners();
  }


  function showMessage(msg) {
    _showMessage(msg);
  }


  var 
    _modalHolder = $('.modal__holder'),
    _modal = $('.modal'),
    _modalText = $('.modal__text');


  // прослушка событий
  function _setUpListeners() {
    $('#modal-close').on("click", _hideMessage);
  }


  // показываем сообщение
  function _showMessage (msg) {
    _modalText.text(msg);
    _modal.css({
      'top': '50%',
      'opacity': '0'
    }).animate({
      'opacity': '1',
    }, 300);
    _modalHolder.show();
  }


  // прячем сообщение
  function _hideMessage(e) {
    e.preventDefault();
    _modal.css({
      'top': '-100%'
    }).animate({
      'opacity': '0',
    }, 300, function(){
      _modalHolder.hide();
    });
  };


  return {
    init: init,
    showMessage: showMessage
  };

})();



var preloader = (function () {

  var 
    // массив для всех изображений на странице
    _imgs = [],
    
    // будет использоваться из других модулей, чтобы проверить, отрисованы ли все элементы
    // будет использоваться вместо document.ready, который из-за прелоадера срабатывает раньше 
    // (когда отрисован прелоадер, а не вся страница)
    contentReady = $.Deferred();


  // инициальзация модуля
  function init () {
    _countImages();
    _startPreloader();

  };

  function _countImages(){

    // проходим по всем элементам на странице
    $.each($('*'), function(){
      var $this = $(this),
        background = $this.css('background-image'),
        img = $this.is('img');

      // записываем в массив все пути к бэкграундам
      if (background != 'none') {

        // в chrome в урле есть кавычки, вырезаем с ними. url("...") -> ...
        // в safari в урле нет кавычек, вырезаем без них. url( ... ) -> ...
        var path = background.replace('url("', "").replace('")', "");
        var path = path.replace('url(', "").replace(')', "");

        _imgs.push(path);
      }

      // записываем в массив все пути к картинкам
      if (img) {
        var path = '' + $this.attr('src');
        if ( (path) && ($this.css('display') !== 'none') ) {
          _imgs.push(path);
        }
      }

    });

  };


  function _startPreloader(){

    // загружено 0 картинок
    var loaded = 0;

    // проходим по всем собранным картинкам 
    for (var i = 0; i < _imgs.length; i++) {

      var image = $('<img>', {
        attr: {
          src: _imgs[i]
        }
      });

      // загружаем по подной 
      $(image).load(function(){
        loaded++;
        var percentLoaded = _countPercent(loaded,_imgs.length);
        _setPercent(percentLoaded);
      });

    };

  }

  // пересчитывает в проценты, сколько картинок загружено
  // current - number, сколько картинок загружено
  // total - number, сколько их всего
  function _countPercent(current, total){
    return Math.ceil(current / total * 100);
  }

  
  
  // записывает процент в div прелоадер
  // percent - number, какую цифру записать
  function _setPercent(percent){

    $('.preloader__percents').text(percent);

    // когда дошли до 100%, скрываем прелоадер и показываем содержимое страницы
    if (percent >= 100) {
      $('.preloader__hidden').css('display', 'block');
      $('.preloader').fadeOut(300);
      _finishPreloader();
    }

  };

  function _finishPreloader(){

    contentReady.resolve();
  };



  return {
    init: init,
    contentReady: contentReady
  };

})();



var validation = (function () {


  function _validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // var re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm;
    return re.test(email);
  }

  // закрашиваем некорректные инпуты в красный
  function setErrorStyles(element) {
    element.css({
      'background-color': '#fffafa'
    });
  }

  // перекрашиваем инпуты обратно в белый
  function clearErrorStyles(element) {

    // любые, кроме submit
    if (element.attr('type') == 'submit') {
      return;
    }

    element.css({
      'background-color': '#fff'
    });
  }



  function validateForm (form) {

    var valid = true;
        message = '';
    var elements = form.find('input, textarea').not(
      'input[type="hidden"], ' + 
      'input[type="file"], ' + 
      'input[type="submit"]'),
      //  элементы лдя дополнительной проверки. Если в форме есть специфические поля
      //  пример использования: нужно проверить инпут типа 'checkbox' с id 'ishuman' на то что он 'true', 
      //  в случае ошибки вывести 'errorMsg'.
      // 
      //  validation.validateForm(form, [{
      //    id: 'ishuman',
      //    type: 'checkbox',
      //    checked: true,
      //    errorMsg: 'Роботам здесь не место'
      //  }]);
      itemsToCheck = arguments[1];


    // каждый эл-т формы
    $.each(elements, function(index, elem){

      var 
        element = $(elem),
        value = element.val();

      // проверяем каждый эл-т на пустоту (кроме checkbox и radio)
      if (  (element.attr('type') != "checkbox") &&
            (element.attr('type') != "radio") &&
            (value.length === 0) ) {

        //если да, то ошибка 
        setErrorStyles(element);
        valid = false;
        message = 'Вы заполнили не все поля формы';
      }

      // проверяем каждый email валидатором имейлов
      if (element.attr('type') == "email") {


        // если имейл не валидный
        if (!_validateEmail(value)) {

          //то ошибка 
          setErrorStyles(element);
          valid = false;
          message = 'Некорректный email';
        }

      }

      // парсим список дополнительных элементов на проверку
      $(itemsToCheck).map(function(key, item){

        // если текущий элемент формы совпадает с каким-то из эл-тов списка itemsToCheck
        if (element.attr('id') === item.id) {

          // если это чекбокс или радио, 
          // &&
          // если значение checked не равно тому, что мы хотим (что мы передали при вызове) ( true/ false )
          if ( (item.type === 'checkbox' || item.type === 'radio') &&
            element.prop('checked') !== item.checked  ) {

            // то ошибка 
            setErrorStyles(element);
            valid = false;
            message = item.errorMsg;
          }
        }

      });


    });


    // выводим сообщение об ошибке с помощью модуля modal (_modal.js)
    if (message !== '') {
      modal.showMessage(message);
    }

    return valid;
  }

  return {
    validateForm: validateForm,
    setErrorStyles: setErrorStyles,
    clearErrorStyles: clearErrorStyles
  };

})();

var scrollspy = (function () {

  _nav = $('.blog-nav__link');



  function init () {
    _scrollSpy();
    _setUpListeners();
  };

  // if (_nav === 0) {
  //   return;
  // };

  // прослушка событий
  function _setUpListeners() {

    // по скроллу делаем scroll spy
    $(window).on("scroll", _scrollSpy);

    // по клику переходим на нужную статью с анимацией
    $(_nav).on("click", function(e){
      _showArticle($(e.target).attr('href'), true);
    });

    // по ссылке переходим на нужную статью без анимации
    $(function() {
      if (window.location.hash !== '') {
        _showArticle(window.location.hash, false);
      }
    });
  }


  // переход на нужную статью (с анимацией или без)
  function _showArticle(article, isAnimate) {
    var 
      direction = article.replace('#', ''),
      reqArticle = $('.articles__item').filter('[data-article="' + direction + '"]'),
      reqArticlePos = reqArticle.offset().top;

      if (isAnimate) {
        $('body, html').animate({
          scrollTop: reqArticlePos
        }, 500);
      } else {
        $('body, html').scrollTop(reqArticlePos);
      }
  }


  // scroll spy
  function _scrollSpy() {
    $('.articles__item').each(function(){
      var
        $this = $(this),
        topEdge = $this.offset().top - 200,
        btmEdge = topEdge + $this.height(),
        wScroll = $(window).scrollTop();

        if (topEdge < wScroll && btmEdge > wScroll) {
          var 
            currentId = $this.data('article'),
            activeLink = _nav.filter('[href="#' + currentId + '"]');

          activeLink.closest('.blog-nav__item').addClass('active').siblings().removeClass('active');
        }

    });
  };


  return {
    init: init
  };

})();



var blogMenuPanel = (function(){

  var html = $('html');
  var body = $('body');


  function init(){
    _setUpListeners();
    _locateMenu();
  };


  function _setUpListeners(){

    $('.off-canvas--menu').on('click', _openMenu);
    $('.off-canvas--content').on('click', _closeMenu);

    $(window).on({
      'resize': function() {
        _closeMenu();
        _locateMenu();
      },
      'scroll': _fixMenu
    });

  };


  function _openMenu(){
    if ( $( window ).width() < 768 ) {
      html.addClass('html--blog-opened');
    }
  }


  function _closeMenu(){
    if ( $( window ).width() < 768 ) {
      html.removeClass('html--blog-opened');
    }
  }


  function _fixMenu() {

    var header = $('.header');
    var headerHeight = header.height();
    var menu = $('.off-canvas--menu');
    var scrollY = window.scrollY;

    if (scrollY > headerHeight) {
      menu.addClass('fixed');
    } else {
      menu.removeClass('fixed');
    }
        
  }

  function _locateMenu() {

    var header = $('.header');
    var menu = $('.off-canvas--menu');

    //  menu 'top' is right under the header
    //  menu 'top' is 0 when menu is on green panel
    if ( $( window ).width() > 768 ) {
      menu.css('top', header.css('height'));
    } else {
      menu.css('top', '0');
    }
  }


  return {
    init: init
  };

})();

var blur = (function () {


  function init() {
    _setUpListeners();
  }

  function _setUpListeners() {
    // отрисовываем блюр по загрузке страницы и ресайзу окна
    $(window).on('load resize', _blur);
  }

  function _blur() {

    var bg = $('.blur__bg');

    if (bg.length === 0) {
      // return;
    };

    var form = $('.blur__form'),
      bgWidth = bg.width(),
      posTop  = bg.offset().top  - form.offset().top,
      posLeft = bg.offset().left - form.offset().left;

    form.css({
      'background-size': bgWidth + 'px' + ' ' + 'auto',
      'background-position': posLeft + 'px' + ' ' + posTop + 'px'
    });
  };

  return {
    init: init
  };

})();


var contactForm = (function () {

  function init () {
    _setUpListeners();
  };

  function _setUpListeners () {
    $('#contact-btn').on('click', _submitForm);  
    $('.form--contact input, .form--contact textarea').on('keydown', _clearErrorStyles);  
  };


  function _clearErrorStyles() {
    validation.clearErrorStyles($(this));
  }
  
  function _submitForm(e) {
    e.preventDefault();
    var
      form = $(this).closest('.form'),
      data = form.serialize();
    
    if (validation.validateForm(form)) {
      _sendForm(form);
    };

  }

  function _sendForm(form){
    $.ajax({
      type: "POST",
      url: 'assets/php/mail.php',
      cache: false,
      data: form.serialize()
    }).done(function(html){
      modal.showMessage(html);
    }).fail(function(html){
      modal.showMessage('Сообщение не отправлено!');
    })
  }

  return {
    init: init
  };

})();

var flipCard = (function () {


  var isWelcomeFlipped = false,
      buttonTriggerFlip = $('.btn--show-login'),
      flipContainer = $('.flip-container');


  function init () {
    _setUpListners();
  };


  function _setUpListners () {

    buttonTriggerFlip.on('click', _showLogin);
    $('.wrapper--welcome, .footer--welcome').on('click', _prepareToHide);
    $('.btn--hide-login').on('click', _hideLogin);
  };



  function _hideLogin(e) {

    e.preventDefault();

    // то переворачиваем обратно
    isWelcomeFlipped = false;
    flipContainer.removeClass('flip');
    buttonTriggerFlip.fadeTo(300, 1, function(){
      buttonTriggerFlip.css('visibility', 'visible');
    });

  };



  function _prepareToHide(e) {
      // если кликаем на карточке, то переворачивать не надо
      if (e.target.closest('.welcome__card') !== null) {
        return;
      }
      // если кликаем не на карточке,
      if (isWelcomeFlipped && 
          e.target.id != buttonTriggerFlip.attr('id')
        ) {
        _hideLogin(e);
      }
  };


  
  function _showLogin(e) {

    e.preventDefault();
    isWelcomeFlipped = true;
    flipContainer.addClass('flip');
    buttonTriggerFlip.fadeTo(300, 0).css('visibility', 'hidden');
  };


  return {
    init: init
  };

})();




// flipping animation

  // (function(){

  //   var isWelcomeFlipped = false,
  //       buttonTriggerFlip = $('.btn--show-login'),
  //       flipContainer = $('.flip-container');


  //   buttonTriggerFlip.on('click', function(e){

  //     e.preventDefault();
  //     isWelcomeFlipped = true;
  //     flipContainer.addClass('flip');
  //     buttonTriggerFlip.fadeTo(300, 0).css('visibility', 'hidden');
  //   });


  //   $('.wrapper--welcome, .footer--welcome').on('click', function(e){
      
  //     // если кликаем на карточке, то переворачивать не надо
  //     if (e.target.closest('.welcome__card') !== null) {
  //       return;
  //     }
  //     // если кликаем не на карточке, то
  //     if (isWelcomeFlipped && 
  //         e.target.id != buttonTriggerFlip.attr('id')
  //       ) {

  //       isWelcomeFlipped = false;
  //       flipContainer.removeClass('flip');
  //       buttonTriggerFlip.fadeTo(300, 1, function(){
  //         buttonTriggerFlip.css('visibility', 'visible');
  //       })
  //     }

  //   });

  //   $('.btn--hide-login').on('click', function(e){

  //     e.preventDefault();
  //     isWelcomeFlipped = false;
  //     flipContainer.removeClass('flip');
  //     buttonTriggerFlip.fadeTo(300, 1).css('visibility', 'visible');
  //   });

  // })();
var hamburgerMenu = (function () {


  function init () {
    _setUpListners();
  };


  function _setUpListners () {
    $('#burger-btn').on('click', _toggleMenu);
  };


  function _toggleMenu(e) {

    $(this).toggleClass('burger-btn--active');
    $('body').toggleClass('overfow-hidden');
    $('.main-menu').toggleClass('main-menu--open');
  };


  return {
    init: init
  };

})();
var loginForm = (function () {

  function init () {
    _setUpListeners();
  };

  function _setUpListeners () {
    $('#login-btn').on('click', _submitForm);
    $('.form--login input').not('#login-btn').on('keydown', _clearErrorStyles);
  };

  function _clearErrorStyles() {
    validation.clearErrorStyles($(this));
  }

  function _submitForm(e) {
    console.log('submitting Login Form ');
    e.preventDefault();
    var
      form = $(this).closest('.form'),
      data = form.serialize();

    validation.validateForm(form, [{
      id: 'ishuman',
      type: 'checkbox',
      checked: true,
      errorMsg: 'Роботам здесь не место'
    }, {
      id: 'notrobot-yes',
      type: 'radio',
      checked: true,
      errorMsg: 'Роботам здесь не место'
    }, {
      id: 'notrobot-no',
      type: 'radio',
      checked: false,
      errorMsg: 'Роботам здесь не место'
    }]);

  }

  return {
    init: init
  };

})();

var parallax = (function () {


  // инициальзация модуля
  function init () {
    // включаем прослушку 
    _setUpListners();
    // сразу же ищем ширину и высоту параллакса
    _parallaxResize();
  };

  var 
      // скорость и размах движения слоев
      _speed = 1 / 50,
      _window    = $(window),
      _wWidth  = _window.innerWidth(),
      _wHeight = _window.innerHeight(),
      _halfWidth  = _window.innerWidth() / 2,
      _halfHeight = _window.innerHeight() / 2,
      _layers  = $('.parallax').find('.parallax__layer');



  // устанавлмваем прослушку на движение мыши и ресайз окна
  function _setUpListners () {
    $(window).on('mousemove', _parallaxMove);
    $(window).on('resize', _parallaxResize);
  };

  // функция пересчитывает ширину и высоту для слоев параллакса
  function _parallaxResize() {


    // каждый раз при ресайзе пересчитаываем размеры окна
    var 
      _wWidth  = _window.innerWidth(),
      _wHeight = _window.innerHeight(),
      _halfHeight = _window.innerHeight() / 2;

    // ищем максимальный номер слоя
    var maxIndex = _layers.length -1;

    // у картинки будут отступы справа и слева, чтобы параллакс полностью помещался.
    // отступы равны максимальному сдвигу слоев
    // (самый последний слой двигается больше всех, так что ищем именнно его максимальный сдвиг)
    var maxShiftX = _halfWidth * maxIndex * _speed,


        // ширина "расширенной" картинки: ширина окна + 2 отступа
        widthWider = _wWidth + (maxShiftX * 2),

        //соотношение сторон экрана (высоту экрана делим на ширину "расширенной" картинки)
        windowRatio = (_wHeight / widthWider),

        //соотношение сторон реальной картинки
        pictureRatio = (1994 / 3000);


    // если картинка помещается в экран по высоте, то надо ее увеличить
    if ( windowRatio > pictureRatio ) {
      // высота = высоте экрана, все остальное рассчитываем, исходя из этой высоты
      parallaxHeight = _wHeight + 'px';
      parallaxWidth = _wHeight / pictureRatio;
      parallaxMarginLeft = (parallaxWidth  - _wWidth) / 2;

    // если картинка не помещается в экран по высоте, то высота будет рассчитываться автоматически
    // будем выравнивать по ширине
    } else {

      // ширина = ширине экрана (+ 2 отступа), все остальное рассчитываем, исходя из этой ширины
      parallaxWidth = widthWider;
      parallaxHeight = 'auto';
      parallaxMarginLeft = maxShiftX;

    }

    // подставляем найденные значения ширины, высоты и margin-left всем слоям
    _layers.css( {
      'width': parallaxWidth + 'px',
      'height': parallaxHeight,
      'margin-left': '-' + parallaxMarginLeft + 'px'
    });


    $.each(_layers, function(index, elem){
      // topShift - это величина, на которую нужно сдвинуть каждый слой вниз, чтобы не было видно краев 
      topShift =  (_halfHeight * index * _speed);
      $(elem).css({
        'top': topShift + 'px',
      });
    });
    
  };




  // функция двигает слои в зависимости от положения мыши
  function _parallaxMove (e) {

    var 
        // положение мыши
        mouseX  = e.pageX,
        mouseY  = e.pageY,

        // положение мыши в нашей новой системе координат (с центром в середине экрана)
        coordX  = _halfWidth - mouseX,
        coordY  = _halfHeight - mouseY;

        // move each layer
        $.each(_layers, function(index, elem){

          // рассчитываем для каждого слоя, на сколько его сдвигать
          var shiftX = Math.round(coordX * index * _speed),
              shiftY = Math.round(coordY * index * _speed),
              // topShift - это величина, на которую нужно сдвинуть каждый слой вниз, чтобы не было видно краев 
              topShift =  (_halfHeight * index * _speed);

          $(elem).css({
            'top': topShift + 'px',
            'transform': 'translate3d(' + shiftX + 'px, ' + shiftY + 'px, ' + ' 0)'
          });
        });
  }


  return {
    init: init
  };

})();


var scrollButtons = (function () {


  function init () {
    _setUpListners();
  };


  function _setUpListners () {
    $('.scroll-control--down').on('click', _scrollDown)
    $('.scroll-control--up').on('click', _scrollUp)
  };


  function _scrollUp(e) {
    e.preventDefault();
    _scrollTo( '0', 700 );
  };


  function _scrollDown(e) {
    e.preventDefault();
    _scrollTo( $(".header").height() , 500);
  };


  function _scrollTo(pos, duration){
    $('html, body').animate({
      scrollTop: pos
    }, duration);
  }


  return {
    init: init
  };

})();
var skillsAnimation = (function () {


  function init () {
    _setUpListners();
  };


  function _setUpListners () {
    $(window).on('scroll', _scroll);
  };

  // если доскроллили до блока со скилами, то показываем их
  function _scroll(e) {
    
    wScroll = $(window).scrollTop();
    skillsTop = $('.skills-block').offset().top - 200;

    if (wScroll > skillsTop) {
      _showSkills();
    }

    
  }


  // функция показывает и анимирует скилы.
  function _showSkills(){

    var arc, circumference;
    var time = 0;
    var delay = 150;

    $('circle.inner').each(function(i, el){
      
      var arc = Math.ceil($(el).data('arc'));
      var circumference = Math.ceil($(el).data('circumference'));

      // анимируем каждый круг с большей задержкой
      setTimeout(function(){

        $(el).closest('.skills__item').animate({
          'opacity': '1'
        }, 300);

        $(el).css('stroke-dasharray', arc+'px ' + circumference + 'px');

      }, time += delay );
    });

  }


  return {
    init: init
  };

})();
var sliderTitlesAnimation = (function () {

  function init () {
    _animateTitles();
  };


  // функция проходит по всем заголовкам слайдера. функция генерирует html-код, 
  // заворачивающий все буквы и слова в html-теги для дальнейшей работы с ними с помощью css
  function _animateTitles() {

    var 
      _titles = $('.slider__info .section-title__inner'),
      inject;


    // каждый заголовок
    _titles.each(function(){
      
      var 
        $this = $(this),
        titleText = $this.text();

      // очищаем заголовок, чтобы потом вставить туда сгенерированный код
      $this.html('');

      // счетчик для номеров букв в заголовке
      var i = 0;

      // работаем с каждым словом: 
      $.each(titleText.split(' '), function(c, word) {

          // очищаем слово
          inject = '';

          // каждая буква завернута в span с классами char--1, char--2, ... . 
          // на основании этих классов буквам в css проставляется соответствующий animation-delay.
          $.each(word.split(''), function(k, char) {
            inject += '<span class="char char--' + i + '">' + char + '</span>';
            i++;
          });

          // каждое слово завернуто в span class="word", чтобы решить проблему с переносом строк посреди слова
          var word = '<span class="word">' + inject + '</span>';


          $this.append(word);
      });

    });
  };


  return {
    init: init
  };

})();

var slider = (function () {

  function init () {
    _setUpListners();
  };


  function _setUpListners () {
    $('.slider__control').on('click', _moveSlider);
  };


  // уменьшает номер слайда на единицу (если надо, закольцовывает)
  function _indexDec(activeIndex, maxIndex) {
      var prevIndex = (activeIndex <=   0  ) ? maxIndex : activeIndex - 1;
      return prevIndex;
  };


  // увеличивает номер слайда на единицу (если надо, закольцовывает)
  function _indexInc(activeIndex, maxIndex) {
      var nextIndex = (activeIndex >= maxIndex) ?   0   : activeIndex + 1;
      return nextIndex;
  };


  // функция анимирует маленькие слайдеры (prev, next)
  // direction - направление слайдера, принимает значения 'up'/'down', вниз/вверх
  // control - слайдер, который нужно проанимировать: левый или правый
  // newIndex - номер слайда, который показать следуюшим
  function _moveSmallSlider(direction, control, newIndex) {
    var 
      items = control.find('.control__item'),
      oldItem = control.find('.control__item--active'),
      newItem = items.eq(newIndex);


      oldItem.removeClass('control__item--active');
      newItem.addClass('control__item--active');


    if (direction == 'up') {

        newItem.css('top', '100%');
        oldItem.animate({'top': '-100%'}, 300);
        newItem.animate({'top': '0'}, 300);

    };
    if (direction == 'down') {

        newItem.css('top', '-100%');
        oldItem.animate({'top': '100%'}, 300);
        newItem.animate({'top': '0'}, 300);
      
    };
  };


  // функция анимирует большой слайдер
  // indexToHide - слайд, который нужно скрыть
  // indexToShow - слайд, который нужно показать
  // items - все слайды
  function _displaySlide(indexToHide, indexToShow, items) {

    var 
      itemToHide = items.eq(indexToHide),
      itemToShow = items.eq(indexToShow);

    itemToHide.removeClass('slider__item--active');
    itemToHide.animate({'opacity': '0'}, 150);

    itemToShow.addClass('slider__item--active');
    itemToShow.delay(150).animate({'opacity': '1'}, 150);
  };


  // функция анимирует слайдер с информацией
  // indexToHide - слайд, который нужно скрыть
  // indexToShow - слайд, который нужно показать
  // infoItems - все слайды с информацией
  function _displayInfo(indexToHide, indexToShow, infoItems) {
    infoItems.eq(indexToHide).css('display', 'none');
    infoItems.eq(indexToShow).css('display', 'inline-block');
  }




  // функция опеределяет, по какому контролу мы кликнули и вызывает соответствующие:
  // _displayInfo, чтобы показать нужную информацию
  // _displaySlide., чтобы показать нужный слайд
  // _moveSmallSlider, чтобы проанимировать prev control 
  // _moveSmallSlider, чтобы проанимировать next control 
  function _moveSlider (e) {

      e.preventDefault();

      var
        $this = $(this),
        container = $this.closest('.slider'),
        items = container.find('.slider__item'),
        infoItems = container.find('.slider__item-info'),
        maxIndex = items.length - 1,
        prevControl = container.find('.slider__control--prev'),
        nextControl = container.find('.slider__control--next'),
        activeItem = container.find('.slider__item--active'),
        activeIndex = items.index(activeItem),
        prevIndex = _indexDec(activeIndex, maxIndex),
        nextIndex = _indexInc(activeIndex, maxIndex);

      // показать предыдущий слайд
      if ( $this.hasClass('slider__control--prev') ) {

        var prevIndexDec = _indexDec(prevIndex, maxIndex);
        var nextIndexDec = _indexDec(nextIndex, maxIndex);

        _displaySlide(activeIndex, prevIndex, items);
        _displayInfo(activeIndex, prevIndex, infoItems);

        _moveSmallSlider('up', prevControl, prevIndexDec);
        _moveSmallSlider('down', nextControl, nextIndexDec);

      };


      // показать следующий слайд
      if ( $this.hasClass('slider__control--next') ) {

        var prevIndexInc = _indexInc(prevIndex, maxIndex);
        var nextIndexInc = _indexInc(nextIndex, maxIndex);
        
        _displaySlide(activeIndex, nextIndex, items);
        _displayInfo(activeIndex, nextIndex, infoItems);

        _moveSmallSlider('up', prevControl, prevIndexInc);
        _moveSmallSlider('down', nextControl, nextIndexInc);

      };
  };

  return {
    init: init
  };

})();

(function() {
  'use strict';

  preloader.init();
  modal.init();
  hamburgerMenu.init();
  scrollButtons.init();



  // на странице index
  if (window.location.pathname == '/index.html' || window.location.pathname == '/') {

    parallax.init();
    loginForm.init();
    flipCard.init();
  }


  // на странице blog
  if (window.location.pathname == '/blog.html') {

    // Модуль blogMenu должен быть инициализирован после отрисовки всех элементов,
    // для чего логично было бы использовать document.ready
    // Но использование document.ready тут невозможно из-за прелоадера, 
    // так как для правильной работы прелоадера у всех элементов сначала стоит display: none.
    // из-за этого document.ready срабатывает слишком рано, когда отрисован только прелоадер.
    // 
    // поэтому пришлось создать Deferred объект в модуле preloader: preloader.contentReady
    // preloader.contentReady получает метод .resolve() только после того, как все элементы получают display: block
    // Соответственно, инициализация blogMenu происходит после получения display: block и отрисовки всех элементов

    preloader.contentReady.done(function() { 
      scrollspy.init();
      blogMenuPanel.init();
    });
  }


  // на странице works
  if (window.location.pathname == '/works.html') {

    blur.init();
    slider.init();
    sliderTitlesAnimation.init();
    contactForm.init();
  }


  // на странице about
  if (window.location.pathname == '/about.html') {
    skillsAnimation.init();
  }


})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9fbW9kYWwuanMiLCJfX3ByZWxvYWRlci5qcyIsIl9fdmFsaWRhdGlvbi5qcyIsIl9ibG9nLW1lbnUuanMiLCJfYmx1ci5qcyIsIl9jb250YWN0LWZvcm0uanMiLCJfZmxpcC5qcyIsIl9oYW1idXJnZXItbWVudS5qcyIsIl9sb2dpbi1mb3JtLmpzIiwiX3BhcmFsbGF4LmpzIiwiX3Njcm9sbC1idXR0b25zLmpzIiwiX3NraWxscy5qcyIsIl9zbGlkZXItdGl0bGVzLmpzIiwiX3NsaWRlci5qcyIsImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIG1vZGFsID0gKGZ1bmN0aW9uICgpIHtcblxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgX3NldFVwTGlzdGVuZXJzKCk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHNob3dNZXNzYWdlKG1zZykge1xuICAgIF9zaG93TWVzc2FnZShtc2cpO1xuICB9XG5cblxuICB2YXIgXG4gICAgX21vZGFsSG9sZGVyID0gJCgnLm1vZGFsX19ob2xkZXInKSxcbiAgICBfbW9kYWwgPSAkKCcubW9kYWwnKSxcbiAgICBfbW9kYWxUZXh0ID0gJCgnLm1vZGFsX190ZXh0Jyk7XG5cblxuICAvLyDQv9GA0L7RgdC70YPRiNC60LAg0YHQvtCx0YvRgtC40LlcbiAgZnVuY3Rpb24gX3NldFVwTGlzdGVuZXJzKCkge1xuICAgICQoJyNtb2RhbC1jbG9zZScpLm9uKFwiY2xpY2tcIiwgX2hpZGVNZXNzYWdlKTtcbiAgfVxuXG5cbiAgLy8g0L/QvtC60LDQt9GL0LLQsNC10Lwg0YHQvtC+0LHRidC10L3QuNC1XG4gIGZ1bmN0aW9uIF9zaG93TWVzc2FnZSAobXNnKSB7XG4gICAgX21vZGFsVGV4dC50ZXh0KG1zZyk7XG4gICAgX21vZGFsLmNzcyh7XG4gICAgICAndG9wJzogJzUwJScsXG4gICAgICAnb3BhY2l0eSc6ICcwJ1xuICAgIH0pLmFuaW1hdGUoe1xuICAgICAgJ29wYWNpdHknOiAnMScsXG4gICAgfSwgMzAwKTtcbiAgICBfbW9kYWxIb2xkZXIuc2hvdygpO1xuICB9XG5cblxuICAvLyDQv9GA0Y/Rh9C10Lwg0YHQvtC+0LHRidC10L3QuNC1XG4gIGZ1bmN0aW9uIF9oaWRlTWVzc2FnZShlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIF9tb2RhbC5jc3Moe1xuICAgICAgJ3RvcCc6ICctMTAwJSdcbiAgICB9KS5hbmltYXRlKHtcbiAgICAgICdvcGFjaXR5JzogJzAnLFxuICAgIH0sIDMwMCwgZnVuY3Rpb24oKXtcbiAgICAgIF9tb2RhbEhvbGRlci5oaWRlKCk7XG4gICAgfSk7XG4gIH07XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgc2hvd01lc3NhZ2U6IHNob3dNZXNzYWdlXG4gIH07XG5cbn0pKCk7XG5cblxuIiwidmFyIHByZWxvYWRlciA9IChmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIFxuICAgIC8vINC80LDRgdGB0LjQsiDQtNC70Y8g0LLRgdC10YUg0LjQt9C+0LHRgNCw0LbQtdC90LjQuSDQvdCwINGB0YLRgNCw0L3QuNGG0LVcbiAgICBfaW1ncyA9IFtdLFxuICAgIFxuICAgIC8vINCx0YPQtNC10YIg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGM0YHRjyDQuNC3INC00YDRg9Cz0LjRhSDQvNC+0LTRg9C70LXQuSwg0YfRgtC+0LHRiyDQv9GA0L7QstC10YDQuNGC0YwsINC+0YLRgNC40YHQvtCy0LDQvdGLINC70Lgg0LLRgdC1INGN0LvQtdC80LXQvdGC0YtcbiAgICAvLyDQsdGD0LTQtdGCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0LLQvNC10YHRgtC+IGRvY3VtZW50LnJlYWR5LCDQutC+0YLQvtGA0YvQuSDQuNC3LdC30LAg0L/RgNC10LvQvtCw0LTQtdGA0LAg0YHRgNCw0LHQsNGC0YvQstCw0LXRgiDRgNCw0L3RjNGI0LUgXG4gICAgLy8gKNC60L7Qs9C00LAg0L7RgtGA0LjRgdC+0LLQsNC9INC/0YDQtdC70L7QsNC00LXRgCwg0LAg0L3QtSDQstGB0Y8g0YHRgtGA0LDQvdC40YbQsClcbiAgICBjb250ZW50UmVhZHkgPSAkLkRlZmVycmVkKCk7XG5cblxuICAvLyDQuNC90LjRhtC40LDQu9GM0LfQsNGG0LjRjyDQvNC+0LTRg9C70Y9cbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgX2NvdW50SW1hZ2VzKCk7XG4gICAgX3N0YXJ0UHJlbG9hZGVyKCk7XG5cbiAgfTtcblxuICBmdW5jdGlvbiBfY291bnRJbWFnZXMoKXtcblxuICAgIC8vINC/0YDQvtGF0L7QtNC40Lwg0L/QviDQstGB0LXQvCDRjdC70LXQvNC10L3RgtCw0Lwg0L3QsCDRgdGC0YDQsNC90LjRhtC1XG4gICAgJC5lYWNoKCQoJyonKSwgZnVuY3Rpb24oKXtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgIGJhY2tncm91bmQgPSAkdGhpcy5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnKSxcbiAgICAgICAgaW1nID0gJHRoaXMuaXMoJ2ltZycpO1xuXG4gICAgICAvLyDQt9Cw0L/QuNGB0YvQstCw0LXQvCDQsiDQvNCw0YHRgdC40LIg0LLRgdC1INC/0YPRgtC4INC6INCx0Y3QutCz0YDQsNGD0L3QtNCw0LxcbiAgICAgIGlmIChiYWNrZ3JvdW5kICE9ICdub25lJykge1xuXG4gICAgICAgIC8vINCyIGNocm9tZSDQsiDRg9GA0LvQtSDQtdGB0YLRjCDQutCw0LLRi9GH0LrQuCwg0LLRi9GA0LXQt9Cw0LXQvCDRgSDQvdC40LzQuC4gdXJsKFwiLi4uXCIpIC0+IC4uLlxuICAgICAgICAvLyDQsiBzYWZhcmkg0LIg0YPRgNC70LUg0L3QtdGCINC60LDQstGL0YfQtdC6LCDQstGL0YDQtdC30LDQtdC8INCx0LXQtyDQvdC40YUuIHVybCggLi4uICkgLT4gLi4uXG4gICAgICAgIHZhciBwYXRoID0gYmFja2dyb3VuZC5yZXBsYWNlKCd1cmwoXCInLCBcIlwiKS5yZXBsYWNlKCdcIiknLCBcIlwiKTtcbiAgICAgICAgdmFyIHBhdGggPSBwYXRoLnJlcGxhY2UoJ3VybCgnLCBcIlwiKS5yZXBsYWNlKCcpJywgXCJcIik7XG5cbiAgICAgICAgX2ltZ3MucHVzaChwYXRoKTtcbiAgICAgIH1cblxuICAgICAgLy8g0LfQsNC/0LjRgdGL0LLQsNC10Lwg0LIg0LzQsNGB0YHQuNCyINCy0YHQtSDQv9GD0YLQuCDQuiDQutCw0YDRgtC40L3QutCw0LxcbiAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgdmFyIHBhdGggPSAnJyArICR0aGlzLmF0dHIoJ3NyYycpO1xuICAgICAgICBpZiAoIChwYXRoKSAmJiAoJHRoaXMuY3NzKCdkaXNwbGF5JykgIT09ICdub25lJykgKSB7XG4gICAgICAgICAgX2ltZ3MucHVzaChwYXRoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfSk7XG5cbiAgfTtcblxuXG4gIGZ1bmN0aW9uIF9zdGFydFByZWxvYWRlcigpe1xuXG4gICAgLy8g0LfQsNCz0YDRg9C20LXQvdC+IDAg0LrQsNGA0YLQuNC90L7QulxuICAgIHZhciBsb2FkZWQgPSAwO1xuXG4gICAgLy8g0L/RgNC+0YXQvtC00LjQvCDQv9C+INCy0YHQtdC8INGB0L7QsdGA0LDQvdC90YvQvCDQutCw0YDRgtC40L3QutCw0LwgXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfaW1ncy5sZW5ndGg7IGkrKykge1xuXG4gICAgICB2YXIgaW1hZ2UgPSAkKCc8aW1nPicsIHtcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHNyYzogX2ltZ3NbaV1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vINC30LDQs9GA0YPQttCw0LXQvCDQv9C+INC/0L7QtNC90L7QuSBcbiAgICAgICQoaW1hZ2UpLmxvYWQoZnVuY3Rpb24oKXtcbiAgICAgICAgbG9hZGVkKys7XG4gICAgICAgIHZhciBwZXJjZW50TG9hZGVkID0gX2NvdW50UGVyY2VudChsb2FkZWQsX2ltZ3MubGVuZ3RoKTtcbiAgICAgICAgX3NldFBlcmNlbnQocGVyY2VudExvYWRlZCk7XG4gICAgICB9KTtcblxuICAgIH07XG5cbiAgfVxuXG4gIC8vINC/0LXRgNC10YHRh9C40YLRi9Cy0LDQtdGCINCyINC/0YDQvtGG0LXQvdGC0YssINGB0LrQvtC70YzQutC+INC60LDRgNGC0LjQvdC+0Log0LfQsNCz0YDRg9C20LXQvdC+XG4gIC8vIGN1cnJlbnQgLSBudW1iZXIsINGB0LrQvtC70YzQutC+INC60LDRgNGC0LjQvdC+0Log0LfQsNCz0YDRg9C20LXQvdC+XG4gIC8vIHRvdGFsIC0gbnVtYmVyLCDRgdC60L7Qu9GM0LrQviDQuNGFINCy0YHQtdCz0L5cbiAgZnVuY3Rpb24gX2NvdW50UGVyY2VudChjdXJyZW50LCB0b3RhbCl7XG4gICAgcmV0dXJuIE1hdGguY2VpbChjdXJyZW50IC8gdG90YWwgKiAxMDApO1xuICB9XG5cbiAgXG4gIFxuICAvLyDQt9Cw0L/QuNGB0YvQstCw0LXRgiDQv9GA0L7RhtC10L3RgiDQsiBkaXYg0L/RgNC10LvQvtCw0LTQtdGAXG4gIC8vIHBlcmNlbnQgLSBudW1iZXIsINC60LDQutGD0Y4g0YbQuNGE0YDRgyDQt9Cw0L/QuNGB0LDRgtGMXG4gIGZ1bmN0aW9uIF9zZXRQZXJjZW50KHBlcmNlbnQpe1xuXG4gICAgJCgnLnByZWxvYWRlcl9fcGVyY2VudHMnKS50ZXh0KHBlcmNlbnQpO1xuXG4gICAgLy8g0LrQvtCz0LTQsCDQtNC+0YjQu9C4INC00L4gMTAwJSwg0YHQutGA0YvQstCw0LXQvCDQv9GA0LXQu9C+0LDQtNC10YAg0Lgg0L/QvtC60LDQt9GL0LLQsNC10Lwg0YHQvtC00LXRgNC20LjQvNC+0LUg0YHRgtGA0LDQvdC40YbRi1xuICAgIGlmIChwZXJjZW50ID49IDEwMCkge1xuICAgICAgJCgnLnByZWxvYWRlcl9faGlkZGVuJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAkKCcucHJlbG9hZGVyJykuZmFkZU91dCgzMDApO1xuICAgICAgX2ZpbmlzaFByZWxvYWRlcigpO1xuICAgIH1cblxuICB9O1xuXG4gIGZ1bmN0aW9uIF9maW5pc2hQcmVsb2FkZXIoKXtcblxuICAgIGNvbnRlbnRSZWFkeS5yZXNvbHZlKCk7XG4gIH07XG5cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBjb250ZW50UmVhZHk6IGNvbnRlbnRSZWFkeVxuICB9O1xuXG59KSgpO1xuXG5cbiIsInZhciB2YWxpZGF0aW9uID0gKGZ1bmN0aW9uICgpIHtcblxuXG4gIGZ1bmN0aW9uIF92YWxpZGF0ZUVtYWlsKGVtYWlsKSB7XG4gICAgdmFyIHJlID0gL14oKFtePD4oKVtcXF1cXFxcLiw7Olxcc0BcXFwiXSsoXFwuW148PigpW1xcXVxcXFwuLDs6XFxzQFxcXCJdKykqKXwoXFxcIi4rXFxcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcXSl8KChbYS16QS1aXFwtMC05XStcXC4pK1thLXpBLVpdezIsfSkpJC87XG4gICAgLy8gdmFyIHJlID0gL1tBLVowLTkuXyUrLV0rQFtBLVowLTkuLV0rLltBLVpdezIsNH0vaWdtO1xuICAgIHJldHVybiByZS50ZXN0KGVtYWlsKTtcbiAgfVxuXG4gIC8vINC30LDQutGA0LDRiNC40LLQsNC10Lwg0L3QtdC60L7RgNGA0LXQutGC0L3Ri9C1INC40L3Qv9GD0YLRiyDQsiDQutGA0LDRgdC90YvQuVxuICBmdW5jdGlvbiBzZXRFcnJvclN0eWxlcyhlbGVtZW50KSB7XG4gICAgZWxlbWVudC5jc3Moe1xuICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnI2ZmZmFmYSdcbiAgICB9KTtcbiAgfVxuXG4gIC8vINC/0LXRgNC10LrRgNCw0YjQuNCy0LDQtdC8INC40L3Qv9GD0YLRiyDQvtCx0YDQsNGC0L3QviDQsiDQsdC10LvRi9C5XG4gIGZ1bmN0aW9uIGNsZWFyRXJyb3JTdHlsZXMoZWxlbWVudCkge1xuXG4gICAgLy8g0LvRjtCx0YvQtSwg0LrRgNC+0LzQtSBzdWJtaXRcbiAgICBpZiAoZWxlbWVudC5hdHRyKCd0eXBlJykgPT0gJ3N1Ym1pdCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbGVtZW50LmNzcyh7XG4gICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICcjZmZmJ1xuICAgIH0pO1xuICB9XG5cblxuXG4gIGZ1bmN0aW9uIHZhbGlkYXRlRm9ybSAoZm9ybSkge1xuXG4gICAgdmFyIHZhbGlkID0gdHJ1ZTtcbiAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgIHZhciBlbGVtZW50cyA9IGZvcm0uZmluZCgnaW5wdXQsIHRleHRhcmVhJykubm90KFxuICAgICAgJ2lucHV0W3R5cGU9XCJoaWRkZW5cIl0sICcgKyBcbiAgICAgICdpbnB1dFt0eXBlPVwiZmlsZVwiXSwgJyArIFxuICAgICAgJ2lucHV0W3R5cGU9XCJzdWJtaXRcIl0nKSxcbiAgICAgIC8vICDRjdC70LXQvNC10L3RgtGLINC70LTRjyDQtNC+0L/QvtC70L3QuNGC0LXQu9GM0L3QvtC5INC/0YDQvtCy0LXRgNC60LguINCV0YHQu9C4INCyINGE0L7RgNC80LUg0LXRgdGC0Ywg0YHQv9C10YbQuNGE0LjRh9C10YHQutC40LUg0L/QvtC70Y9cbiAgICAgIC8vICDQv9GA0LjQvNC10YAg0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y86INC90YPQttC90L4g0L/RgNC+0LLQtdGA0LjRgtGMINC40L3Qv9GD0YIg0YLQuNC/0LAgJ2NoZWNrYm94JyDRgSBpZCAnaXNodW1hbicg0L3QsCDRgtC+INGH0YLQviDQvtC9ICd0cnVlJywgXG4gICAgICAvLyAg0LIg0YHQu9GD0YfQsNC1INC+0YjQuNCx0LrQuCDQstGL0LLQtdGB0YLQuCAnZXJyb3JNc2cnLlxuICAgICAgLy8gXG4gICAgICAvLyAgdmFsaWRhdGlvbi52YWxpZGF0ZUZvcm0oZm9ybSwgW3tcbiAgICAgIC8vICAgIGlkOiAnaXNodW1hbicsXG4gICAgICAvLyAgICB0eXBlOiAnY2hlY2tib3gnLFxuICAgICAgLy8gICAgY2hlY2tlZDogdHJ1ZSxcbiAgICAgIC8vICAgIGVycm9yTXNnOiAn0KDQvtCx0L7RgtCw0Lwg0LfQtNC10YHRjCDQvdC1INC80LXRgdGC0L4nXG4gICAgICAvLyAgfV0pO1xuICAgICAgaXRlbXNUb0NoZWNrID0gYXJndW1lbnRzWzFdO1xuXG5cbiAgICAvLyDQutCw0LbQtNGL0Lkg0Y3Quy3RgiDRhNC+0YDQvNGLXG4gICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpbmRleCwgZWxlbSl7XG5cbiAgICAgIHZhciBcbiAgICAgICAgZWxlbWVudCA9ICQoZWxlbSksXG4gICAgICAgIHZhbHVlID0gZWxlbWVudC52YWwoKTtcblxuICAgICAgLy8g0L/RgNC+0LLQtdGA0Y/QtdC8INC60LDQttC00YvQuSDRjdC7LdGCINC90LAg0L/Rg9GB0YLQvtGC0YMgKNC60YDQvtC80LUgY2hlY2tib3gg0LggcmFkaW8pXG4gICAgICBpZiAoICAoZWxlbWVudC5hdHRyKCd0eXBlJykgIT0gXCJjaGVja2JveFwiKSAmJlxuICAgICAgICAgICAgKGVsZW1lbnQuYXR0cigndHlwZScpICE9IFwicmFkaW9cIikgJiZcbiAgICAgICAgICAgICh2YWx1ZS5sZW5ndGggPT09IDApICkge1xuXG4gICAgICAgIC8v0LXRgdC70Lgg0LTQsCwg0YLQviDQvtGI0LjQsdC60LAgXG4gICAgICAgIHNldEVycm9yU3R5bGVzKGVsZW1lbnQpO1xuICAgICAgICB2YWxpZCA9IGZhbHNlO1xuICAgICAgICBtZXNzYWdlID0gJ9CS0Ysg0LfQsNC/0L7Qu9C90LjQu9C4INC90LUg0LLRgdC1INC/0L7Qu9GPINGE0L7RgNC80YsnO1xuICAgICAgfVxuXG4gICAgICAvLyDQv9GA0L7QstC10YDRj9C10Lwg0LrQsNC20LTRi9C5IGVtYWlsINCy0LDQu9C40LTQsNGC0L7RgNC+0Lwg0LjQvNC10LnQu9C+0LJcbiAgICAgIGlmIChlbGVtZW50LmF0dHIoJ3R5cGUnKSA9PSBcImVtYWlsXCIpIHtcblxuXG4gICAgICAgIC8vINC10YHQu9C4INC40LzQtdC50Lsg0L3QtSDQstCw0LvQuNC00L3Ri9C5XG4gICAgICAgIGlmICghX3ZhbGlkYXRlRW1haWwodmFsdWUpKSB7XG5cbiAgICAgICAgICAvL9GC0L4g0L7RiNC40LHQutCwIFxuICAgICAgICAgIHNldEVycm9yU3R5bGVzKGVsZW1lbnQpO1xuICAgICAgICAgIHZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgbWVzc2FnZSA9ICfQndC10LrQvtGA0YDQtdC60YLQvdGL0LkgZW1haWwnO1xuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgLy8g0L/QsNGA0YHQuNC8INGB0L/QuNGB0L7QuiDQtNC+0L/QvtC70L3QuNGC0LXQu9GM0L3Ri9GFINGN0LvQtdC80LXQvdGC0L7QsiDQvdCwINC/0YDQvtCy0LXRgNC60YNcbiAgICAgICQoaXRlbXNUb0NoZWNrKS5tYXAoZnVuY3Rpb24oa2V5LCBpdGVtKXtcblxuICAgICAgICAvLyDQtdGB0LvQuCDRgtC10LrRg9GJ0LjQuSDRjdC70LXQvNC10L3RgiDRhNC+0YDQvNGLINGB0L7QstC/0LDQtNCw0LXRgiDRgSDQutCw0LrQuNC8LdGC0L4g0LjQtyDRjdC7LdGC0L7QsiDRgdC/0LjRgdC60LAgaXRlbXNUb0NoZWNrXG4gICAgICAgIGlmIChlbGVtZW50LmF0dHIoJ2lkJykgPT09IGl0ZW0uaWQpIHtcblxuICAgICAgICAgIC8vINC10YHQu9C4INGN0YLQviDRh9C10LrQsdC+0LrRgSDQuNC70Lgg0YDQsNC00LjQviwgXG4gICAgICAgICAgLy8gJiZcbiAgICAgICAgICAvLyDQtdGB0LvQuCDQt9C90LDRh9C10L3QuNC1IGNoZWNrZWQg0L3QtSDRgNCw0LLQvdC+INGC0L7QvNGDLCDRh9GC0L4g0LzRiyDRhdC+0YLQuNC8ICjRh9GC0L4g0LzRiyDQv9C10YDQtdC00LDQu9C4INC/0YDQuCDQstGL0LfQvtCy0LUpICggdHJ1ZS8gZmFsc2UgKVxuICAgICAgICAgIGlmICggKGl0ZW0udHlwZSA9PT0gJ2NoZWNrYm94JyB8fCBpdGVtLnR5cGUgPT09ICdyYWRpbycpICYmXG4gICAgICAgICAgICBlbGVtZW50LnByb3AoJ2NoZWNrZWQnKSAhPT0gaXRlbS5jaGVja2VkICApIHtcblxuICAgICAgICAgICAgLy8g0YLQviDQvtGI0LjQsdC60LAgXG4gICAgICAgICAgICBzZXRFcnJvclN0eWxlcyhlbGVtZW50KTtcbiAgICAgICAgICAgIHZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICBtZXNzYWdlID0gaXRlbS5lcnJvck1zZztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSk7XG5cblxuICAgIH0pO1xuXG5cbiAgICAvLyDQstGL0LLQvtC00LjQvCDRgdC+0L7QsdGJ0LXQvdC40LUg0L7QsSDQvtGI0LjQsdC60LUg0YEg0L/QvtC80L7RidGM0Y4g0LzQvtC00YPQu9GPIG1vZGFsIChfbW9kYWwuanMpXG4gICAgaWYgKG1lc3NhZ2UgIT09ICcnKSB7XG4gICAgICBtb2RhbC5zaG93TWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsaWQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHZhbGlkYXRlRm9ybTogdmFsaWRhdGVGb3JtLFxuICAgIHNldEVycm9yU3R5bGVzOiBzZXRFcnJvclN0eWxlcyxcbiAgICBjbGVhckVycm9yU3R5bGVzOiBjbGVhckVycm9yU3R5bGVzXG4gIH07XG5cbn0pKCk7XG4iLCJ2YXIgc2Nyb2xsc3B5ID0gKGZ1bmN0aW9uICgpIHtcblxuICBfbmF2ID0gJCgnLmJsb2ctbmF2X19saW5rJyk7XG5cblxuXG4gIGZ1bmN0aW9uIGluaXQgKCkge1xuICAgIF9zY3JvbGxTcHkoKTtcbiAgICBfc2V0VXBMaXN0ZW5lcnMoKTtcbiAgfTtcblxuICAvLyBpZiAoX25hdiA9PT0gMCkge1xuICAvLyAgIHJldHVybjtcbiAgLy8gfTtcblxuICAvLyDQv9GA0L7RgdC70YPRiNC60LAg0YHQvtCx0YvRgtC40LlcbiAgZnVuY3Rpb24gX3NldFVwTGlzdGVuZXJzKCkge1xuXG4gICAgLy8g0L/QviDRgdC60YDQvtC70LvRgyDQtNC10LvQsNC10Lwgc2Nyb2xsIHNweVxuICAgICQod2luZG93KS5vbihcInNjcm9sbFwiLCBfc2Nyb2xsU3B5KTtcblxuICAgIC8vINC/0L4g0LrQu9C40LrRgyDQv9C10YDQtdGF0L7QtNC40Lwg0L3QsCDQvdGD0LbQvdGD0Y4g0YHRgtCw0YLRjNGOINGBINCw0L3QuNC80LDRhtC40LXQuVxuICAgICQoX25hdikub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKXtcbiAgICAgIF9zaG93QXJ0aWNsZSgkKGUudGFyZ2V0KS5hdHRyKCdocmVmJyksIHRydWUpO1xuICAgIH0pO1xuXG4gICAgLy8g0L/QviDRgdGB0YvQu9C60LUg0L/QtdGA0LXRhdC+0LTQuNC8INC90LAg0L3Rg9C20L3Rg9GOINGB0YLQsNGC0YzRjiDQsdC10Lcg0LDQvdC40LzQsNGG0LjQuFxuICAgICQoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhhc2ggIT09ICcnKSB7XG4gICAgICAgIF9zaG93QXJ0aWNsZSh3aW5kb3cubG9jYXRpb24uaGFzaCwgZmFsc2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cblxuICAvLyDQv9C10YDQtdGF0L7QtCDQvdCwINC90YPQttC90YPRjiDRgdGC0LDRgtGM0Y4gKNGBINCw0L3QuNC80LDRhtC40LXQuSDQuNC70Lgg0LHQtdC3KVxuICBmdW5jdGlvbiBfc2hvd0FydGljbGUoYXJ0aWNsZSwgaXNBbmltYXRlKSB7XG4gICAgdmFyIFxuICAgICAgZGlyZWN0aW9uID0gYXJ0aWNsZS5yZXBsYWNlKCcjJywgJycpLFxuICAgICAgcmVxQXJ0aWNsZSA9ICQoJy5hcnRpY2xlc19faXRlbScpLmZpbHRlcignW2RhdGEtYXJ0aWNsZT1cIicgKyBkaXJlY3Rpb24gKyAnXCJdJyksXG4gICAgICByZXFBcnRpY2xlUG9zID0gcmVxQXJ0aWNsZS5vZmZzZXQoKS50b3A7XG5cbiAgICAgIGlmIChpc0FuaW1hdGUpIHtcbiAgICAgICAgJCgnYm9keSwgaHRtbCcpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogcmVxQXJ0aWNsZVBvc1xuICAgICAgICB9LCA1MDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJCgnYm9keSwgaHRtbCcpLnNjcm9sbFRvcChyZXFBcnRpY2xlUG9zKTtcbiAgICAgIH1cbiAgfVxuXG5cbiAgLy8gc2Nyb2xsIHNweVxuICBmdW5jdGlvbiBfc2Nyb2xsU3B5KCkge1xuICAgICQoJy5hcnRpY2xlc19faXRlbScpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhclxuICAgICAgICAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgIHRvcEVkZ2UgPSAkdGhpcy5vZmZzZXQoKS50b3AgLSAyMDAsXG4gICAgICAgIGJ0bUVkZ2UgPSB0b3BFZGdlICsgJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgIHdTY3JvbGwgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgaWYgKHRvcEVkZ2UgPCB3U2Nyb2xsICYmIGJ0bUVkZ2UgPiB3U2Nyb2xsKSB7XG4gICAgICAgICAgdmFyIFxuICAgICAgICAgICAgY3VycmVudElkID0gJHRoaXMuZGF0YSgnYXJ0aWNsZScpLFxuICAgICAgICAgICAgYWN0aXZlTGluayA9IF9uYXYuZmlsdGVyKCdbaHJlZj1cIiMnICsgY3VycmVudElkICsgJ1wiXScpO1xuXG4gICAgICAgICAgYWN0aXZlTGluay5jbG9zZXN0KCcuYmxvZy1uYXZfX2l0ZW0nKS5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuICB9O1xuXG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0XG4gIH07XG5cbn0pKCk7XG5cblxuXG52YXIgYmxvZ01lbnVQYW5lbCA9IChmdW5jdGlvbigpe1xuXG4gIHZhciBodG1sID0gJCgnaHRtbCcpO1xuICB2YXIgYm9keSA9ICQoJ2JvZHknKTtcblxuXG4gIGZ1bmN0aW9uIGluaXQoKXtcbiAgICBfc2V0VXBMaXN0ZW5lcnMoKTtcbiAgICBfbG9jYXRlTWVudSgpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gX3NldFVwTGlzdGVuZXJzKCl7XG5cbiAgICAkKCcub2ZmLWNhbnZhcy0tbWVudScpLm9uKCdjbGljaycsIF9vcGVuTWVudSk7XG4gICAgJCgnLm9mZi1jYW52YXMtLWNvbnRlbnQnKS5vbignY2xpY2snLCBfY2xvc2VNZW51KTtcblxuICAgICQod2luZG93KS5vbih7XG4gICAgICAncmVzaXplJzogZnVuY3Rpb24oKSB7XG4gICAgICAgIF9jbG9zZU1lbnUoKTtcbiAgICAgICAgX2xvY2F0ZU1lbnUoKTtcbiAgICAgIH0sXG4gICAgICAnc2Nyb2xsJzogX2ZpeE1lbnVcbiAgICB9KTtcblxuICB9O1xuXG5cbiAgZnVuY3Rpb24gX29wZW5NZW51KCl7XG4gICAgaWYgKCAkKCB3aW5kb3cgKS53aWR0aCgpIDwgNzY4ICkge1xuICAgICAgaHRtbC5hZGRDbGFzcygnaHRtbC0tYmxvZy1vcGVuZWQnKTtcbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIF9jbG9zZU1lbnUoKXtcbiAgICBpZiAoICQoIHdpbmRvdyApLndpZHRoKCkgPCA3NjggKSB7XG4gICAgICBodG1sLnJlbW92ZUNsYXNzKCdodG1sLS1ibG9nLW9wZW5lZCcpO1xuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gX2ZpeE1lbnUoKSB7XG5cbiAgICB2YXIgaGVhZGVyID0gJCgnLmhlYWRlcicpO1xuICAgIHZhciBoZWFkZXJIZWlnaHQgPSBoZWFkZXIuaGVpZ2h0KCk7XG4gICAgdmFyIG1lbnUgPSAkKCcub2ZmLWNhbnZhcy0tbWVudScpO1xuICAgIHZhciBzY3JvbGxZID0gd2luZG93LnNjcm9sbFk7XG5cbiAgICBpZiAoc2Nyb2xsWSA+IGhlYWRlckhlaWdodCkge1xuICAgICAgbWVudS5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWVudS5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICB9XG4gICAgICAgIFxuICB9XG5cbiAgZnVuY3Rpb24gX2xvY2F0ZU1lbnUoKSB7XG5cbiAgICB2YXIgaGVhZGVyID0gJCgnLmhlYWRlcicpO1xuICAgIHZhciBtZW51ID0gJCgnLm9mZi1jYW52YXMtLW1lbnUnKTtcblxuICAgIC8vICBtZW51ICd0b3AnIGlzIHJpZ2h0IHVuZGVyIHRoZSBoZWFkZXJcbiAgICAvLyAgbWVudSAndG9wJyBpcyAwIHdoZW4gbWVudSBpcyBvbiBncmVlbiBwYW5lbFxuICAgIGlmICggJCggd2luZG93ICkud2lkdGgoKSA+IDc2OCApIHtcbiAgICAgIG1lbnUuY3NzKCd0b3AnLCBoZWFkZXIuY3NzKCdoZWlnaHQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1lbnUuY3NzKCd0b3AnLCAnMCcpO1xuICAgIH1cbiAgfVxuXG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0XG4gIH07XG5cbn0pKCk7XG4iLCJ2YXIgYmx1ciA9IChmdW5jdGlvbiAoKSB7XG5cblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIF9zZXRVcExpc3RlbmVycygpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3NldFVwTGlzdGVuZXJzKCkge1xuICAgIC8vINC+0YLRgNC40YHQvtCy0YvQstCw0LXQvCDQsdC70Y7RgCDQv9C+INC30LDQs9GA0YPQt9C60LUg0YHRgtGA0LDQvdC40YbRiyDQuCDRgNC10YHQsNC50LfRgyDQvtC60L3QsFxuICAgICQod2luZG93KS5vbignbG9hZCByZXNpemUnLCBfYmx1cik7XG4gIH1cblxuICBmdW5jdGlvbiBfYmx1cigpIHtcblxuICAgIHZhciBiZyA9ICQoJy5ibHVyX19iZycpO1xuXG4gICAgaWYgKGJnLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gcmV0dXJuO1xuICAgIH07XG5cbiAgICB2YXIgZm9ybSA9ICQoJy5ibHVyX19mb3JtJyksXG4gICAgICBiZ1dpZHRoID0gYmcud2lkdGgoKSxcbiAgICAgIHBvc1RvcCAgPSBiZy5vZmZzZXQoKS50b3AgIC0gZm9ybS5vZmZzZXQoKS50b3AsXG4gICAgICBwb3NMZWZ0ID0gYmcub2Zmc2V0KCkubGVmdCAtIGZvcm0ub2Zmc2V0KCkubGVmdDtcblxuICAgIGZvcm0uY3NzKHtcbiAgICAgICdiYWNrZ3JvdW5kLXNpemUnOiBiZ1dpZHRoICsgJ3B4JyArICcgJyArICdhdXRvJyxcbiAgICAgICdiYWNrZ3JvdW5kLXBvc2l0aW9uJzogcG9zTGVmdCArICdweCcgKyAnICcgKyBwb3NUb3AgKyAncHgnXG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0XG4gIH07XG5cbn0pKCk7XG5cbiIsInZhciBjb250YWN0Rm9ybSA9IChmdW5jdGlvbiAoKSB7XG5cbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgX3NldFVwTGlzdGVuZXJzKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gX3NldFVwTGlzdGVuZXJzICgpIHtcbiAgICAkKCcjY29udGFjdC1idG4nKS5vbignY2xpY2snLCBfc3VibWl0Rm9ybSk7ICBcbiAgICAkKCcuZm9ybS0tY29udGFjdCBpbnB1dCwgLmZvcm0tLWNvbnRhY3QgdGV4dGFyZWEnKS5vbigna2V5ZG93bicsIF9jbGVhckVycm9yU3R5bGVzKTsgIFxuICB9O1xuXG5cbiAgZnVuY3Rpb24gX2NsZWFyRXJyb3JTdHlsZXMoKSB7XG4gICAgdmFsaWRhdGlvbi5jbGVhckVycm9yU3R5bGVzKCQodGhpcykpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBfc3VibWl0Rm9ybShlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhclxuICAgICAgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnLmZvcm0nKSxcbiAgICAgIGRhdGEgPSBmb3JtLnNlcmlhbGl6ZSgpO1xuICAgIFxuICAgIGlmICh2YWxpZGF0aW9uLnZhbGlkYXRlRm9ybShmb3JtKSkge1xuICAgICAgX3NlbmRGb3JtKGZvcm0pO1xuICAgIH07XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIF9zZW5kRm9ybShmb3JtKXtcbiAgICAkLmFqYXgoe1xuICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICB1cmw6ICdhc3NldHMvcGhwL21haWwucGhwJyxcbiAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgIGRhdGE6IGZvcm0uc2VyaWFsaXplKClcbiAgICB9KS5kb25lKGZ1bmN0aW9uKGh0bWwpe1xuICAgICAgbW9kYWwuc2hvd01lc3NhZ2UoaHRtbCk7XG4gICAgfSkuZmFpbChmdW5jdGlvbihodG1sKXtcbiAgICAgIG1vZGFsLnNob3dNZXNzYWdlKCfQodC+0L7QsdGJ0LXQvdC40LUg0L3QtSDQvtGC0L/RgNCw0LLQu9C10L3QviEnKTtcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0XG4gIH07XG5cbn0pKCk7XG4iLCJ2YXIgZmxpcENhcmQgPSAoZnVuY3Rpb24gKCkge1xuXG5cbiAgdmFyIGlzV2VsY29tZUZsaXBwZWQgPSBmYWxzZSxcbiAgICAgIGJ1dHRvblRyaWdnZXJGbGlwID0gJCgnLmJ0bi0tc2hvdy1sb2dpbicpLFxuICAgICAgZmxpcENvbnRhaW5lciA9ICQoJy5mbGlwLWNvbnRhaW5lcicpO1xuXG5cbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgX3NldFVwTGlzdG5lcnMoKTtcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIF9zZXRVcExpc3RuZXJzICgpIHtcblxuICAgIGJ1dHRvblRyaWdnZXJGbGlwLm9uKCdjbGljaycsIF9zaG93TG9naW4pO1xuICAgICQoJy53cmFwcGVyLS13ZWxjb21lLCAuZm9vdGVyLS13ZWxjb21lJykub24oJ2NsaWNrJywgX3ByZXBhcmVUb0hpZGUpO1xuICAgICQoJy5idG4tLWhpZGUtbG9naW4nKS5vbignY2xpY2snLCBfaGlkZUxvZ2luKTtcbiAgfTtcblxuXG5cbiAgZnVuY3Rpb24gX2hpZGVMb2dpbihlKSB7XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAvLyDRgtC+INC/0LXRgNC10LLQvtGA0LDRh9C40LLQsNC10Lwg0L7QsdGA0LDRgtC90L5cbiAgICBpc1dlbGNvbWVGbGlwcGVkID0gZmFsc2U7XG4gICAgZmxpcENvbnRhaW5lci5yZW1vdmVDbGFzcygnZmxpcCcpO1xuICAgIGJ1dHRvblRyaWdnZXJGbGlwLmZhZGVUbygzMDAsIDEsIGZ1bmN0aW9uKCl7XG4gICAgICBidXR0b25UcmlnZ2VyRmxpcC5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgIH0pO1xuXG4gIH07XG5cblxuXG4gIGZ1bmN0aW9uIF9wcmVwYXJlVG9IaWRlKGUpIHtcbiAgICAgIC8vINC10YHQu9C4INC60LvQuNC60LDQtdC8INC90LAg0LrQsNGA0YLQvtGH0LrQtSwg0YLQviDQv9C10YDQtdCy0L7RgNCw0YfQuNCy0LDRgtGMINC90LUg0L3QsNC00L5cbiAgICAgIGlmIChlLnRhcmdldC5jbG9zZXN0KCcud2VsY29tZV9fY2FyZCcpICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vINC10YHQu9C4INC60LvQuNC60LDQtdC8INC90LUg0L3QsCDQutCw0YDRgtC+0YfQutC1LFxuICAgICAgaWYgKGlzV2VsY29tZUZsaXBwZWQgJiYgXG4gICAgICAgICAgZS50YXJnZXQuaWQgIT0gYnV0dG9uVHJpZ2dlckZsaXAuYXR0cignaWQnKVxuICAgICAgICApIHtcbiAgICAgICAgX2hpZGVMb2dpbihlKTtcbiAgICAgIH1cbiAgfTtcblxuXG4gIFxuICBmdW5jdGlvbiBfc2hvd0xvZ2luKGUpIHtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBpc1dlbGNvbWVGbGlwcGVkID0gdHJ1ZTtcbiAgICBmbGlwQ29udGFpbmVyLmFkZENsYXNzKCdmbGlwJyk7XG4gICAgYnV0dG9uVHJpZ2dlckZsaXAuZmFkZVRvKDMwMCwgMCkuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICB9O1xuXG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0XG4gIH07XG5cbn0pKCk7XG5cblxuXG5cbi8vIGZsaXBwaW5nIGFuaW1hdGlvblxuXG4gIC8vIChmdW5jdGlvbigpe1xuXG4gIC8vICAgdmFyIGlzV2VsY29tZUZsaXBwZWQgPSBmYWxzZSxcbiAgLy8gICAgICAgYnV0dG9uVHJpZ2dlckZsaXAgPSAkKCcuYnRuLS1zaG93LWxvZ2luJyksXG4gIC8vICAgICAgIGZsaXBDb250YWluZXIgPSAkKCcuZmxpcC1jb250YWluZXInKTtcblxuXG4gIC8vICAgYnV0dG9uVHJpZ2dlckZsaXAub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cbiAgLy8gICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgLy8gICAgIGlzV2VsY29tZUZsaXBwZWQgPSB0cnVlO1xuICAvLyAgICAgZmxpcENvbnRhaW5lci5hZGRDbGFzcygnZmxpcCcpO1xuICAvLyAgICAgYnV0dG9uVHJpZ2dlckZsaXAuZmFkZVRvKDMwMCwgMCkuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAvLyAgIH0pO1xuXG5cbiAgLy8gICAkKCcud3JhcHBlci0td2VsY29tZSwgLmZvb3Rlci0td2VsY29tZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuICAgICAgXG4gIC8vICAgICAvLyDQtdGB0LvQuCDQutC70LjQutCw0LXQvCDQvdCwINC60LDRgNGC0L7Rh9C60LUsINGC0L4g0L/QtdGA0LXQstC+0YDQsNGH0LjQstCw0YLRjCDQvdC1INC90LDQtNC+XG4gIC8vICAgICBpZiAoZS50YXJnZXQuY2xvc2VzdCgnLndlbGNvbWVfX2NhcmQnKSAhPT0gbnVsbCkge1xuICAvLyAgICAgICByZXR1cm47XG4gIC8vICAgICB9XG4gIC8vICAgICAvLyDQtdGB0LvQuCDQutC70LjQutCw0LXQvCDQvdC1INC90LAg0LrQsNGA0YLQvtGH0LrQtSwg0YLQvlxuICAvLyAgICAgaWYgKGlzV2VsY29tZUZsaXBwZWQgJiYgXG4gIC8vICAgICAgICAgZS50YXJnZXQuaWQgIT0gYnV0dG9uVHJpZ2dlckZsaXAuYXR0cignaWQnKVxuICAvLyAgICAgICApIHtcblxuICAvLyAgICAgICBpc1dlbGNvbWVGbGlwcGVkID0gZmFsc2U7XG4gIC8vICAgICAgIGZsaXBDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2ZsaXAnKTtcbiAgLy8gICAgICAgYnV0dG9uVHJpZ2dlckZsaXAuZmFkZVRvKDMwMCwgMSwgZnVuY3Rpb24oKXtcbiAgLy8gICAgICAgICBidXR0b25UcmlnZ2VyRmxpcC5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAvLyAgICAgICB9KVxuICAvLyAgICAgfVxuXG4gIC8vICAgfSk7XG5cbiAgLy8gICAkKCcuYnRuLS1oaWRlLWxvZ2luJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cbiAgLy8gICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgLy8gICAgIGlzV2VsY29tZUZsaXBwZWQgPSBmYWxzZTtcbiAgLy8gICAgIGZsaXBDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2ZsaXAnKTtcbiAgLy8gICAgIGJ1dHRvblRyaWdnZXJGbGlwLmZhZGVUbygzMDAsIDEpLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG4gIC8vICAgfSk7XG5cbiAgLy8gfSkoKTsiLCJ2YXIgaGFtYnVyZ2VyTWVudSA9IChmdW5jdGlvbiAoKSB7XG5cblxuICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICBfc2V0VXBMaXN0bmVycygpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gX3NldFVwTGlzdG5lcnMgKCkge1xuICAgICQoJyNidXJnZXItYnRuJykub24oJ2NsaWNrJywgX3RvZ2dsZU1lbnUpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gX3RvZ2dsZU1lbnUoZSkge1xuXG4gICAgJCh0aGlzKS50b2dnbGVDbGFzcygnYnVyZ2VyLWJ0bi0tYWN0aXZlJyk7XG4gICAgJCgnYm9keScpLnRvZ2dsZUNsYXNzKCdvdmVyZm93LWhpZGRlbicpO1xuICAgICQoJy5tYWluLW1lbnUnKS50b2dnbGVDbGFzcygnbWFpbi1tZW51LS1vcGVuJyk7XG4gIH07XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXRcbiAgfTtcblxufSkoKTsiLCJ2YXIgbG9naW5Gb3JtID0gKGZ1bmN0aW9uICgpIHtcblxuICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICBfc2V0VXBMaXN0ZW5lcnMoKTtcbiAgfTtcblxuICBmdW5jdGlvbiBfc2V0VXBMaXN0ZW5lcnMgKCkge1xuICAgICQoJyNsb2dpbi1idG4nKS5vbignY2xpY2snLCBfc3VibWl0Rm9ybSk7XG4gICAgJCgnLmZvcm0tLWxvZ2luIGlucHV0Jykubm90KCcjbG9naW4tYnRuJykub24oJ2tleWRvd24nLCBfY2xlYXJFcnJvclN0eWxlcyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gX2NsZWFyRXJyb3JTdHlsZXMoKSB7XG4gICAgdmFsaWRhdGlvbi5jbGVhckVycm9yU3R5bGVzKCQodGhpcykpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3N1Ym1pdEZvcm0oZSkge1xuICAgIGNvbnNvbGUubG9nKCdzdWJtaXR0aW5nIExvZ2luIEZvcm0gJyk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhclxuICAgICAgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnLmZvcm0nKSxcbiAgICAgIGRhdGEgPSBmb3JtLnNlcmlhbGl6ZSgpO1xuXG4gICAgdmFsaWRhdGlvbi52YWxpZGF0ZUZvcm0oZm9ybSwgW3tcbiAgICAgIGlkOiAnaXNodW1hbicsXG4gICAgICB0eXBlOiAnY2hlY2tib3gnLFxuICAgICAgY2hlY2tlZDogdHJ1ZSxcbiAgICAgIGVycm9yTXNnOiAn0KDQvtCx0L7RgtCw0Lwg0LfQtNC10YHRjCDQvdC1INC80LXRgdGC0L4nXG4gICAgfSwge1xuICAgICAgaWQ6ICdub3Ryb2JvdC15ZXMnLFxuICAgICAgdHlwZTogJ3JhZGlvJyxcbiAgICAgIGNoZWNrZWQ6IHRydWUsXG4gICAgICBlcnJvck1zZzogJ9Cg0L7QsdC+0YLQsNC8INC30LTQtdGB0Ywg0L3QtSDQvNC10YHRgtC+J1xuICAgIH0sIHtcbiAgICAgIGlkOiAnbm90cm9ib3Qtbm8nLFxuICAgICAgdHlwZTogJ3JhZGlvJyxcbiAgICAgIGNoZWNrZWQ6IGZhbHNlLFxuICAgICAgZXJyb3JNc2c6ICfQoNC+0LHQvtGC0LDQvCDQt9C00LXRgdGMINC90LUg0LzQtdGB0YLQvidcbiAgICB9XSk7XG5cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdFxuICB9O1xuXG59KSgpO1xuIiwidmFyIHBhcmFsbGF4ID0gKGZ1bmN0aW9uICgpIHtcblxuXG4gIC8vINC40L3QuNGG0LjQsNC70YzQt9Cw0YbQuNGPINC80L7QtNGD0LvRj1xuICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICAvLyDQstC60LvRjtGH0LDQtdC8INC/0YDQvtGB0LvRg9GI0LrRgyBcbiAgICBfc2V0VXBMaXN0bmVycygpO1xuICAgIC8vINGB0YDQsNC30YMg0LbQtSDQuNGJ0LXQvCDRiNC40YDQuNC90YMg0Lgg0LLRi9GB0L7RgtGDINC/0LDRgNCw0LvQu9Cw0LrRgdCwXG4gICAgX3BhcmFsbGF4UmVzaXplKCk7XG4gIH07XG5cbiAgdmFyIFxuICAgICAgLy8g0YHQutC+0YDQvtGB0YLRjCDQuCDRgNCw0LfQvNCw0YUg0LTQstC40LbQtdC90LjRjyDRgdC70L7QtdCyXG4gICAgICBfc3BlZWQgPSAxIC8gNTAsXG4gICAgICBfd2luZG93ICAgID0gJCh3aW5kb3cpLFxuICAgICAgX3dXaWR0aCAgPSBfd2luZG93LmlubmVyV2lkdGgoKSxcbiAgICAgIF93SGVpZ2h0ID0gX3dpbmRvdy5pbm5lckhlaWdodCgpLFxuICAgICAgX2hhbGZXaWR0aCAgPSBfd2luZG93LmlubmVyV2lkdGgoKSAvIDIsXG4gICAgICBfaGFsZkhlaWdodCA9IF93aW5kb3cuaW5uZXJIZWlnaHQoKSAvIDIsXG4gICAgICBfbGF5ZXJzICA9ICQoJy5wYXJhbGxheCcpLmZpbmQoJy5wYXJhbGxheF9fbGF5ZXInKTtcblxuXG5cbiAgLy8g0YPRgdGC0LDQvdCw0LLQu9C80LLQsNC10Lwg0L/RgNC+0YHQu9GD0YjQutGDINC90LAg0LTQstC40LbQtdC90LjQtSDQvNGL0YjQuCDQuCDRgNC10YHQsNC50Lcg0L7QutC90LBcbiAgZnVuY3Rpb24gX3NldFVwTGlzdG5lcnMgKCkge1xuICAgICQod2luZG93KS5vbignbW91c2Vtb3ZlJywgX3BhcmFsbGF4TW92ZSk7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBfcGFyYWxsYXhSZXNpemUpO1xuICB9O1xuXG4gIC8vINGE0YPQvdC60YbQuNGPINC/0LXRgNC10YHRh9C40YLRi9Cy0LDQtdGCINGI0LjRgNC40L3RgyDQuCDQstGL0YHQvtGC0YMg0LTQu9GPINGB0LvQvtC10LIg0L/QsNGA0LDQu9C70LDQutGB0LBcbiAgZnVuY3Rpb24gX3BhcmFsbGF4UmVzaXplKCkge1xuXG5cbiAgICAvLyDQutCw0LbQtNGL0Lkg0YDQsNC3INC/0YDQuCDRgNC10YHQsNC50LfQtSDQv9C10YDQtdGB0YfQuNGC0LDRi9Cy0LDQtdC8INGA0LDQt9C80LXRgNGLINC+0LrQvdCwXG4gICAgdmFyIFxuICAgICAgX3dXaWR0aCAgPSBfd2luZG93LmlubmVyV2lkdGgoKSxcbiAgICAgIF93SGVpZ2h0ID0gX3dpbmRvdy5pbm5lckhlaWdodCgpLFxuICAgICAgX2hhbGZIZWlnaHQgPSBfd2luZG93LmlubmVySGVpZ2h0KCkgLyAyO1xuXG4gICAgLy8g0LjRidC10Lwg0LzQsNC60YHQuNC80LDQu9GM0L3Ri9C5INC90L7QvNC10YAg0YHQu9C+0Y9cbiAgICB2YXIgbWF4SW5kZXggPSBfbGF5ZXJzLmxlbmd0aCAtMTtcblxuICAgIC8vINGDINC60LDRgNGC0LjQvdC60Lgg0LHRg9C00YPRgiDQvtGC0YHRgtGD0L/RiyDRgdC/0YDQsNCy0LAg0Lgg0YHQu9C10LLQsCwg0YfRgtC+0LHRiyDQv9Cw0YDQsNC70LvQsNC60YEg0L/QvtC70L3QvtGB0YLRjNGOINC/0L7QvNC10YnQsNC70YHRjy5cbiAgICAvLyDQvtGC0YHRgtGD0L/RiyDRgNCw0LLQvdGLINC80LDQutGB0LjQvNCw0LvRjNC90L7QvNGDINGB0LTQstC40LPRgyDRgdC70L7QtdCyXG4gICAgLy8gKNGB0LDQvNGL0Lkg0L/QvtGB0LvQtdC00L3QuNC5INGB0LvQvtC5INC00LLQuNCz0LDQtdGC0YHRjyDQsdC+0LvRjNGI0LUg0LLRgdC10YUsINGC0LDQuiDRh9GC0L4g0LjRidC10Lwg0LjQvNC10L3QvdC90L4g0LXQs9C+INC80LDQutGB0LjQvNCw0LvRjNC90YvQuSDRgdC00LLQuNCzKVxuICAgIHZhciBtYXhTaGlmdFggPSBfaGFsZldpZHRoICogbWF4SW5kZXggKiBfc3BlZWQsXG5cblxuICAgICAgICAvLyDRiNC40YDQuNC90LAgXCLRgNCw0YHRiNC40YDQtdC90L3QvtC5XCIg0LrQsNGA0YLQuNC90LrQuDog0YjQuNGA0LjQvdCwINC+0LrQvdCwICsgMiDQvtGC0YHRgtGD0L/QsFxuICAgICAgICB3aWR0aFdpZGVyID0gX3dXaWR0aCArIChtYXhTaGlmdFggKiAyKSxcblxuICAgICAgICAvL9GB0L7QvtGC0L3QvtGI0LXQvdC40LUg0YHRgtC+0YDQvtC9INGN0LrRgNCw0L3QsCAo0LLRi9GB0L7RgtGDINGN0LrRgNCw0L3QsCDQtNC10LvQuNC8INC90LAg0YjQuNGA0LjQvdGDIFwi0YDQsNGB0YjQuNGA0LXQvdC90L7QuVwiINC60LDRgNGC0LjQvdC60LgpXG4gICAgICAgIHdpbmRvd1JhdGlvID0gKF93SGVpZ2h0IC8gd2lkdGhXaWRlciksXG5cbiAgICAgICAgLy/RgdC+0L7RgtC90L7RiNC10L3QuNC1INGB0YLQvtGA0L7QvSDRgNC10LDQu9GM0L3QvtC5INC60LDRgNGC0LjQvdC60LhcbiAgICAgICAgcGljdHVyZVJhdGlvID0gKDE5OTQgLyAzMDAwKTtcblxuXG4gICAgLy8g0LXRgdC70Lgg0LrQsNGA0YLQuNC90LrQsCDQv9C+0LzQtdGJ0LDQtdGC0YHRjyDQsiDRjdC60YDQsNC9INC/0L4g0LLRi9GB0L7RgtC1LCDRgtC+INC90LDQtNC+INC10LUg0YPQstC10LvQuNGH0LjRgtGMXG4gICAgaWYgKCB3aW5kb3dSYXRpbyA+IHBpY3R1cmVSYXRpbyApIHtcbiAgICAgIC8vINCy0YvRgdC+0YLQsCA9INCy0YvRgdC+0YLQtSDRjdC60YDQsNC90LAsINCy0YHQtSDQvtGB0YLQsNC70YzQvdC+0LUg0YDQsNGB0YHRh9C40YLRi9Cy0LDQtdC8LCDQuNGB0YXQvtC00Y8g0LjQtyDRjdGC0L7QuSDQstGL0YHQvtGC0YtcbiAgICAgIHBhcmFsbGF4SGVpZ2h0ID0gX3dIZWlnaHQgKyAncHgnO1xuICAgICAgcGFyYWxsYXhXaWR0aCA9IF93SGVpZ2h0IC8gcGljdHVyZVJhdGlvO1xuICAgICAgcGFyYWxsYXhNYXJnaW5MZWZ0ID0gKHBhcmFsbGF4V2lkdGggIC0gX3dXaWR0aCkgLyAyO1xuXG4gICAgLy8g0LXRgdC70Lgg0LrQsNGA0YLQuNC90LrQsCDQvdC1INC/0L7QvNC10YnQsNC10YLRgdGPINCyINGN0LrRgNCw0L0g0L/QviDQstGL0YHQvtGC0LUsINGC0L4g0LLRi9GB0L7RgtCwINCx0YPQtNC10YIg0YDQsNGB0YHRh9C40YLRi9Cy0LDRgtGM0YHRjyDQsNCy0YLQvtC80LDRgtC40YfQtdGB0LrQuFxuICAgIC8vINCx0YPQtNC10Lwg0LLRi9GA0LDQstC90LjQstCw0YLRjCDQv9C+INGI0LjRgNC40L3QtVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vINGI0LjRgNC40L3QsCA9INGI0LjRgNC40L3QtSDRjdC60YDQsNC90LAgKCsgMiDQvtGC0YHRgtGD0L/QsCksINCy0YHQtSDQvtGB0YLQsNC70YzQvdC+0LUg0YDQsNGB0YHRh9C40YLRi9Cy0LDQtdC8LCDQuNGB0YXQvtC00Y8g0LjQtyDRjdGC0L7QuSDRiNC40YDQuNC90YtcbiAgICAgIHBhcmFsbGF4V2lkdGggPSB3aWR0aFdpZGVyO1xuICAgICAgcGFyYWxsYXhIZWlnaHQgPSAnYXV0byc7XG4gICAgICBwYXJhbGxheE1hcmdpbkxlZnQgPSBtYXhTaGlmdFg7XG5cbiAgICB9XG5cbiAgICAvLyDQv9C+0LTRgdGC0LDQstC70Y/QtdC8INC90LDQudC00LXQvdC90YvQtSDQt9C90LDRh9C10L3QuNGPINGI0LjRgNC40L3Riywg0LLRi9GB0L7RgtGLINC4IG1hcmdpbi1sZWZ0INCy0YHQtdC8INGB0LvQvtGP0LxcbiAgICBfbGF5ZXJzLmNzcygge1xuICAgICAgJ3dpZHRoJzogcGFyYWxsYXhXaWR0aCArICdweCcsXG4gICAgICAnaGVpZ2h0JzogcGFyYWxsYXhIZWlnaHQsXG4gICAgICAnbWFyZ2luLWxlZnQnOiAnLScgKyBwYXJhbGxheE1hcmdpbkxlZnQgKyAncHgnXG4gICAgfSk7XG5cblxuICAgICQuZWFjaChfbGF5ZXJzLCBmdW5jdGlvbihpbmRleCwgZWxlbSl7XG4gICAgICAvLyB0b3BTaGlmdCAtINGN0YLQviDQstC10LvQuNGH0LjQvdCwLCDQvdCwINC60L7RgtC+0YDRg9GOINC90YPQttC90L4g0YHQtNCy0LjQvdGD0YLRjCDQutCw0LbQtNGL0Lkg0YHQu9C+0Lkg0LLQvdC40LcsINGH0YLQvtCx0Ysg0L3QtSDQsdGL0LvQviDQstC40LTQvdC+INC60YDQsNC10LIgXG4gICAgICB0b3BTaGlmdCA9ICAoX2hhbGZIZWlnaHQgKiBpbmRleCAqIF9zcGVlZCk7XG4gICAgICAkKGVsZW0pLmNzcyh7XG4gICAgICAgICd0b3AnOiB0b3BTaGlmdCArICdweCcsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgfTtcblxuXG5cblxuICAvLyDRhNGD0L3QutGG0LjRjyDQtNCy0LjQs9Cw0LXRgiDRgdC70L7QuCDQsiDQt9Cw0LLQuNGB0LjQvNC+0YHRgtC4INC+0YIg0L/QvtC70L7QttC10L3QuNGPINC80YvRiNC4XG4gIGZ1bmN0aW9uIF9wYXJhbGxheE1vdmUgKGUpIHtcblxuICAgIHZhciBcbiAgICAgICAgLy8g0L/QvtC70L7QttC10L3QuNC1INC80YvRiNC4XG4gICAgICAgIG1vdXNlWCAgPSBlLnBhZ2VYLFxuICAgICAgICBtb3VzZVkgID0gZS5wYWdlWSxcblxuICAgICAgICAvLyDQv9C+0LvQvtC20LXQvdC40LUg0LzRi9GI0Lgg0LIg0L3QsNGI0LXQuSDQvdC+0LLQvtC5INGB0LjRgdGC0LXQvNC1INC60L7QvtGA0LTQuNC90LDRgiAo0YEg0YbQtdC90YLRgNC+0Lwg0LIg0YHQtdGA0LXQtNC40L3QtSDRjdC60YDQsNC90LApXG4gICAgICAgIGNvb3JkWCAgPSBfaGFsZldpZHRoIC0gbW91c2VYLFxuICAgICAgICBjb29yZFkgID0gX2hhbGZIZWlnaHQgLSBtb3VzZVk7XG5cbiAgICAgICAgLy8gbW92ZSBlYWNoIGxheWVyXG4gICAgICAgICQuZWFjaChfbGF5ZXJzLCBmdW5jdGlvbihpbmRleCwgZWxlbSl7XG5cbiAgICAgICAgICAvLyDRgNCw0YHRgdGH0LjRgtGL0LLQsNC10Lwg0LTQu9GPINC60LDQttC00L7Qs9C+INGB0LvQvtGPLCDQvdCwINGB0LrQvtC70YzQutC+INC10LPQviDRgdC00LLQuNCz0LDRgtGMXG4gICAgICAgICAgdmFyIHNoaWZ0WCA9IE1hdGgucm91bmQoY29vcmRYICogaW5kZXggKiBfc3BlZWQpLFxuICAgICAgICAgICAgICBzaGlmdFkgPSBNYXRoLnJvdW5kKGNvb3JkWSAqIGluZGV4ICogX3NwZWVkKSxcbiAgICAgICAgICAgICAgLy8gdG9wU2hpZnQgLSDRjdGC0L4g0LLQtdC70LjRh9C40L3QsCwg0L3QsCDQutC+0YLQvtGA0YPRjiDQvdGD0LbQvdC+INGB0LTQstC40L3Rg9GC0Ywg0LrQsNC20LTRi9C5INGB0LvQvtC5INCy0L3QuNC3LCDRh9GC0L7QsdGLINC90LUg0LHRi9C70L4g0LLQuNC00L3QviDQutGA0LDQtdCyIFxuICAgICAgICAgICAgICB0b3BTaGlmdCA9ICAoX2hhbGZIZWlnaHQgKiBpbmRleCAqIF9zcGVlZCk7XG5cbiAgICAgICAgICAkKGVsZW0pLmNzcyh7XG4gICAgICAgICAgICAndG9wJzogdG9wU2hpZnQgKyAncHgnLFxuICAgICAgICAgICAgJ3RyYW5zZm9ybSc6ICd0cmFuc2xhdGUzZCgnICsgc2hpZnRYICsgJ3B4LCAnICsgc2hpZnRZICsgJ3B4LCAnICsgJyAwKSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdFxuICB9O1xuXG59KSgpO1xuXG4iLCJ2YXIgc2Nyb2xsQnV0dG9ucyA9IChmdW5jdGlvbiAoKSB7XG5cblxuICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICBfc2V0VXBMaXN0bmVycygpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gX3NldFVwTGlzdG5lcnMgKCkge1xuICAgICQoJy5zY3JvbGwtY29udHJvbC0tZG93bicpLm9uKCdjbGljaycsIF9zY3JvbGxEb3duKVxuICAgICQoJy5zY3JvbGwtY29udHJvbC0tdXAnKS5vbignY2xpY2snLCBfc2Nyb2xsVXApXG4gIH07XG5cblxuICBmdW5jdGlvbiBfc2Nyb2xsVXAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBfc2Nyb2xsVG8oICcwJywgNzAwICk7XG4gIH07XG5cblxuICBmdW5jdGlvbiBfc2Nyb2xsRG93bihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIF9zY3JvbGxUbyggJChcIi5oZWFkZXJcIikuaGVpZ2h0KCkgLCA1MDApO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gX3Njcm9sbFRvKHBvcywgZHVyYXRpb24pe1xuICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgIHNjcm9sbFRvcDogcG9zXG4gICAgfSwgZHVyYXRpb24pO1xuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXRcbiAgfTtcblxufSkoKTsiLCJ2YXIgc2tpbGxzQW5pbWF0aW9uID0gKGZ1bmN0aW9uICgpIHtcblxuXG4gIGZ1bmN0aW9uIGluaXQgKCkge1xuICAgIF9zZXRVcExpc3RuZXJzKCk7XG4gIH07XG5cblxuICBmdW5jdGlvbiBfc2V0VXBMaXN0bmVycyAoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdzY3JvbGwnLCBfc2Nyb2xsKTtcbiAgfTtcblxuICAvLyDQtdGB0LvQuCDQtNC+0YHQutGA0L7Qu9C70LjQu9C4INC00L4g0LHQu9C+0LrQsCDRgdC+INGB0LrQuNC70LDQvNC4LCDRgtC+INC/0L7QutCw0LfRi9Cy0LDQtdC8INC40YVcbiAgZnVuY3Rpb24gX3Njcm9sbChlKSB7XG4gICAgXG4gICAgd1Njcm9sbCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTtcbiAgICBza2lsbHNUb3AgPSAkKCcuc2tpbGxzLWJsb2NrJykub2Zmc2V0KCkudG9wIC0gMjAwO1xuXG4gICAgaWYgKHdTY3JvbGwgPiBza2lsbHNUb3ApIHtcbiAgICAgIF9zaG93U2tpbGxzKCk7XG4gICAgfVxuXG4gICAgXG4gIH1cblxuXG4gIC8vINGE0YPQvdC60YbQuNGPINC/0L7QutCw0LfRi9Cy0LDQtdGCINC4INCw0L3QuNC80LjRgNGD0LXRgiDRgdC60LjQu9GLLlxuICBmdW5jdGlvbiBfc2hvd1NraWxscygpe1xuXG4gICAgdmFyIGFyYywgY2lyY3VtZmVyZW5jZTtcbiAgICB2YXIgdGltZSA9IDA7XG4gICAgdmFyIGRlbGF5ID0gMTUwO1xuXG4gICAgJCgnY2lyY2xlLmlubmVyJykuZWFjaChmdW5jdGlvbihpLCBlbCl7XG4gICAgICBcbiAgICAgIHZhciBhcmMgPSBNYXRoLmNlaWwoJChlbCkuZGF0YSgnYXJjJykpO1xuICAgICAgdmFyIGNpcmN1bWZlcmVuY2UgPSBNYXRoLmNlaWwoJChlbCkuZGF0YSgnY2lyY3VtZmVyZW5jZScpKTtcblxuICAgICAgLy8g0LDQvdC40LzQuNGA0YPQtdC8INC60LDQttC00YvQuSDQutGA0YPQsyDRgSDQsdC+0LvRjNGI0LXQuSDQt9Cw0LTQtdGA0LbQutC+0LlcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICAkKGVsKS5jbG9zZXN0KCcuc2tpbGxzX19pdGVtJykuYW5pbWF0ZSh7XG4gICAgICAgICAgJ29wYWNpdHknOiAnMSdcbiAgICAgICAgfSwgMzAwKTtcblxuICAgICAgICAkKGVsKS5jc3MoJ3N0cm9rZS1kYXNoYXJyYXknLCBhcmMrJ3B4ICcgKyBjaXJjdW1mZXJlbmNlICsgJ3B4Jyk7XG5cbiAgICAgIH0sIHRpbWUgKz0gZGVsYXkgKTtcbiAgICB9KTtcblxuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXRcbiAgfTtcblxufSkoKTsiLCJ2YXIgc2xpZGVyVGl0bGVzQW5pbWF0aW9uID0gKGZ1bmN0aW9uICgpIHtcblxuICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICBfYW5pbWF0ZVRpdGxlcygpO1xuICB9O1xuXG5cbiAgLy8g0YTRg9C90LrRhtC40Y8g0L/RgNC+0YXQvtC00LjRgiDQv9C+INCy0YHQtdC8INC30LDQs9C+0LvQvtCy0LrQsNC8INGB0LvQsNC50LTQtdGA0LAuINGE0YPQvdC60YbQuNGPINCz0LXQvdC10YDQuNGA0YPQtdGCIGh0bWwt0LrQvtC0LCBcbiAgLy8g0LfQsNCy0L7RgNCw0YfQuNCy0LDRjtGJ0LjQuSDQstGB0LUg0LHRg9C60LLRiyDQuCDRgdC70L7QstCwINCyIGh0bWwt0YLQtdCz0Lgg0LTQu9GPINC00LDQu9GM0L3QtdC50YjQtdC5INGA0LDQsdC+0YLRiyDRgSDQvdC40LzQuCDRgSDQv9C+0LzQvtGJ0YzRjiBjc3NcbiAgZnVuY3Rpb24gX2FuaW1hdGVUaXRsZXMoKSB7XG5cbiAgICB2YXIgXG4gICAgICBfdGl0bGVzID0gJCgnLnNsaWRlcl9faW5mbyAuc2VjdGlvbi10aXRsZV9faW5uZXInKSxcbiAgICAgIGluamVjdDtcblxuXG4gICAgLy8g0LrQsNC20LTRi9C5INC30LDQs9C+0LvQvtCy0L7QulxuICAgIF90aXRsZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgXG4gICAgICB2YXIgXG4gICAgICAgICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgdGl0bGVUZXh0ID0gJHRoaXMudGV4dCgpO1xuXG4gICAgICAvLyDQvtGH0LjRidCw0LXQvCDQt9Cw0LPQvtC70L7QstC+0LosINGH0YLQvtCx0Ysg0L/QvtGC0L7QvCDQstGB0YLQsNCy0LjRgtGMINGC0YPQtNCwINGB0LPQtdC90LXRgNC40YDQvtCy0LDQvdC90YvQuSDQutC+0LRcbiAgICAgICR0aGlzLmh0bWwoJycpO1xuXG4gICAgICAvLyDRgdGH0LXRgtGH0LjQuiDQtNC70Y8g0L3QvtC80LXRgNC+0LIg0LHRg9C60LIg0LIg0LfQsNCz0L7Qu9C+0LLQutC1XG4gICAgICB2YXIgaSA9IDA7XG5cbiAgICAgIC8vINGA0LDQsdC+0YLQsNC10Lwg0YEg0LrQsNC20LTRi9C8INGB0LvQvtCy0L7QvDogXG4gICAgICAkLmVhY2godGl0bGVUZXh0LnNwbGl0KCcgJyksIGZ1bmN0aW9uKGMsIHdvcmQpIHtcblxuICAgICAgICAgIC8vINC+0YfQuNGJ0LDQtdC8INGB0LvQvtCy0L5cbiAgICAgICAgICBpbmplY3QgPSAnJztcblxuICAgICAgICAgIC8vINC60LDQttC00LDRjyDQsdGD0LrQstCwINC30LDQstC10YDQvdGD0YLQsCDQsiBzcGFuINGBINC60LvQsNGB0YHQsNC80LggY2hhci0tMSwgY2hhci0tMiwgLi4uIC4gXG4gICAgICAgICAgLy8g0L3QsCDQvtGB0L3QvtCy0LDQvdC40Lgg0Y3RgtC40YUg0LrQu9Cw0YHRgdC+0LIg0LHRg9C60LLQsNC8INCyIGNzcyDQv9GA0L7RgdGC0LDQstC70Y/QtdGC0YHRjyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LkgYW5pbWF0aW9uLWRlbGF5LlxuICAgICAgICAgICQuZWFjaCh3b3JkLnNwbGl0KCcnKSwgZnVuY3Rpb24oaywgY2hhcikge1xuICAgICAgICAgICAgaW5qZWN0ICs9ICc8c3BhbiBjbGFzcz1cImNoYXIgY2hhci0tJyArIGkgKyAnXCI+JyArIGNoYXIgKyAnPC9zcGFuPic7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvLyDQutCw0LbQtNC+0LUg0YHQu9C+0LLQviDQt9Cw0LLQtdGA0L3Rg9GC0L4g0LIgc3BhbiBjbGFzcz1cIndvcmRcIiwg0YfRgtC+0LHRiyDRgNC10YjQuNGC0Ywg0L/RgNC+0LHQu9C10LzRgyDRgSDQv9C10YDQtdC90L7RgdC+0Lwg0YHRgtGA0L7QuiDQv9C+0YHRgNC10LTQuCDRgdC70L7QstCwXG4gICAgICAgICAgdmFyIHdvcmQgPSAnPHNwYW4gY2xhc3M9XCJ3b3JkXCI+JyArIGluamVjdCArICc8L3NwYW4+JztcblxuXG4gICAgICAgICAgJHRoaXMuYXBwZW5kKHdvcmQpO1xuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfTtcblxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdFxuICB9O1xuXG59KSgpO1xuIiwidmFyIHNsaWRlciA9IChmdW5jdGlvbiAoKSB7XG5cbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgX3NldFVwTGlzdG5lcnMoKTtcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIF9zZXRVcExpc3RuZXJzICgpIHtcbiAgICAkKCcuc2xpZGVyX19jb250cm9sJykub24oJ2NsaWNrJywgX21vdmVTbGlkZXIpO1xuICB9O1xuXG5cbiAgLy8g0YPQvNC10L3RjNGI0LDQtdGCINC90L7QvNC10YAg0YHQu9Cw0LnQtNCwINC90LAg0LXQtNC40L3QuNGG0YMgKNC10YHQu9C4INC90LDQtNC+LCDQt9Cw0LrQvtC70YzRhtC+0LLRi9Cy0LDQtdGCKVxuICBmdW5jdGlvbiBfaW5kZXhEZWMoYWN0aXZlSW5kZXgsIG1heEluZGV4KSB7XG4gICAgICB2YXIgcHJldkluZGV4ID0gKGFjdGl2ZUluZGV4IDw9ICAgMCAgKSA/IG1heEluZGV4IDogYWN0aXZlSW5kZXggLSAxO1xuICAgICAgcmV0dXJuIHByZXZJbmRleDtcbiAgfTtcblxuXG4gIC8vINGD0LLQtdC70LjRh9C40LLQsNC10YIg0L3QvtC80LXRgCDRgdC70LDQudC00LAg0L3QsCDQtdC00LjQvdC40YbRgyAo0LXRgdC70Lgg0L3QsNC00L4sINC30LDQutC+0LvRjNGG0L7QstGL0LLQsNC10YIpXG4gIGZ1bmN0aW9uIF9pbmRleEluYyhhY3RpdmVJbmRleCwgbWF4SW5kZXgpIHtcbiAgICAgIHZhciBuZXh0SW5kZXggPSAoYWN0aXZlSW5kZXggPj0gbWF4SW5kZXgpID8gICAwICAgOiBhY3RpdmVJbmRleCArIDE7XG4gICAgICByZXR1cm4gbmV4dEluZGV4O1xuICB9O1xuXG5cbiAgLy8g0YTRg9C90LrRhtC40Y8g0LDQvdC40LzQuNGA0YPQtdGCINC80LDQu9C10L3RjNC60LjQtSDRgdC70LDQudC00LXRgNGLIChwcmV2LCBuZXh0KVxuICAvLyBkaXJlY3Rpb24gLSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INGB0LvQsNC50LTQtdGA0LAsINC/0YDQuNC90LjQvNCw0LXRgiDQt9C90LDRh9C10L3QuNGPICd1cCcvJ2Rvd24nLCDQstC90LjQty/QstCy0LXRgNGFXG4gIC8vIGNvbnRyb2wgLSDRgdC70LDQudC00LXRgCwg0LrQvtGC0L7RgNGL0Lkg0L3Rg9C20L3QviDQv9GA0L7QsNC90LjQvNC40YDQvtCy0LDRgtGMOiDQu9C10LLRi9C5INC40LvQuCDQv9GA0LDQstGL0LlcbiAgLy8gbmV3SW5kZXggLSDQvdC+0LzQtdGAINGB0LvQsNC50LTQsCwg0LrQvtGC0L7RgNGL0Lkg0L/QvtC60LDQt9Cw0YLRjCDRgdC70LXQtNGD0Y7RiNC40LxcbiAgZnVuY3Rpb24gX21vdmVTbWFsbFNsaWRlcihkaXJlY3Rpb24sIGNvbnRyb2wsIG5ld0luZGV4KSB7XG4gICAgdmFyIFxuICAgICAgaXRlbXMgPSBjb250cm9sLmZpbmQoJy5jb250cm9sX19pdGVtJyksXG4gICAgICBvbGRJdGVtID0gY29udHJvbC5maW5kKCcuY29udHJvbF9faXRlbS0tYWN0aXZlJyksXG4gICAgICBuZXdJdGVtID0gaXRlbXMuZXEobmV3SW5kZXgpO1xuXG5cbiAgICAgIG9sZEl0ZW0ucmVtb3ZlQ2xhc3MoJ2NvbnRyb2xfX2l0ZW0tLWFjdGl2ZScpO1xuICAgICAgbmV3SXRlbS5hZGRDbGFzcygnY29udHJvbF9faXRlbS0tYWN0aXZlJyk7XG5cblxuICAgIGlmIChkaXJlY3Rpb24gPT0gJ3VwJykge1xuXG4gICAgICAgIG5ld0l0ZW0uY3NzKCd0b3AnLCAnMTAwJScpO1xuICAgICAgICBvbGRJdGVtLmFuaW1hdGUoeyd0b3AnOiAnLTEwMCUnfSwgMzAwKTtcbiAgICAgICAgbmV3SXRlbS5hbmltYXRlKHsndG9wJzogJzAnfSwgMzAwKTtcblxuICAgIH07XG4gICAgaWYgKGRpcmVjdGlvbiA9PSAnZG93bicpIHtcblxuICAgICAgICBuZXdJdGVtLmNzcygndG9wJywgJy0xMDAlJyk7XG4gICAgICAgIG9sZEl0ZW0uYW5pbWF0ZSh7J3RvcCc6ICcxMDAlJ30sIDMwMCk7XG4gICAgICAgIG5ld0l0ZW0uYW5pbWF0ZSh7J3RvcCc6ICcwJ30sIDMwMCk7XG4gICAgICBcbiAgICB9O1xuICB9O1xuXG5cbiAgLy8g0YTRg9C90LrRhtC40Y8g0LDQvdC40LzQuNGA0YPQtdGCINCx0L7Qu9GM0YjQvtC5INGB0LvQsNC50LTQtdGAXG4gIC8vIGluZGV4VG9IaWRlIC0g0YHQu9Cw0LnQtCwg0LrQvtGC0L7RgNGL0Lkg0L3Rg9C20L3QviDRgdC60YDRi9GC0YxcbiAgLy8gaW5kZXhUb1Nob3cgLSDRgdC70LDQudC0LCDQutC+0YLQvtGA0YvQuSDQvdGD0LbQvdC+INC/0L7QutCw0LfQsNGC0YxcbiAgLy8gaXRlbXMgLSDQstGB0LUg0YHQu9Cw0LnQtNGLXG4gIGZ1bmN0aW9uIF9kaXNwbGF5U2xpZGUoaW5kZXhUb0hpZGUsIGluZGV4VG9TaG93LCBpdGVtcykge1xuXG4gICAgdmFyIFxuICAgICAgaXRlbVRvSGlkZSA9IGl0ZW1zLmVxKGluZGV4VG9IaWRlKSxcbiAgICAgIGl0ZW1Ub1Nob3cgPSBpdGVtcy5lcShpbmRleFRvU2hvdyk7XG5cbiAgICBpdGVtVG9IaWRlLnJlbW92ZUNsYXNzKCdzbGlkZXJfX2l0ZW0tLWFjdGl2ZScpO1xuICAgIGl0ZW1Ub0hpZGUuYW5pbWF0ZSh7J29wYWNpdHknOiAnMCd9LCAxNTApO1xuXG4gICAgaXRlbVRvU2hvdy5hZGRDbGFzcygnc2xpZGVyX19pdGVtLS1hY3RpdmUnKTtcbiAgICBpdGVtVG9TaG93LmRlbGF5KDE1MCkuYW5pbWF0ZSh7J29wYWNpdHknOiAnMSd9LCAxNTApO1xuICB9O1xuXG5cbiAgLy8g0YTRg9C90LrRhtC40Y8g0LDQvdC40LzQuNGA0YPQtdGCINGB0LvQsNC50LTQtdGAINGBINC40L3RhNC+0YDQvNCw0YbQuNC10LlcbiAgLy8gaW5kZXhUb0hpZGUgLSDRgdC70LDQudC0LCDQutC+0YLQvtGA0YvQuSDQvdGD0LbQvdC+INGB0LrRgNGL0YLRjFxuICAvLyBpbmRleFRvU2hvdyAtINGB0LvQsNC50LQsINC60L7RgtC+0YDRi9C5INC90YPQttC90L4g0L/QvtC60LDQt9Cw0YLRjFxuICAvLyBpbmZvSXRlbXMgLSDQstGB0LUg0YHQu9Cw0LnQtNGLINGBINC40L3RhNC+0YDQvNCw0YbQuNC10LlcbiAgZnVuY3Rpb24gX2Rpc3BsYXlJbmZvKGluZGV4VG9IaWRlLCBpbmRleFRvU2hvdywgaW5mb0l0ZW1zKSB7XG4gICAgaW5mb0l0ZW1zLmVxKGluZGV4VG9IaWRlKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIGluZm9JdGVtcy5lcShpbmRleFRvU2hvdykuY3NzKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpO1xuICB9XG5cblxuXG5cbiAgLy8g0YTRg9C90LrRhtC40Y8g0L7Qv9C10YDQtdC00LXQu9GP0LXRgiwg0L/QviDQutCw0LrQvtC80YMg0LrQvtC90YLRgNC+0LvRgyDQvNGLINC60LvQuNC60L3Rg9C70Lgg0Lgg0LLRi9C30YvQstCw0LXRgiDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LU6XG4gIC8vIF9kaXNwbGF5SW5mbywg0YfRgtC+0LHRiyDQv9C+0LrQsNC30LDRgtGMINC90YPQttC90YPRjiDQuNC90YTQvtGA0LzQsNGG0LjRjlxuICAvLyBfZGlzcGxheVNsaWRlLiwg0YfRgtC+0LHRiyDQv9C+0LrQsNC30LDRgtGMINC90YPQttC90YvQuSDRgdC70LDQudC0XG4gIC8vIF9tb3ZlU21hbGxTbGlkZXIsINGH0YLQvtCx0Ysg0L/RgNC+0LDQvdC40LzQuNGA0L7QstCw0YLRjCBwcmV2IGNvbnRyb2wgXG4gIC8vIF9tb3ZlU21hbGxTbGlkZXIsINGH0YLQvtCx0Ysg0L/RgNC+0LDQvdC40LzQuNGA0L7QstCw0YLRjCBuZXh0IGNvbnRyb2wgXG4gIGZ1bmN0aW9uIF9tb3ZlU2xpZGVyIChlKSB7XG5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgdmFyXG4gICAgICAgICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgY29udGFpbmVyID0gJHRoaXMuY2xvc2VzdCgnLnNsaWRlcicpLFxuICAgICAgICBpdGVtcyA9IGNvbnRhaW5lci5maW5kKCcuc2xpZGVyX19pdGVtJyksXG4gICAgICAgIGluZm9JdGVtcyA9IGNvbnRhaW5lci5maW5kKCcuc2xpZGVyX19pdGVtLWluZm8nKSxcbiAgICAgICAgbWF4SW5kZXggPSBpdGVtcy5sZW5ndGggLSAxLFxuICAgICAgICBwcmV2Q29udHJvbCA9IGNvbnRhaW5lci5maW5kKCcuc2xpZGVyX19jb250cm9sLS1wcmV2JyksXG4gICAgICAgIG5leHRDb250cm9sID0gY29udGFpbmVyLmZpbmQoJy5zbGlkZXJfX2NvbnRyb2wtLW5leHQnKSxcbiAgICAgICAgYWN0aXZlSXRlbSA9IGNvbnRhaW5lci5maW5kKCcuc2xpZGVyX19pdGVtLS1hY3RpdmUnKSxcbiAgICAgICAgYWN0aXZlSW5kZXggPSBpdGVtcy5pbmRleChhY3RpdmVJdGVtKSxcbiAgICAgICAgcHJldkluZGV4ID0gX2luZGV4RGVjKGFjdGl2ZUluZGV4LCBtYXhJbmRleCksXG4gICAgICAgIG5leHRJbmRleCA9IF9pbmRleEluYyhhY3RpdmVJbmRleCwgbWF4SW5kZXgpO1xuXG4gICAgICAvLyDQv9C+0LrQsNC30LDRgtGMINC/0YDQtdC00YvQtNGD0YnQuNC5INGB0LvQsNC50LRcbiAgICAgIGlmICggJHRoaXMuaGFzQ2xhc3MoJ3NsaWRlcl9fY29udHJvbC0tcHJldicpICkge1xuXG4gICAgICAgIHZhciBwcmV2SW5kZXhEZWMgPSBfaW5kZXhEZWMocHJldkluZGV4LCBtYXhJbmRleCk7XG4gICAgICAgIHZhciBuZXh0SW5kZXhEZWMgPSBfaW5kZXhEZWMobmV4dEluZGV4LCBtYXhJbmRleCk7XG5cbiAgICAgICAgX2Rpc3BsYXlTbGlkZShhY3RpdmVJbmRleCwgcHJldkluZGV4LCBpdGVtcyk7XG4gICAgICAgIF9kaXNwbGF5SW5mbyhhY3RpdmVJbmRleCwgcHJldkluZGV4LCBpbmZvSXRlbXMpO1xuXG4gICAgICAgIF9tb3ZlU21hbGxTbGlkZXIoJ3VwJywgcHJldkNvbnRyb2wsIHByZXZJbmRleERlYyk7XG4gICAgICAgIF9tb3ZlU21hbGxTbGlkZXIoJ2Rvd24nLCBuZXh0Q29udHJvbCwgbmV4dEluZGV4RGVjKTtcblxuICAgICAgfTtcblxuXG4gICAgICAvLyDQv9C+0LrQsNC30LDRgtGMINGB0LvQtdC00YPRjtGJ0LjQuSDRgdC70LDQudC0XG4gICAgICBpZiAoICR0aGlzLmhhc0NsYXNzKCdzbGlkZXJfX2NvbnRyb2wtLW5leHQnKSApIHtcblxuICAgICAgICB2YXIgcHJldkluZGV4SW5jID0gX2luZGV4SW5jKHByZXZJbmRleCwgbWF4SW5kZXgpO1xuICAgICAgICB2YXIgbmV4dEluZGV4SW5jID0gX2luZGV4SW5jKG5leHRJbmRleCwgbWF4SW5kZXgpO1xuICAgICAgICBcbiAgICAgICAgX2Rpc3BsYXlTbGlkZShhY3RpdmVJbmRleCwgbmV4dEluZGV4LCBpdGVtcyk7XG4gICAgICAgIF9kaXNwbGF5SW5mbyhhY3RpdmVJbmRleCwgbmV4dEluZGV4LCBpbmZvSXRlbXMpO1xuXG4gICAgICAgIF9tb3ZlU21hbGxTbGlkZXIoJ3VwJywgcHJldkNvbnRyb2wsIHByZXZJbmRleEluYyk7XG4gICAgICAgIF9tb3ZlU21hbGxTbGlkZXIoJ2Rvd24nLCBuZXh0Q29udHJvbCwgbmV4dEluZGV4SW5jKTtcblxuICAgICAgfTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXRcbiAgfTtcblxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHByZWxvYWRlci5pbml0KCk7XG4gIG1vZGFsLmluaXQoKTtcbiAgaGFtYnVyZ2VyTWVudS5pbml0KCk7XG4gIHNjcm9sbEJ1dHRvbnMuaW5pdCgpO1xuXG5cblxuICAvLyDQvdCwINGB0YLRgNCw0L3QuNGG0LUgaW5kZXhcbiAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PSAnL2luZGV4Lmh0bWwnIHx8IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PSAnLycpIHtcblxuICAgIHBhcmFsbGF4LmluaXQoKTtcbiAgICBsb2dpbkZvcm0uaW5pdCgpO1xuICAgIGZsaXBDYXJkLmluaXQoKTtcbiAgfVxuXG5cbiAgLy8g0L3QsCDRgdGC0YDQsNC90LjRhtC1IGJsb2dcbiAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PSAnL2Jsb2cuaHRtbCcpIHtcblxuICAgIC8vINCc0L7QtNGD0LvRjCBibG9nTWVudSDQtNC+0LvQttC10L0g0LHRi9GC0Ywg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC9INC/0L7RgdC70LUg0L7RgtGA0LjRgdC+0LLQutC4INCy0YHQtdGFINGN0LvQtdC80LXQvdGC0L7QsixcbiAgICAvLyDQtNC70Y8g0YfQtdCz0L4g0LvQvtCz0LjRh9C90L4g0LHRi9C70L4g0LHRiyDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0YwgZG9jdW1lbnQucmVhZHlcbiAgICAvLyDQndC+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNC1IGRvY3VtZW50LnJlYWR5INGC0YPRgiDQvdC10LLQvtC30LzQvtC20L3QviDQuNC3LdC30LAg0L/RgNC10LvQvtCw0LTQtdGA0LAsIFxuICAgIC8vINGC0LDQuiDQutCw0Log0LTQu9GPINC/0YDQsNCy0LjQu9GM0L3QvtC5INGA0LDQsdC+0YLRiyDQv9GA0LXQu9C+0LDQtNC10YDQsCDRgyDQstGB0LXRhSDRjdC70LXQvNC10L3RgtC+0LIg0YHQvdCw0YfQsNC70LAg0YHRgtC+0LjRgiBkaXNwbGF5OiBub25lLlxuICAgIC8vINC40Lct0LfQsCDRjdGC0L7Qs9C+IGRvY3VtZW50LnJlYWR5INGB0YDQsNCx0LDRgtGL0LLQsNC10YIg0YHQu9C40YjQutC+0Lwg0YDQsNC90L4sINC60L7Qs9C00LAg0L7RgtGA0LjRgdC+0LLQsNC9INGC0L7Qu9GM0LrQviDQv9GA0LXQu9C+0LDQtNC10YAuXG4gICAgLy8gXG4gICAgLy8g0L/QvtGN0YLQvtC80YMg0L/RgNC40YjQu9C+0YHRjCDRgdC+0LfQtNCw0YLRjCBEZWZlcnJlZCDQvtCx0YrQtdC60YIg0LIg0LzQvtC00YPQu9C1IHByZWxvYWRlcjogcHJlbG9hZGVyLmNvbnRlbnRSZWFkeVxuICAgIC8vIHByZWxvYWRlci5jb250ZW50UmVhZHkg0L/QvtC70YPRh9Cw0LXRgiDQvNC10YLQvtC0IC5yZXNvbHZlKCkg0YLQvtC70YzQutC+INC/0L7RgdC70LUg0YLQvtCz0L4sINC60LDQuiDQstGB0LUg0Y3Qu9C10LzQtdC90YLRiyDQv9C+0LvRg9GH0LDRjtGCIGRpc3BsYXk6IGJsb2NrXG4gICAgLy8g0KHQvtC+0YLQstC10YLRgdGC0LLQtdC90L3Qviwg0LjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8gYmxvZ01lbnUg0L/RgNC+0LjRgdGF0L7QtNC40YIg0L/QvtGB0LvQtSDQv9C+0LvRg9GH0LXQvdC40Y8gZGlzcGxheTogYmxvY2sg0Lgg0L7RgtGA0LjRgdC+0LLQutC4INCy0YHQtdGFINGN0LvQtdC80LXQvdGC0L7QslxuXG4gICAgcHJlbG9hZGVyLmNvbnRlbnRSZWFkeS5kb25lKGZ1bmN0aW9uKCkgeyBcbiAgICAgIHNjcm9sbHNweS5pbml0KCk7XG4gICAgICBibG9nTWVudVBhbmVsLmluaXQoKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy8g0L3QsCDRgdGC0YDQsNC90LjRhtC1IHdvcmtzXG4gIGlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT0gJy93b3Jrcy5odG1sJykge1xuXG4gICAgYmx1ci5pbml0KCk7XG4gICAgc2xpZGVyLmluaXQoKTtcbiAgICBzbGlkZXJUaXRsZXNBbmltYXRpb24uaW5pdCgpO1xuICAgIGNvbnRhY3RGb3JtLmluaXQoKTtcbiAgfVxuXG5cbiAgLy8g0L3QsCDRgdGC0YDQsNC90LjRhtC1IGFib3V0XG4gIGlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT0gJy9hYm91dC5odG1sJykge1xuICAgIHNraWxsc0FuaW1hdGlvbi5pbml0KCk7XG4gIH1cblxuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
