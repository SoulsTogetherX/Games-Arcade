let nav_options = ["Home", "Snake", "Conway", "FlappyBird", "Ant_Pathing", "Super TTT", "Frogger", "Packman"];

const navBoard = document.getElementById("nav");

for (option of nav_options) {
	var link = document.createElement("a");
	link.innerHTML = option;
	link.href = "./" + option + ".html";

	var div = document.createElement("div");
	if (fileName == option)
		div.className = "nav-option-current";
	else
		div.className = "nav-option";

	div.appendChild(link)
	navBoard.appendChild(div)
}