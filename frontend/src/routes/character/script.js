import { router } from "../../app.js";
import { customalert } from '../../components/alert/script.js';
import { get_user } from "../../components/user/script.js";


let carousel;
let	item_a;
let	item_b;
let	item_c;
let	item_d;
let	item_e;
let	item_f;
let	currdeg;
let	currdegA;
let	currdegB;
let	currdegC;
let	turn;
let currentIndex;
let match_name;

setTimeout(function() {
    let preloadDiv = document.querySelector('div.preload');
    
    if (preloadDiv) {
        preloadDiv.classList.remove('preload');
    } else {
        console.error("Div not found lol");
    }
}, 500);

const stats = {
	"ISAAC": {
	  life: "../../static/assets/character/3.png",
	  str: "../../static/assets/character/2.png",
	  speed: "../../static/assets/character/2.png"
	},
	"CAIN": {
		life: "../../static/assets/character/2.png",
		str: "../../static/assets/character/3.png",
		speed: "../../static/assets/character/3.png"
	},
	"MAGGIE": {
		life: "../../static/assets/character/4.png",
		str: "../../static/assets/character/2.png",
		speed: "../../static/assets/character/1.png"
	},
	"JUDAS": {
		life: "../../static/assets/character/1.png",
		str: "../../static/assets/character/4.png",
		speed: "../../static/assets/character/2.png"
	},
	"?????": {
		life: "../../static/assets/character/1.png",
		str: "../../static/assets/character/2.png",
		speed: "../../static/assets/character/2.png"
	},
	"EVE": {
		life: "../../static/assets/character/3.png",
		str: "../../static/assets/character/1.png",
		speed: "../../static/assets/character/2.png"
	}
  };

const names = ["ISAAC", "CAIN", "MAGGIE", "JUDAS", "?????", "EVE"]; 

function handleKeydown(e) {
	if (e.key === "ArrowRight") {
		rotate({ data: { d: "n" } });
	} else if (e.key === "ArrowLeft") {
		rotate({ data: { d: "p" } });
	}
}


function updateStats(character)
{
	var characterStats = stats[character];
	
	$(".life-stat").html('<img src="' + characterStats.life + '" alt="life stat">');
	$(".str-stat").html('<img src="' + characterStats.str + '" alt="strength stat">');
	$(".speed-stat").html('<img src="' + characterStats.speed + '" alt="speed stat">');
}


function rotate(e)
{
  if(e.data.d=="n"){
    currdeg = currdeg - 60;
	currdegA = currdegA + 60;

	if (turn == 0)
	{
		currdegC = currdegC + 120;
	}
	else
	{
		currdegB = currdegB + 60;
		currdegC = currdegC + 60;
	}
	turn++;
	currentIndex = (currentIndex + 1) % names.length;
  }
  if(e.data.d=="p"){
    currdeg = currdeg + 60;
	currdegA = currdegA - 60;
	if (turn == 0)
	{
    	currdegB = currdegB - 120;

	}
	else
	{
		currdegB = currdegB - 60;
    	currdegC = currdegC - 60;

	}
	turn++;
	currentIndex = (currentIndex - 1 + names.length) % names.length;

  }
  carousel.css({
    "transform": "rotateX(-20deg) rotateY("+currdeg+"deg)"
  });
  item_a.css({
	"transform": "rotateY(0deg) translateZ(11vw) rotateY("+currdegA+"deg)"
  });
  item_b.css({
	"transform": "rotateY(60deg) translateZ(11vw) rotateY("+currdegB+"deg)"
  });
  item_c.css({
	"transform": "rotateY(120deg) translateZ(11vw) rotateY("+currdegC+"deg)"
  });
  item_d.css({
	"transform": "rotateY(180deg) translateZ(11vw) rotateY("+currdegA+"deg)"
  });
  item_e.css({
	"transform": "rotateY(240deg) translateZ(11vw) rotateY("+currdegB+"deg)"
  });
  item_f.css({
	"transform": "rotateY(300deg) translateZ(11vw) rotateY("+currdegC+"deg)"
  });

  $(".name-text").text(names[currentIndex]);
  updateStats(names[currentIndex]);
}

export async function initComponent() {
	const user = await get_user();
	if (!user) {
		customalert('Error', 'You are not logged in', true);
		router.navigate('/');
	}
	carousel = $(".carousel");
	item_a = $(".item_a");
	item_b = $(".item_b");
	item_c = $(".item_c");
	item_d = $(".item_d");
	item_e = $(".item_e");
	item_f = $(".item_f");
	currdeg  = 0;
	currdegA  = 0;
	currdegB  = 0;
	currdegC  = 0;
	turn = 0;
	currentIndex = 0;

	const urlParams = new URLSearchParams(window.location.search);
  	match_name = urlParams.get('match_name');

	document.querySelector(".next").addEventListener("click", function() {
		rotate({ data: { d: "n" } });
	});

	document.querySelector(".prev").addEventListener("click", function() {
		rotate({ data: { d: "p" } });
	});

	document.addEventListener('keydown', handleKeydown);

	document.querySelectorAll('.game').forEach(game => {
		game.addEventListener('click', function (e) {
			const baseHref = e.target.getAttribute('href');
			if (baseHref === '/pong' && match_name)
				router.navigate(baseHref + `/private?character=${currentIndex}&match_name=${match_name}`);
			else
				router.navigate(baseHref + `?character=${currentIndex}`);
		});
	});
  }
  
  export async function cleanupComponent() {
	document.removeEventListener('keydown', handleKeydown);
  }
