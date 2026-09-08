document.addEventListener("DOMContentLoaded", () => {

const hour = new Date().getHours();

let greeting = "Good evening";

if(hour < 12){
greeting = "Good morning";
}
else if(hour < 18){
greeting = "Good afternoon";
}

const welcome = document.querySelector(".profile-card h2");

if(welcome){
welcome.innerHTML = `${greeting}, Giovanni!`;
}

document.querySelectorAll(".card").forEach(card=>{

card.addEventListener("mouseenter",()=>{

card.style.transform="translateY(-8px) scale(1.02)";

});

card.addEventListener("mouseleave",()=>{

card.style.transform="translateY(0) scale(1)";

});

});

document.querySelectorAll(".badge").forEach((badge,index)=>{

badge.style.opacity="0";

badge.style.transform="translateY(20px)";

setTimeout(()=>{

badge.style.transition=".5s";

badge.style.opacity="1";

badge.style.transform="translateY(0)";

},index*150);

});

});