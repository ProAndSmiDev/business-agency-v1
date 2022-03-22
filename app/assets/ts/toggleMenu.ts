const burgerButton = document.querySelector('.header-burger');
const closeButton = document.querySelector('.menu-close');
const menuList = document.querySelector('.menu');

burgerButton.addEventListener('click', () => {
  menuList.classList.add('menu--is-active');
});

closeButton.addEventListener('click', () => {
  menuList.classList.remove('menu--is-active');
});
