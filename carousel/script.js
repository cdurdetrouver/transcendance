var stats = {
	"ISAAC": {
	  life: "assets/character/3.png",
	  str: "assets/character/2.png",
	  speed: "assets/character/2.png"
	},
	"CAIN": {
		life: "assets/character/2.png",
		str: "assets/character/3.png",
		speed: "assets/character/3.png"
	},
	"MAGGIE": {
		life: "assets/character/4.png",
		str: "assets/character/2.png",
		speed: "assets/character/1.png"
	},
	"JUDAS": {
		life: "assets/character/1.png",
		str: "assets/character/4.png",
		speed: "assets/character/2.png"
	},
	"?????": {
		life: "assets/character/1.png",
		str: "assets/character/2.png",
		speed: "assets/character/2.png"
	},
	"EVE": {
		life: "assets/character/3.png",
		str: "assets/character/1.png",
		speed: "assets/character/2.png"
	}
  };

var carousel = $(".carousel"),
  a = $(".a"),
  b = $(".b"),
  c = $(".c"),
  d = $(".d"),
  t = $(".e"),
  f = $(".f"),
  currdeg  = 0,
  currdegA  = 0,
  currdegB  = 0,
  currdegC  = 0,
  turn = 0;

names = ["ISAAC", "CAIN", "MAGGIE", "JUDAS", "?????", "EVE"]; 
currentIndex = 0;

function updateStats(character)
{
	var characterStats = stats[character];
	
	$(".life-stat").html('<img src="' + characterStats.life + '" alt="life stat">');
	$(".str-stat").html('<img src="' + characterStats.str + '" alt="strength stat">');
	$(".speed-stat").html('<img src="' + characterStats.speed + '" alt="speed stat">');
}


$(document).ready(function() {
	$(".next").on("click", { d: "n" }, rotate);
	$(".prev").on("click", { d: "p" }, rotate);

	$(document).on("keydown", function(e) {
		if (e.key === "ArrowRight") {
			rotate({ data: { d: "n" } });
		} else if (e.key === "ArrowLeft") {
			rotate({ data: { d: "p" } });
		}
	});

	const lines = $(".line");
    let currentLineIndex = 0;

    function updateArrowPosition() {
        const arrowTop = 1 + currentLineIndex * 5; //5vh
        $('.arrow').css('top', `${arrowTop}vh`);
    }

    updateArrowPosition();

    $(document).on('keydown', function(e) {
        if (e.key === 'ArrowUp') {
            if (currentLineIndex > 0) {
                currentLineIndex--; 
                updateArrowPosition(); 
            }
        } else if (e.key === 'ArrowDown') {
            if (currentLineIndex < lines.length - 1) {
                currentLineIndex++;
                updateArrowPosition();
            }
        }
    });
});

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
  a.css({
	"transform": "rotateY(0deg) translateZ(11vw) rotateY("+currdegA+"deg)"
  });
  b.css({
	"transform": "rotateY(60deg) translateZ(11vw) rotateY("+currdegB+"deg)"
  });
  c.css({
	"transform": "rotateY(120deg) translateZ(11vw) rotateY("+currdegC+"deg)"
  });
  d.css({
	"transform": "rotateY(180deg) translateZ(11vw) rotateY("+currdegA+"deg)"
  });
  t.css({
	"transform": "rotateY(240deg) translateZ(11vw) rotateY("+currdegB+"deg)"
  });
  f.css({
	"transform": "rotateY(300deg) translateZ(11vw) rotateY("+currdegC+"deg)"
  });

  $(".name-text").text(names[currentIndex]);
  updateStats(names[currentIndex]);
}




const arrow = document.querySelector('.arrow');
const lines = document.querySelectorAll('.line');

lines.forEach((line, index) => {
    line.addEventListener('mouseenter', () => {
        const lineHeight = line.getBoundingClientRect().height;
        arrow.style.top = `${index * lineHeight}px`; // Adjust top position based on actual line height
    });
});