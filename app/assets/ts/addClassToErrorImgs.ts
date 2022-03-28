const imgs = document.querySelectorAll('img');

imgs.forEach((item) => {
  item.addEventListener('error', () => item.classList.add('error-img'))});
