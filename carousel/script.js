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

names = ["ISAAC", "CAIN", "MAGGIE", "JUDAS", "?????", "EDEN"]; 
currentIndex = 0;

$(".next").on("click", { d: "n" }, rotate);
$(".prev").on("click", { d: "p" }, rotate);

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
    // "-webkit-transform": "rotateX(-15deg) rotateY("+currdeg+"deg)",
    // "-moz-transform": "rotateX(-15deg) rotateY("+currdeg+"deg)",
    // "-o-transform": "rotateX(-15deg) rotateY("+currdeg+"deg)",
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
}