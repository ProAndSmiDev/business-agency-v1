const burgerButton: any = document.querySelector('.header-burger');
const closeButton: any = document.querySelector('.menu-close');
const menuList: any = document.querySelector('.menu');

burgerButton.addEventListener('click', () => {
  menuList.classList.add('menu--is-active');
});

closeButton.addEventListener('click', () => {
  menuList.classList.remove('menu--is-active');
});
