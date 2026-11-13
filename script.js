const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.primary-nav');
function closeMenu(){if(!menuButton||!nav)return;nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation menu')}
if(menuButton&&nav){
 menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'Open navigation menu':'Close navigation menu');nav.classList.toggle('open',!open)});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
 window.addEventListener('resize',()=>{if(window.innerWidth>1100)closeMenu()});
}
document.querySelectorAll('form[data-demo-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const feedback=form.querySelector('.form-feedback');if(feedback)feedback.textContent='Thank you. This demo form is ready to connect to your booking or account system.';form.reset()}));
