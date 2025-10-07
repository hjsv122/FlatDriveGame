const car = document.getElementById('car');
const moveBtn = document.getElementById('moveBtn');

let position = 10;
moveBtn.addEventListener('click', () => {
  position += 20;
  if(position > 550) position = 10;
  car.style.left = position + 'px';
});
